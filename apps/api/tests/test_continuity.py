import sqlite3
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

from continuity import EVENT_KINDS, make_router  # noqa: E402

DB = Path(tempfile.mkdtemp(prefix="tt_continuity_")) / "continuity.db"


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


def begin(subject="wiki:Phonograph", note=None):
    res = client.post("/api/continuity", json={"subject": subject, **({"note": note} if note else {})})
    assert res.status_code == 200, res.text
    body = res.json()
    return body["id"], {"x-continuity-owner-token": body["owner_token"]}


def test_the_event_kinds_are_the_agreed_four():
    assert EVENT_KINDS == ("began", "revised", "returned", "evidence")


def test_history_is_server_timestamped_and_chained():
    lid, auth = begin(note="first heard it")
    clock.t += 5000
    client.post(f"/api/continuity/{lid}/events", json={"kind": "revised", "note": "second verse"}, headers=auth)
    clock.t += 5000
    client.post(f"/api/continuity/{lid}/events", json={"kind": "returned"}, headers=auth)
    clock.t -= 60_000  # the host clock steps backwards
    client.post(f"/api/continuity/{lid}/events", json={"kind": "evidence", "note": "a recording of it"}, headers=auth)

    data = client.get(f"/api/continuity/{lid}", headers=auth).json()
    assert data["subject"] == "wiki:Phonograph"
    assert [e["kind"] for e in data["events"]] == ["began", "revised", "returned", "evidence"]
    times = [e["t"] for e in data["events"]]
    # time only moves forward, even when the clock does not
    assert times == sorted(times) and len(set(times)) == len(times)
    assert client.get(f"/api/continuity/{lid}/verify", headers=auth).json()["intact"] is True


def test_a_client_cannot_set_the_time():
    lid, auth = begin()
    res = client.post(f"/api/continuity/{lid}/events", json={"kind": "returned", "t": 1}, headers=auth).json()
    assert res["event"]["t"] >= clock.t


def test_tampering_breaks_the_chain():
    lid, auth = begin()
    client.post(f"/api/continuity/{lid}/events", json={"kind": "returned"}, headers=auth)
    conn = get_db()
    conn.execute("UPDATE continuity_events SET t_ms = t_ms - 86400000 WHERE log_id = ? AND seq = 0", (lid,))
    conn.commit()
    conn.close()
    assert client.get(f"/api/continuity/{lid}/verify", headers=auth).json() == {"id": lid, "intact": False, "broken_at": 0}


def test_private_by_default_owner_only_writes_explicit_publishing():
    lid, auth = begin(subject="twin:demo-lamp")
    # private: it does not exist for anyone else, and is not listed
    assert client.get(f"/api/continuity/{lid}").status_code == 404
    assert client.get(f"/api/continuity/{lid}/verify").status_code == 404
    assert lid not in [r["id"] for r in client.get("/api/continuity").json()["logs"]]
    # only the owner writes or publishes
    wrong = {"x-continuity-owner-token": "ctn_wrong"}
    assert client.post(f"/api/continuity/{lid}/events", json={"kind": "returned"}, headers=wrong).status_code == 403
    assert client.post(f"/api/continuity/{lid}/publish").status_code == 403
    assert client.post(f"/api/continuity/{lid}/publish", headers=auth).status_code == 200
    # published: anyone can read, list by subject and verify, but still not write
    assert client.get(f"/api/continuity/{lid}").status_code == 200
    assert lid in [r["id"] for r in client.get("/api/continuity", params={"subject": "twin:demo-lamp"}).json()["logs"]]
    assert lid not in [r["id"] for r in client.get("/api/continuity", params={"subject": "wiki:Bicycle"}).json()["logs"]]
    assert client.get(f"/api/continuity/{lid}/verify").json()["intact"] is True
    assert client.post(f"/api/continuity/{lid}/events", json={"kind": "returned"}).status_code == 403


def test_rejects_what_is_not_part_of_the_primitive():
    lid, auth = begin()
    # only the four kinds, and "began" only once, at the start
    for kind in ("began", "cast", "thought", "let_go", "take_back", "anything"):
        assert client.post(f"/api/continuity/{lid}/events", json={"kind": kind}, headers=auth).status_code == 422
    assert client.post(f"/api/continuity/{lid}/events", json={"kind": "evidence"}, headers=auth).status_code == 422
    assert client.post(f"/api/continuity/{lid}/events", json={"kind": "returned", "note": "a" * 281}, headers=auth).status_code == 422
    # a subject is a stable id, not free text
    assert client.post("/api/continuity", json={"subject": ""}).status_code == 422
    assert client.post("/api/continuity", json={"subject": "has spaces in it"}).status_code == 422
    assert client.post("/api/continuity", json={"subject": "a" * 201}).status_code == 422
    assert client.get("/api/continuity/nope").status_code == 404
