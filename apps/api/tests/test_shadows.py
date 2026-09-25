import os
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

import sqlite3  # noqa: E402

from shadows import make_router  # noqa: E402

DB = Path(tempfile.mkdtemp(prefix="tt_shadows_")) / "shadows.db"


def get_db():
    conn = sqlite3.connect(str(DB))
    conn.row_factory = sqlite3.Row
    return conn


class Clock:
    def __init__(self):
        self.t = 1_700_000_000_000

    def __call__(self):
        return self.t


clock = Clock()
app = FastAPI()
app.include_router(make_router(get_db, clock))
client = TestClient(app)


def cast(text="a bridge you can fold"):
    res = client.post("/api/shadows", json={"text": text, "x": 0.1, "y": -0.2})
    assert res.status_code == 200
    body = res.json()
    return body["id"], {"x-shadow-owner-token": body["owner_token"]}


def test_history_is_server_timestamped_and_chained():
    sid, auth = cast()
    clock.t += 5000
    th = client.post(f"/api/shadows/{sid}/events", json={"kind": "thought", "text": "folding adds stiffness", "x": 0.4, "y": 0.1}, headers=auth).json()["event"]
    clock.t += 5000
    client.post(f"/api/shadows/{sid}/events", json={"kind": "rewrite", "target": th["id"], "text": "folding adds a lot of stiffness"}, headers=auth)
    clock.t -= 60_000  # host clock steps backwards
    client.post(f"/api/shadows/{sid}/events", json={"kind": "let_go", "target": th["id"]}, headers=auth)

    data = client.get(f"/api/shadows/{sid}", headers=auth).json()
    kinds = [e["kind"] for e in data["events"]]
    assert kinds == ["cast", "thought", "rewrite", "let_go"]
    times = [e["t"] for e in data["events"]]
    assert times == sorted(times) and len(set(times)) == len(times)
    assert client.get(f"/api/shadows/{sid}/verify", headers=auth).json()["intact"] is True


def test_tampering_breaks_the_chain():
    sid, auth = cast()
    client.post(f"/api/shadows/{sid}/events", json={"kind": "thought", "text": "x", "x": 0.2, "y": 0.2}, headers=auth)
    conn = get_db()
    conn.execute("UPDATE shadow_events SET t_ms = t_ms - 86400000 WHERE shadow_id = ? AND seq = 0", (sid,))
    conn.commit()
    conn.close()
    res = client.get(f"/api/shadows/{sid}/verify", headers=auth).json()
    assert res == {"id": sid, "intact": False, "broken_at": 0}


def test_private_by_default_and_owner_only_writes():
    sid, auth = cast()
    assert client.get(f"/api/shadows/{sid}").status_code == 404
    assert sid not in [s["id"] for s in client.get("/api/shadows").json()["shadows"]]
    res = client.post(f"/api/shadows/{sid}/events", json={"kind": "thought", "text": "y", "x": 0, "y": 0}, headers={"x-shadow-owner-token": "shd_wrong"})
    assert res.status_code == 403
    assert client.post(f"/api/shadows/{sid}/publish").status_code == 403
    assert client.post(f"/api/shadows/{sid}/publish", headers=auth).status_code == 200
    assert client.get(f"/api/shadows/{sid}").status_code == 200
    assert sid in [s["id"] for s in client.get("/api/shadows").json()["shadows"]]
    # the public can read and verify, but still not write
    assert client.get(f"/api/shadows/{sid}/verify").json()["intact"] is True
    assert client.post(f"/api/shadows/{sid}/events", json={"kind": "return"}).status_code == 403


def test_rejects_bad_events():
    sid, auth = cast()
    assert client.post(f"/api/shadows/{sid}/events", json={"kind": "cast"}, headers=auth).status_code == 422
    assert client.post(f"/api/shadows/{sid}/events", json={"kind": "let_go", "target": "nope"}, headers=auth).status_code == 422
    assert client.post(f"/api/shadows/{sid}/events", json={"kind": "thought", "text": "z", "x": 0, "y": 0, "parent": "nope"}, headers=auth).status_code == 422
    assert client.post("/api/shadows", json={"text": "", "x": 0, "y": 0}).status_code == 422
    assert client.post("/api/shadows", json={"text": "a" * 281, "x": 0, "y": 0}).status_code == 422
