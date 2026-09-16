import os
import sys
import io
import json
import zipfile
import tempfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure repo packages and apps/api are in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "packages"))
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

# Set isolated storage directory for tests
test_storage = tempfile.mkdtemp(prefix="tt_test_storage_")
os.environ["TT_STORAGE_DIR"] = test_storage

import main
from main import app

client = TestClient(app)

def test_health_and_local_mode():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["mode"] == "local"
    assert "storage_dir" in data

def test_two_creates_are_distinct_owned_records():
    # 1. Create Twin 1 (Alice)
    files1 = [
        ("files", ("README.md", b"# Hydraulic Actuator\n> High-pressure valve assembly")),
        ("files", ("spec.md", b"# Spec\nOperating pressure: 200 bar")),
        ("files", ("bom.csv", b"part,material,qty,unit_cost_usd,supplier\nValve Body,Al 7075-T6,1,45.0,Local CNC\nPiston,Steel 316L,1,15.0,MetalWorks")),
    ]
    res1 = client.post("/api/twins/create", files=files1, data={"creator": "Alice"})
    assert res1.status_code == 200
    data1 = res1.json()
    id1 = data1["id"]
    tok1 = data1["owner_token"]
    assert id1 and tok1
    assert data1["discovery"]["title"] == "Hydraulic Actuator"
    assert data1["discovery"]["components_count"] == 2

    # 2. Create Twin 2 (Bob)
    files2 = [
        ("files", ("README.md", b"# Solar Tracker\n> Dual-axis tracking mechanism")),
        ("files", ("spec.md", b"# Spec\nTracking precision: 0.1 deg")),
        ("files", ("bom.csv", b"part,material,qty,unit_cost_usd,supplier\nChassis,Steel,1,80.0,SteelCo")),
    ]
    res2 = client.post("/api/twins/create", files=files2, data={"creator": "Bob"})
    assert res2.status_code == 200
    data2 = res2.json()
    id2 = data2["id"]
    tok2 = data2["owner_token"]
    assert id2 and tok2

    # Verify they are distinct
    assert id1 != id2
    assert tok1 != tok2

    # 3. Fetch both twins
    get1 = client.get(f"/api/twins/{id1}")
    assert get1.status_code == 200
    twin1 = get1.json()
    assert twin1["creator"] == "Alice"
    assert twin1["current_version"]["title"] == "Hydraulic Actuator"

    get2 = client.get(f"/api/twins/{id2}")
    assert get2.status_code == 200
    twin2 = get2.json()
    assert twin2["creator"] == "Bob"
    assert twin2["current_version"]["title"] == "Solar Tracker"

def test_owner_edit_authorization_and_denial():
    # Create test twin
    files = [("files", ("README.md", b"# Original Device\n> Initial summary"))]
    res = client.post("/api/twins/create", files=files, data={"creator": "Alice"})
    assert res.status_code == 200
    d = res.json()
    twin_id = d["id"]
    owner_tok = d["owner_token"]

    # 1. Edit with valid owner token
    edit_res = client.patch(
        f"/api/twins/{twin_id}",
        data={"title": "Updated Device Title", "summary": "Updated summary description"},
        headers={"X-Twin-Owner-Token": owner_tok}
    )
    assert edit_res.status_code == 200
    
    # Confirm persistence
    get_res = client.get(f"/api/twins/{twin_id}")
    assert get_res.status_code == 200
    assert get_res.json()["current_version"]["title"] == "Updated Device Title"
    assert get_res.json()["current_version"]["summary"] == "Updated summary description"

    # 2. Edit with wrong token -> 403
    forbidden_res = client.patch(
        f"/api/twins/{twin_id}",
        data={"title": "Hacked Title"},
        headers={"X-Twin-Owner-Token": "tok_wrong_attacker_token"}
    )
    assert forbidden_res.status_code == 403

    # 3. Edit without token -> 403
    unauth_res = client.patch(
        f"/api/twins/{twin_id}",
        data={"title": "Hacked Title Without Token"}
    )
    assert unauth_res.status_code == 403

    # 4. Edit nonexistent twin -> 404
    not_found_res = client.patch(
        "/api/twins/nonexistent_9999",
        data={"title": "Does Not Matter"},
        headers={"X-Twin-Owner-Token": owner_tok}
    )
    assert not_found_res.status_code == 404

