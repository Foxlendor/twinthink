"""Continuity log: a persistence primitive for "someone kept returning to this".

A log follows one subject (any stable id: a Whoeuvre piece, a Twin, a public article) and holds
an append-only chain of events about it. The server assigns every timestamp and links each event
to the one before by hash, so continuity is evidence rather than a claim: a client cannot backdate
an event, and any edit to the history breaks the chain (see /verify).

Only the log's owner can append. Logs are private until the owner publishes them. The event kinds
are a short fixed list, kept here and nowhere else. Local (SQLite) mode only for now.
"""

import hashlib
import json
import time
import uuid
from typing import Callable, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

# "began" opens every log (it is written when the log is created); the rest are appended after
EVENT_KINDS = ("began", "revised", "returned", "evidence")
MAX_NOTE = 280
GENESIS = "0" * 64
SUBJECT = r"^[A-Za-z0-9][A-Za-z0-9_.:/()'%,~-]{0,199}$"


class BeginBody(BaseModel):
    subject: str = Field(pattern=SUBJECT)
    note: Optional[str] = Field(default=None, max_length=MAX_NOTE)


class EventBody(BaseModel):
    kind: str
    note: Optional[str] = Field(default=None, max_length=MAX_NOTE)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def event_hash(prev: str, seq: int, t_ms: int, kind: str, payload: str) -> str:
    material = f"{prev}|{seq}|{t_ms}|{kind}|{payload}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def make_router(get_db: Callable, clock: Callable[[], int] = lambda: int(time.time() * 1000)) -> APIRouter:
    router = APIRouter(prefix="/api/continuity", tags=["continuity"])

    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS continuity_logs (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL,
            owner_token_hash TEXT NOT NULL,
            published INTEGER NOT NULL DEFAULT 0,
            created_ms INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS continuity_logs_subject ON continuity_logs (subject);
        CREATE TABLE IF NOT EXISTS continuity_events (
            log_id TEXT NOT NULL,
            seq INTEGER NOT NULL,
            t_ms INTEGER NOT NULL,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            hash TEXT NOT NULL,
            PRIMARY KEY (log_id, seq)
        );
        """
    )
    conn.commit()
    conn.close()

    def _log(conn, log_id: str):
        row = conn.execute("SELECT * FROM continuity_logs WHERE id = ?", (log_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Log not found")
        return row

    def _is_owner(row, token: Optional[str]) -> bool:
        return bool(token) and _hash_token(token) == row["owner_token_hash"]

    def _readable(conn, log_id: str, token: Optional[str]):
        row = _log(conn, log_id)
        owner = _is_owner(row, token)
        # a private log does not exist for anyone but its owner
        if not row["published"] and not owner:
            raise HTTPException(status_code=404, detail="Log not found")
        return row, owner

    def _events(conn, log_id: str):
        return conn.execute(
            "SELECT seq, t_ms, kind, payload, prev_hash, hash FROM continuity_events WHERE log_id = ? ORDER BY seq",
            (log_id,),
        ).fetchall()

    def _append(conn, log_id: str, kind: str, payload: dict) -> dict:
        last = conn.execute(
            "SELECT seq, t_ms, hash FROM continuity_events WHERE log_id = ? ORDER BY seq DESC LIMIT 1", (log_id,)
        ).fetchone()
        seq = (last["seq"] + 1) if last else 0
        prev = last["hash"] if last else GENESIS
        # time only moves forward, even if the host clock steps back
        t_ms = max(clock(), (last["t_ms"] + 1) if last else 0)
        body = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        h = event_hash(prev, seq, t_ms, kind, body)
        conn.execute(
            "INSERT INTO continuity_events (log_id, seq, t_ms, kind, payload, prev_hash, hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (log_id, seq, t_ms, kind, body, prev, h),
        )
        return {"seq": seq, "t": t_ms, "kind": kind, **payload, "hash": h}

    @router.post("")
    def begin(body: BeginBody):
        log_id = uuid.uuid4().hex[:12]
        token = f"ctn_{uuid.uuid4().hex}"
        conn = get_db()
        try:
            conn.execute(
                "INSERT INTO continuity_logs (id, subject, owner_token_hash, published, created_ms) VALUES (?, ?, ?, 0, ?)",
                (log_id, body.subject, _hash_token(token), clock()),
            )
            ev = _append(conn, log_id, "began", {"note": body.note} if body.note else {})
            conn.commit()
            return {"id": log_id, "subject": body.subject, "owner_token": token, "event": ev}
        finally:
            conn.close()

    @router.post("/{log_id}/events")
    def add_event(log_id: str, body: EventBody, x_continuity_owner_token: Optional[str] = Header(None)):
        if body.kind not in EVENT_KINDS or body.kind == "began":
            raise HTTPException(status_code=422, detail=f"Event kind must be one of: {', '.join(EVENT_KINDS[1:])}")
        if body.kind == "evidence" and not (body.note and body.note.strip()):
            raise HTTPException(status_code=422, detail="Evidence needs a description")
        conn = get_db()
        try:
            if not _is_owner(_log(conn, log_id), x_continuity_owner_token):
                raise HTTPException(status_code=403, detail="Only the log's owner can add to it")
            ev = _append(conn, log_id, body.kind, {"note": body.note} if body.note else {})
            conn.commit()
            return {"event": ev}
        finally:
            conn.close()

    @router.post("/{log_id}/publish")
    def publish(log_id: str, x_continuity_owner_token: Optional[str] = Header(None)):
        conn = get_db()
        try:
            if not _is_owner(_log(conn, log_id), x_continuity_owner_token):
                raise HTTPException(status_code=403, detail="Only the owner can publish")
            conn.execute("UPDATE continuity_logs SET published = 1 WHERE id = ?", (log_id,))
            conn.commit()
            return {"id": log_id, "published": True}
        finally:
            conn.close()

    @router.get("")
    def list_published(subject: Optional[str] = Query(default=None, pattern=SUBJECT)):
        conn = get_db()
        try:
            if subject:
                rows = conn.execute(
                    "SELECT id, subject, created_ms FROM continuity_logs WHERE published = 1 AND subject = ? ORDER BY created_ms",
                    (subject,),
                ).fetchall()
            else:
                rows = conn.execute("SELECT id, subject, created_ms FROM continuity_logs WHERE published = 1 ORDER BY created_ms").fetchall()
            return {"logs": [dict(r) for r in rows]}
        finally:
            conn.close()

    @router.get("/{log_id}")
    def get_log(log_id: str, x_continuity_owner_token: Optional[str] = Header(None)):
        conn = get_db()
        try:
            row, owner = _readable(conn, log_id, x_continuity_owner_token)
            events = [
                {"seq": r["seq"], "t": r["t_ms"], "kind": r["kind"], **json.loads(r["payload"]), "hash": r["hash"]}
                for r in _events(conn, log_id)
            ]
            return {
                "id": row["id"],
                "subject": row["subject"],
                "created_ms": row["created_ms"],
                "published": bool(row["published"]),
                "owner": owner,
                "events": events,
            }
        finally:
            conn.close()

    @router.get("/{log_id}/verify")
    def verify(log_id: str, x_continuity_owner_token: Optional[str] = Header(None)):
        conn = get_db()
        try:
            _readable(conn, log_id, x_continuity_owner_token)
            prev = GENESIS
            last_t = -1
            for i, r in enumerate(_events(conn, log_id)):
                ok = (
                    r["seq"] == i
                    and r["prev_hash"] == prev
                    and r["t_ms"] > last_t
                    and r["hash"] == event_hash(prev, r["seq"], r["t_ms"], r["kind"], r["payload"])
                )
                if not ok:
                    return {"id": log_id, "intact": False, "broken_at": i}
                prev = r["hash"]
                last_t = r["t_ms"]
            return {"id": log_id, "intact": True, "head": prev}
        finally:
            conn.close()

    return router
