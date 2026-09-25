"""Shadow continuity log.

A Shadow's history is an append-only chain of events. The server assigns every
timestamp and links each event to the previous one by hash, so continuity
("someone kept returning to this") is evidence rather than a claim: a client
cannot backdate an event, and any edit to history breaks the chain.

Shadows are private by default. Listing requires explicit publication, and the
web client does not publish yet (public posting needs a moderation decision).
"""

import hashlib
import json
import time
import uuid
from typing import Callable, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

EVENT_KINDS = {"cast", "thought", "rewrite", "let_go", "take_back", "return", "evidence"}
MAX_TEXT = 280
GENESIS = "0" * 64


class CastBody(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT)
    x: float = Field(ge=-1.25, le=1.25)
    y: float = Field(ge=-1.25, le=1.25)


class EventBody(BaseModel):
    kind: str
    target: Optional[str] = None  # thought id the event is about
    parent: Optional[str] = None  # for new thoughts: parent thought id (None = the Shadow)
    text: Optional[str] = Field(default=None, max_length=MAX_TEXT)
    x: Optional[float] = Field(default=None, ge=-1.0, le=1.0)
    y: Optional[float] = Field(default=None, ge=-1.0, le=1.0)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def event_hash(prev: str, seq: int, t_ms: int, kind: str, payload: str) -> str:
    material = f"{prev}|{seq}|{t_ms}|{kind}|{payload}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def make_router(get_db: Callable, clock: Callable[[], int] = lambda: int(time.time() * 1000)) -> APIRouter:
    router = APIRouter(prefix="/api/shadows", tags=["shadows"])

    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS shadows (
            id TEXT PRIMARY KEY,
            owner_token_hash TEXT NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            published INTEGER NOT NULL DEFAULT 0,
            created_ms INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS shadow_events (
            shadow_id TEXT NOT NULL,
            seq INTEGER NOT NULL,
            t_ms INTEGER NOT NULL,
            kind TEXT NOT NULL,
            payload TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            hash TEXT NOT NULL,
            PRIMARY KEY (shadow_id, seq)
        );
        """
    )
    conn.commit()
    conn.close()

    def _owner(conn, shadow_id: str, token: Optional[str]) -> bool:
        row = conn.execute("SELECT owner_token_hash FROM shadows WHERE id = ?", (shadow_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Shadow not found")
        return bool(token) and _hash_token(token) == row["owner_token_hash"]

    def _append(conn, shadow_id: str, kind: str, payload: dict) -> dict:
        last = conn.execute(
            "SELECT seq, t_ms, hash FROM shadow_events WHERE shadow_id = ? ORDER BY seq DESC LIMIT 1", (shadow_id,)
        ).fetchone()
        seq = (last["seq"] + 1) if last else 0
        prev = last["hash"] if last else GENESIS
        # time only moves forward, even if the host clock steps back
        t_ms = max(clock(), (last["t_ms"] + 1) if last else 0)
        body = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        h = event_hash(prev, seq, t_ms, kind, body)
        conn.execute(
            "INSERT INTO shadow_events (shadow_id, seq, t_ms, kind, payload, prev_hash, hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (shadow_id, seq, t_ms, kind, body, prev, h),
        )
        return {"seq": seq, "t": t_ms, "kind": kind, **payload, "hash": h}

    def _events(conn, shadow_id: str):
        rows = conn.execute(
            "SELECT seq, t_ms, kind, payload, prev_hash, hash FROM shadow_events WHERE shadow_id = ? ORDER BY seq",
            (shadow_id,),
        ).fetchall()
        return rows

    def _thought_ids(rows) -> set:
        return {json.loads(r["payload"]).get("id") for r in rows if r["kind"] == "thought"}

    @router.post("")
    def cast(body: CastBody):
        shadow_id = uuid.uuid4().hex[:12]
        token = f"shd_{uuid.uuid4().hex}"
        conn = get_db()
        now = clock()
        conn.execute(
            "INSERT INTO shadows (id, owner_token_hash, x, y, published, created_ms) VALUES (?, ?, ?, ?, 0, ?)",
            (shadow_id, _hash_token(token), body.x, body.y, now),
        )
        ev = _append(conn, shadow_id, "cast", {"text": body.text})
        conn.commit()
        conn.close()
        return {"id": shadow_id, "owner_token": token, "event": ev}

    @router.post("/{shadow_id}/events")
    def add_event(shadow_id: str, body: EventBody, x_shadow_owner_token: Optional[str] = Header(None)):
        if body.kind not in EVENT_KINDS - {"cast"}:
            raise HTTPException(status_code=422, detail="Unknown event kind")
        conn = get_db()
        try:
            if not _owner(conn, shadow_id, x_shadow_owner_token):
                raise HTTPException(status_code=403, detail="Only the Shadow's owner can add to its history")
            known = _thought_ids(_events(conn, shadow_id))
            payload: dict = {}
            if body.kind == "thought":
                if not body.text or body.x is None or body.y is None:
                    raise HTTPException(status_code=422, detail="A thought needs text and a position")
                if body.parent is not None and body.parent not in known:
                    raise HTTPException(status_code=422, detail="Unknown parent thought")
                payload = {"id": uuid.uuid4().hex[:10], "parent": body.parent, "text": body.text, "x": body.x, "y": body.y}
            elif body.kind in {"rewrite"}:
                if not body.text:
                    raise HTTPException(status_code=422, detail="A rewrite needs text")
                if body.target is not None and body.target not in known:
                    raise HTTPException(status_code=422, detail="Unknown thought")
                payload = {"target": body.target, "text": body.text}
            elif body.kind in {"let_go", "take_back"}:
                if body.target not in known:
                    raise HTTPException(status_code=422, detail="Unknown thought")
                payload = {"target": body.target}
            elif body.kind == "evidence":
                if not body.text:
                    raise HTTPException(status_code=422, detail="Evidence needs a description")
                payload = {"target": body.target, "text": body.text}
            ev = _append(conn, shadow_id, body.kind, payload)
            conn.commit()
            return {"event": ev}
        finally:
            conn.close()

    @router.post("/{shadow_id}/publish")
    def publish(shadow_id: str, x_shadow_owner_token: Optional[str] = Header(None)):
        conn = get_db()
        try:
            if not _owner(conn, shadow_id, x_shadow_owner_token):
                raise HTTPException(status_code=403, detail="Only the owner can publish")
            conn.execute("UPDATE shadows SET published = 1 WHERE id = ?", (shadow_id,))
            conn.commit()
            return {"id": shadow_id, "published": True}
        finally:
            conn.close()

    @router.get("")
    def list_published():
        conn = get_db()
        rows = conn.execute("SELECT id, x, y, created_ms FROM shadows WHERE published = 1 ORDER BY created_ms").fetchall()
        conn.close()
        return {"shadows": [dict(r) for r in rows]}

    @router.get("/{shadow_id}")
    def get_shadow(shadow_id: str, x_shadow_owner_token: Optional[str] = Header(None)):
        conn = get_db()
        try:
            is_owner = _owner(conn, shadow_id, x_shadow_owner_token)
            row = conn.execute("SELECT id, x, y, published, created_ms FROM shadows WHERE id = ?", (shadow_id,)).fetchone()
            if not row["published"] and not is_owner:
                raise HTTPException(status_code=404, detail="Shadow not found")
            events = [
                {"seq": r["seq"], "t": r["t_ms"], "kind": r["kind"], **json.loads(r["payload"]), "hash": r["hash"]}
                for r in _events(conn, shadow_id)
            ]
            return {**dict(row), "published": bool(row["published"]), "owner": is_owner, "events": events}
        finally:
            conn.close()

    @router.get("/{shadow_id}/verify")
    def verify(shadow_id: str, x_shadow_owner_token: Optional[str] = Header(None)):
        conn = get_db()
        try:
            is_owner = _owner(conn, shadow_id, x_shadow_owner_token)
            row = conn.execute("SELECT published FROM shadows WHERE id = ?", (shadow_id,)).fetchone()
            if not row["published"] and not is_owner:
                raise HTTPException(status_code=404, detail="Shadow not found")
            prev = GENESIS
            last_t = -1
            for i, r in enumerate(_events(conn, shadow_id)):
                ok = (
                    r["seq"] == i
                    and r["prev_hash"] == prev
                    and r["t_ms"] > last_t
                    and r["hash"] == event_hash(prev, r["seq"], r["t_ms"], r["kind"], r["payload"])
                )
                if not ok:
                    return {"id": shadow_id, "intact": False, "broken_at": i}
                prev = r["hash"]
                last_t = r["t_ms"]
            return {"id": shadow_id, "intact": True, "head": prev}
        finally:
            conn.close()

    return router