def test_telemetry_requires_owner_and_validates():
    files = [("files", ("README.md", b"# Test Telemetry Rig\n> Rig"))]
    res = client.post("/api/twins/create", files=files, data={"creator": "Alice"})
    twin_id = res.json()["id"]
    tok = res.json()["owner_token"]

    # 1. Telemetry upload without token -> 403
    csv_content = b"timestamp_s,ambient_C,inlet_C,outlet_C,flow_ml_s\n0,22.0,80.0,45.0,5.0\n1,22.0,79.0,46.0,5.0\n"
    res_no_tok = client.post(
        f"/api/twins/{twin_id}/tests",
        files=[("file", ("test_run_1.csv", csv_content, "text/csv"))]
    )
    assert res_no_tok.status_code == 403

    # 2. Telemetry upload with empty CSV -> 400
    res_empty = client.post(
        f"/api/twins/{twin_id}/tests",
        files=[("file", ("empty.csv", b"", "text/csv"))],
        headers={"X-Twin-Owner-Token": tok}
    )
    assert res_empty.status_code == 400

    # 3. Telemetry upload with valid owner token -> 200
    res_ok = client.post(
        f"/api/twins/{twin_id}/tests",
        files=[("file", ("test_run_1.csv", csv_content, "text/csv"))],
        headers={"X-Twin-Owner-Token": tok},
        data={"title": "Bench Test #1"}
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "success"

    # Verify tests list
    test_list_res = client.get(f"/api/twins/{twin_id}/tests")
    assert test_list_res.status_code == 200
    assert test_list_res.json()["summary"]["physical_tests_count"] == 1

def test_real_calibration_only_when_both_series_exist():
    # 1. Generic upload without simulation or tests -> calibration_rmse is None
    files_no_test = [
        ("files", ("README.md", b"# Simple Mechanical Bracket\n> Standard mounting bracket")),
        ("files", ("spec.md", b"# Spec\nLoad capacity: 50 kg")),
    ]
    res1 = client.post("/api/twins/create", files=files_no_test)
    assert res1.status_code == 200
    doc1 = res1.json()["twin"]
    assert doc1["evidence"]["calibration_rmse"] is None
    assert doc1["evidence"]["test_runs_count"] == 0
    assert "Physical bench testing and experimental telemetry pending." in doc1["unknowns_and_assumptions"]

    # 2. Upload with simulation results AND test telemetry -> real calibration calculated
    sim_results = {"beverage_temp_C": [50.0 - 0.5 * i for i in range(20)]}
    test_csv = "timestamp_s,outlet_C\n" + "\n".join(f"{i},{50.0 - 0.5 * i + 0.1}" for i in range(20))

    files_with_test = [
        ("files", ("README.md", b"# Dynamic Thermal System\n> Thermal model")),
        ("files", ("simulation_results.json", json.dumps(sim_results).encode("utf-8"))),
        ("files", ("test_run.csv", test_csv.encode("utf-8"))),
    ]
    res2 = client.post("/api/twins/create", files=files_with_test)
    assert res2.status_code == 200
    doc2 = res2.json()["twin"]
    assert doc2["evidence"]["calibration_rmse"] is not None
    assert round(doc2["evidence"]["calibration_rmse"], 2) == 0.10

def test_export_reimport_roundtrip():
    # 1. Create twin via factory
    files = [
        ("files", ("README.md", b"# Exportable Twin\n> Testing export and reimport")),
        ("files", ("spec.md", b"# Specification\nReimport verification")),
        ("files", ("bom.csv", b"part,material,qty,unit_cost_usd\nBolt,Steel,4,0.50")),
    ]
    create_res = client.post("/api/twins/create", files=files, data={"creator": "Carol"})
    assert create_res.status_code == 200
    original_id = create_res.json()["id"]

    # 2. Download bundle
    download_res = client.get(f"/api/twins/{original_id}/download")
    assert download_res.status_code == 200
    zip_bytes = download_res.content

    # Verify bundle structure
    with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
        namelist = zf.namelist()
        assert "manifest.json" in namelist
        assert "README.md" in namelist
        assert "spec.md" in namelist
        manifest = json.loads(zf.read("manifest.json"))
        assert manifest["title"] == "Exportable Twin"

    # 3. Re-import via /api/twins/upload
    upload_res = client.post(
        "/api/twins/upload",
        files=[("file", ("exported_twin.zip", zip_bytes, "application/zip"))],
        data={"creator": "Carol Re-importer"}
    )
    assert upload_res.status_code == 200
    new_id = upload_res.json()["id"]
    assert new_id != original_id

    # Verify re-imported twin
    get_reimported = client.get(f"/api/twins/{new_id}")
    assert get_reimported.status_code == 200
    data = get_reimported.json()
    assert data["creator"] == "Carol Re-importer"
    assert data["current_version"]["title"] == "Exportable Twin"

def test_factory_create_with_embedded_manifest_has_single_manifest():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as zf:
        zf.writestr("manifest.json", json.dumps({"version": "1.0.0", "title": "Pre-manifest Twin", "summary": "Has manifest", "license": "MIT", "assets": []}))
        zf.writestr("README.md", b"# Pre-manifest Twin\n> Summary")
        zf.writestr("spec.md", b"# Spec")

    res = client.post(
        "/api/twins/create",
        files=[("files", ("bundle.zip", buf.getvalue(), "application/zip"))],
        data={"creator": "Dave"}
    )
    assert res.status_code == 200
    twin_id = res.json()["id"]

    download_res = client.get(f"/api/twins/{twin_id}/download")
    assert download_res.status_code == 200
    with zipfile.ZipFile(io.BytesIO(download_res.content), 'r') as zf:
        manifest_entries = [name for name in zf.namelist() if name.lower() == "manifest.json"]
        assert len(manifest_entries) == 1

def test_path_traversal_prevention():
    # 1. Path traversal in factory create
    files_bad = [
        ("files", ("../evil.txt", b"malicious content"))
    ]
    res = client.post("/api/twins/create", files=files_bad)
    assert res.status_code == 400

    # 2. Zip traversal check on upload
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as zf:
        zf.writestr("../evil.txt", b"exploit")
        zf.writestr("manifest.json", json.dumps({"version": "1.0.0", "title": "T", "summary": "S", "license": "MIT", "assets": []}))
    res_zip = client.post(
        "/api/twins/upload",
        files=[("file", ("traversal.zip", buf.getvalue(), "application/zip"))]
    )
    assert res_zip.status_code == 400

    # 3. Path traversal in asset fetch
    res_asset = client.get("/api/twins/dummy/assets/%2e%2e/etc/passwd")
    assert res_asset.status_code in [400, 404]

def test_validator_cli_exit_code():
    import subprocess
    # Run validator on nonexistent file
    proc = subprocess.run(
        [sys.executable, "-m", "twinthink.validator", "non_existent_file.zip"],
        cwd=str(REPO_ROOT / "packages"),
        capture_output=True,
        text=True
    )
    assert proc.returncode != 0
