#!/usr/bin/env python3
"""
TwinThink Foundation Verification Script (M0 & M1)
Runs a live end-to-end verification against a running TwinThink API server.

Usage:
  # Phase 1: Create, edit, test permissions, export, and save state
  python scripts/verify_foundation.py --api http://127.0.0.1:8001

  # Restart your API server here...

  # Phase 2: Verify persistence and ownership post-restart
  python scripts/verify_foundation.py --api http://127.0.0.1:8001 --phase2
"""

import sys
import os
import json
import argparse
import io
import zipfile
import urllib.request
import urllib.parse
import urllib.error

STATE_FILE = "verify_state.json"

def make_multipart(files_dict, form_data):
    boundary = "----WebKitFormBoundaryTwinThinkVerification"
    body = bytearray()
    
    for key, value in form_data.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{value}\r\n".encode("utf-8"))

    for filename, content in files_dict.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(b"Content-Type: application/octet-stream\r\n\r\n")
        body.extend(content)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    content_type = f"multipart/form-data; boundary={boundary}"
    return body, content_type

def http_request(url, method="GET", data=None, headers=None):
    headers = headers or {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read(), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)

def run_phase1(api_base):
    print("==================================================")
    print(f"TwinThink Foundation Live E2E: Phase 1 ({api_base})")
    print("==================================================")

    # 1. Health check
    code, body, _ = http_request(f"{api_base}/health")
    assert code == 200, f"API health check failed with status {code}: {body.decode()}"
    health = json.loads(body)
    print(f"[*] API Health: OK (mode={health.get('mode')}, storage={health.get('storage_dir')})")

    # 2. Create Twin 1 (Alice)
    files1 = {
        "README.md": b"# Precision Hydraulic Valve\n> 5-axis milled high-pressure actuator",
        "spec.md": b"# Engineering Specification\n- Max Pressure: 350 bar\n- Temp: -40C to 120C",
        "bom.csv": b"part,material,qty,unit_cost_usd,supplier\nValve Body,Al 7075-T6,1,65.00,AeroCNC\nSpool,Stainless 440C,1,22.50,PrecisionParts"
    }
    body1, ct1 = make_multipart(files1, {"creator": "Alice"})
    code, res_body, _ = http_request(f"{api_base}/api/twins/create", method="POST", data=body1, headers={"Content-Type": ct1})
    assert code == 200, f"Failed to create Twin 1: {code} - {res_body.decode()}"
    t1_data = json.loads(res_body)
    t1_id = t1_data["id"]
    t1_token = t1_data["owner_token"]
    print(f"[+] Twin 1 created successfully: ID={t1_id}, Creator=Alice, Components={t1_data['discovery']['components_count']}")

    # 3. Create Twin 2 (Bob)
    files2 = {
        "README.md": b"# Autonomous Solar Tracking Node\n> Low-power dual-axis photovoltaic mount",
        "spec.md": b"# Specification\n- Power: 12V 2A\n- Motor: NEMA 17 Stepper",
        "bom.csv": b"part,material,qty,unit_cost_usd,supplier\nTracker Frame,Structural Steel,1,110.00,FabCo"
    }
    body2, ct2 = make_multipart(files2, {"creator": "Bob"})
    code, res_body, _ = http_request(f"{api_base}/api/twins/create", method="POST", data=body2, headers={"Content-Type": ct2})
    assert code == 200, f"Failed to create Twin 2: {code} - {res_body.decode()}"
    t2_data = json.loads(res_body)
    t2_id = t2_data["id"]
    t2_token = t2_data["owner_token"]
    print(f"[+] Twin 2 created successfully: ID={t2_id}, Creator=Bob, Components={t2_data['discovery']['components_count']}")

    assert t1_id != t2_id, "Twin IDs must be distinct!"
    assert t1_token != t2_token, "Owner tokens must be distinct!"

    # 4. Edit Twin 1 using Alice's token
    edit_payload = urllib.parse.urlencode({
        "title": "Precision Hydraulic Valve Rev B",
        "summary": "Updated with hardened 440C spool and leak-tested seals",
        "owner_token": t1_token
    }).encode("utf-8")
    code, res_body, _ = http_request(f"{api_base}/api/twins/{t1_id}", method="PATCH", data=edit_payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert code == 200, f"Owner edit failed: {code} - {res_body.decode()}"
    print(f"[+] Twin 1 edited by owner: new title='Precision Hydraulic Valve Rev B'")

    # 5. Access Control Tests
    # A. Edit Twin 1 using Bob's token -> 403
    bob_edit = urllib.parse.urlencode({"title": "Hijacked By Bob", "owner_token": t2_token}).encode("utf-8")
    code, _, _ = http_request(f"{api_base}/api/twins/{t1_id}", method="PATCH", data=bob_edit, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert code == 403, f"Expected 403 when editing with wrong owner token, got {code}"
    print("[+] Access Control: Edit with other creator's token correctly DENIED (403)")

    # B. Edit Twin 1 without token -> 403
    no_token_edit = urllib.parse.urlencode({"title": "Hijacked Without Token"}).encode("utf-8")
    code, _, _ = http_request(f"{api_base}/api/twins/{t1_id}", method="PATCH", data=no_token_edit, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert code == 403, f"Expected 403 when editing without token, got {code}"
    print("[+] Access Control: Edit without token correctly DENIED (403)")

    # 6. Export and Re-import
    code, zip_bytes, _ = http_request(f"{api_base}/api/twins/{t1_id}/download")
    assert code == 200, f"Export download failed: {code}"
    with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
        assert "manifest.json" in zf.namelist(), "Export bundle missing manifest.json"
        manifest = json.loads(zf.read("manifest.json"))
        assert manifest["title"] == "Precision Hydraulic Valve Rev B"
    print(f"[+] Twin 1 exported successfully ({len(zip_bytes)} bytes)")

    # Re-import via /upload
    reimport_body = bytearray()
    boundary = "----ReimportBoundary"
    reimport_body.extend(f"--{boundary}\r\n".encode("utf-8"))
    reimport_body.extend(b'Content-Disposition: form-data; name="creator"\r\n\r\nCarol Auditor\r\n')
    reimport_body.extend(f"--{boundary}\r\n".encode("utf-8"))
    reimport_body.extend(b'Content-Disposition: form-data; name="file"; filename="reimported.zip"\r\nContent-Type: application/zip\r\n\r\n')
    reimport_body.extend(zip_bytes)
    reimport_body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    code, res_body, _ = http_request(f"{api_base}/api/twins/upload", method="POST", data=reimport_body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    assert code == 200, f"Re-import upload failed: {code} - {res_body.decode()}"
    t3_data = json.loads(res_body)
    t3_id = t3_data["id"]
    print(f"[+] Re-import succeeded: new distinct ID={t3_id}, Creator=Carol Auditor")

    # Save state for Phase 2
    state = {
        "twin1": {"id": t1_id, "token": t1_token, "expected_title": "Precision Hydraulic Valve Rev B", "creator": "Alice"},
        "twin2": {"id": t2_id, "token": t2_token, "expected_title": "Autonomous Solar Tracking Node", "creator": "Bob"},
        "twin3": {"id": t3_id, "creator": "Carol Auditor"}
    }
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    print("\n>>> Phase 1 completed successfully!")
    print(f">>> Verification state saved to {STATE_FILE}")
    print(">>> Restart your API server now, then run with --phase2 to verify persistence.")

def run_phase2(api_base):
    print("==================================================")
    print(f"TwinThink Foundation Live E2E: Phase 2 ({api_base})")
    print("==================================================")

    if not os.path.exists(STATE_FILE):
        print(f"[-] State file {STATE_FILE} not found. Run Phase 1 first!")
        sys.exit(1)

    with open(STATE_FILE, "r", encoding="utf-8") as f:
        state = json.load(f)

    # 1. Health check
    code, body, _ = http_request(f"{api_base}/health")
    assert code == 200, f"API health check failed: {code}"
    print(f"[*] API Health: OK")

    # 2. Verify Twin 1 persistence
    t1 = state["twin1"]
    code, body, _ = http_request(f"{api_base}/api/twins/{t1['id']}")
    assert code == 200, f"Failed to retrieve Twin 1 after restart: {code}"
    data1 = json.loads(body)
    assert data1["creator"] == t1["creator"], f"Creator mismatch: {data1['creator']} vs {t1['creator']}"
    assert data1["current_version"]["title"] == t1["expected_title"], f"Title mismatch: {data1['current_version']['title']}"
    print(f"[+] Verified Twin 1 persisted across restart: ID={t1['id']}, Creator={data1['creator']}, Title='{data1['current_version']['title']}'")

    # 3. Verify Twin 2 persistence
    t2 = state["twin2"]
    code, body, _ = http_request(f"{api_base}/api/twins/{t2['id']}")
    assert code == 200, f"Failed to retrieve Twin 2 after restart: {code}"
    data2 = json.loads(body)
    assert data2["creator"] == t2["creator"]
    assert data2["current_version"]["title"] == t2["expected_title"]
    print(f"[+] Verified Twin 2 persisted across restart: ID={t2['id']}, Creator={data2['creator']}, Title='{data2['current_version']['title']}'")

    # 4. Verify Twin 3 (re-imported) persistence
    t3 = state["twin3"]
    code, body, _ = http_request(f"{api_base}/api/twins/{t3['id']}")
    assert code == 200, f"Failed to retrieve Twin 3 after restart: {code}"
    data3 = json.loads(body)
    assert data3["creator"] == t3["creator"]
    print(f"[+] Verified Twin 3 persisted across restart: ID={t3['id']}, Creator={data3['creator']}")

    # 5. Verify Ownership persists across restart
    # Alice can still edit Twin 1
    edit_payload = urllib.parse.urlencode({
        "title": "Precision Hydraulic Valve Rev C (Post-Restart)",
        "owner_token": t1["token"]
    }).encode("utf-8")
    code, res_body, _ = http_request(f"{api_base}/api/twins/{t1['id']}", method="PATCH", data=edit_payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert code == 200, f"Owner edit post-restart failed: {code}"
    print(f"[+] Ownership persists: Alice successfully edited Twin 1 post-restart")

    # Bob is still denied
    bob_edit = urllib.parse.urlencode({
        "title": "Bob Attack Post-Restart",
        "owner_token": t2["token"]
    }).encode("utf-8")
    code, _, _ = http_request(f"{api_base}/api/twins/{t1['id']}", method="PATCH", data=bob_edit, headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert code == 403, f"Expected 403 post-restart, got {code}"
    print(f"[+] Ownership persists: Unauthorized edit post-restart correctly DENIED (403)")

    print("\n==================================================")
    print("ALL FOUNDATION VERIFICATION CHECKS PASSED (M0 & M1)")
    print("==================================================")

def main():
    parser = argparse.ArgumentParser(description="TwinThink Foundation E2E Verifier")
    parser.add_argument("--api", default="http://127.0.0.1:8001", help="API base URL")
    parser.add_argument("--phase2", action="store_true", help="Run Phase 2 post-restart checks")
    args = parser.parse_args()

    api_base = args.api.rstrip("/")
    if args.phase2:
        run_phase2(api_base)
    else:
        run_phase1(api_base)

if __name__ == "__main__":
    main()
