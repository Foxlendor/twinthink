"""
TwinThink Milestone M4 Acceptance Tests:
Universal Tooling, Unified CLI Command Surface, and Model Context Protocol (MCP) Server.
"Every interface is a client of the same Twin protocol."

Verifies:
1. Canonical TwinService lifecycle operations (create, inspect, edit, sign, verify, export, import).
2. Canonical BOM inspect and validation (acyclicity, orphans, cost rollups).
3. Capability issuance, authorization verification, and cryptographic revocation.
4. Empirical evidence attachment, simulation metrics, and node-level provenance tracking.
5. EU Digital Product Passport (DPP) tiered projection.
6. Unified CLI command surface (`tt twin *`, `tt bom *`, `tt access *`, `tt evidence *`, `tt provenance *`, `tt dpp *`).
7. MCP JSON-RPC 2.0 stdio protocol compliance (initialize, tools/list, tools/call).
8. Multi-client equivalence across CLI, MCP, and Service/API.
"""

import os
import sys
import json
import uuid
import tempfile
import subprocess
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "packages"))
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

from twinthink.service import TwinService
from twinthink.mcp.server import McpServer, PROTOCOL_VERSION, TOOL_DEFINITIONS
from twinthink.crypto import (
    Keypair,
    get_or_create_default_identity,
    DEFAULT_KEYSTORE_DIR
)
from twinthink.bom import CyclicBomError, OrphanBomNodeError

SAMPLE_BOM_CSV = """level,part_number,name,type,quantity,unit_cost,supplier,domain,rights_mode
0,SYS-100,Smart Cryo Cooler,assembly,1,,Internal,system,Open Development
1,ENG-200,Cryo Chilling Engine,subassembly,1,180.00,CryoDynamics,thermal,Copyleft Hardware
2,VAL-301,Precision Cryo Valve,part,2,45.00,CryoDynamics,mechanical,Copyleft Hardware
2,SEN-302,Temperature Sensor Probe,part,1,12.50,SensorsCorp,electrical,Open Development
1,STR-201,Vacuum Insulated Shell,part,1,85.00,InsulTech,structural,Open Development
"""

@pytest.fixture
def temp_store():
    tmp_dir = tempfile.mkdtemp(prefix="tt_test_m4_")
    service = TwinService(storage_dir=tmp_dir)
    yield service, tmp_dir

# =============================================================================
# 1. CANONICAL SERVICE TESTS
# =============================================================================

def test_service_twin_lifecycle(temp_store):
    service, _ = temp_store

    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(
        files=files,
        creator="Alice Engineer",
        title="Cryo Cooler Alpha",
        rights_mode="Open Development"
    )

    twin_id = created["id"]
    assert twin_id is not None
    assert created["title"] == "Cryo Cooler Alpha"

    # Inspect
    insp = service.twin_inspect(twin_id)
    assert insp["id"] == twin_id
    assert insp["creator"] == "Alice Engineer"
    assert insp["bom_nodes_count"] >= 5
    assert insp["revisions_count"] == 0

    # Edit
    edited = service.twin_edit(
        twin_id=twin_id,
        title="Cryo Cooler Production",
        summary="Updated production build",
        rights_mode="Dual Commercial / Non-Commercial",
        owner_token=created["owner_token"]
    )
    assert edited["manifest"]["title"] == "Cryo Cooler Production"
    assert edited["manifest"]["declared_rights_mode"] == "Dual Commercial / Non-Commercial"

    # Sign revision R0
    signed_r0 = service.twin_sign(twin_id=twin_id, revision_name="R0", notes="Initial production baseline")
    assert signed_r0["revision"] == "R0"
    assert signed_r0["commit_hash"] is not None
    assert signed_r0["signature"] is not None

    # Sign revision R1
    signed_r1 = service.twin_sign(twin_id=twin_id, revision_name="R1", notes="Thermal recalibration")
    assert signed_r1["revision"] == "R1"

    # Verify revision chain
    ver_res = service.twin_verify(twin_id)
    assert ver_res["valid"] is True
    assert ver_res["checks"]["revisions_count"] == 2

def test_service_bom_operations(temp_store):
    service, tmp_dir = temp_store

    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(files=files, title="Cryo Cooler BOM Test")
    twin_id = created["id"]

    # bom_inspect via twin_id
    bom_res = service.bom_inspect(twin_id)
    assert bom_res["nodes_count"] >= 5
    # Total cost = 102.50 (subassembly) + 85.00 = 187.50
    assert bom_res["total_rolled_up_cost"] == 187.5
    assert bom_res["graph_hash"] is not None

    # bom_validate on valid twin
    val_res = service.bom_validate(twin_id)
    assert val_res["valid"] is True
    assert val_res["orphans_count"] == 0
    assert val_res["cycles_detected"] == 0

    # bom_validate on cyclic CSV file
    cyclic_csv = """level,part_number,name,type,quantity,unit_cost,supplier,domain,rights_mode
0,A,Node A,assembly,1,10.0,Internal,system,Open Development
1,B,Node B,subassembly,1,5.0,Internal,system,Open Development
1,A,Node A Recursive,subassembly,1,10.0,Internal,system,Open Development
"""
    cyclic_file = Path(tmp_dir) / "cyclic.csv"
    cyclic_file.write_text(cyclic_csv, encoding="utf-8")

    val_cyclic = service.bom_validate(cyclic_file)
    assert val_cyclic["valid"] is False
    assert "CYCLIC" in val_cyclic.get("summary", "").upper() or "Topological" in val_cyclic.get("summary", "")

def test_service_access_and_capabilities(temp_store):
    service, _ = temp_store

    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(files=files, title="Protected Twin")
    twin_id = created["id"]

    subject_did = "did:twin:bob_consultant_123456"
    token = service.access_grant(
        twin_id=twin_id,
        subject=subject_did,
        permissions=["read", "bom:read", "evidence:attach"],
        expires_hours=48.0
    )

    assert token["token_id"].startswith("cap_")
    assert token["subject"] == subject_did
    assert token["twin_id"] == twin_id
    assert "bom:read" in token["permissions"]
    assert token["signature"] is not None

    # Revoke capability
    rev_rec = service.access_revoke(
        token_id=token["token_id"],
        reason="Audit completed"
    )
    assert rev_rec["token_id"] == token["token_id"]
    assert rev_rec["reason"] == "Audit completed"

def test_service_evidence_and_provenance(temp_store):
    service, _ = temp_store

    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(files=files, title="Empirical Cryo")
    twin_id = created["id"]

    # Attach evidence
    test_csv = "timestamp,ambient_C,inlet_C,outlet_C\n0,22.0,85.0,55.2\n10,22.0,85.0,54.8\n20,22.0,85.0,54.5\n"
    ev_res = service.evidence_attach(
        twin_id=twin_id,
        title="Cryo Thermal Pull-Down Test",
        csv_content=test_csv,
        evidence_type="physical_test",
        operator="@DrFreeze",
        notes="Cryo chamber at 1 atm",
        metrics={"chilling_efficiency": 0.94},
        target_node_id="ENG-200"
    )

    assert ev_res["test_id"].startswith(f"test_{twin_id}_")
    assert ev_res["status"] in ["verified", "unverified"]
    assert ev_res["target_node_id"] == "ENG-200"

    # Provenance ledger inspection
    ledger = service.provenance_show(twin_id=twin_id, node_id="ENG-200")
    assert len(ledger) >= 1
    assert any(p.get("action") == "evidence_attached" for p in ledger)

def test_service_dpp_preview(temp_store):
    service, _ = temp_store

    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(files=files, title="EU Battery System")
    twin_id = created["id"]

    dpp_pub = service.dpp_preview(twin_id=twin_id, tier="public")
    assert dpp_pub["twin_id"] == twin_id
    assert "components" in dpp_pub

    dpp_sc = service.dpp_preview(twin_id=twin_id, tier="supply_chain")
    assert dpp_sc["twin_id"] == twin_id

def test_service_bundle_export_import(temp_store):
    service, tmp_dir = temp_store

    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(files=files, title="Exportable Twin")
    twin_id = created["id"]
    service.twin_sign(twin_id, "R0", notes="Baseline")

    export_path = Path(tmp_dir) / "test_export.twin"
    data, out_p = service.twin_export(twin_id, output_path=export_path)
    assert out_p.exists()
    assert len(data) > 0

    # Verify bundle offline
    bundle_ver = service.twin_verify(export_path)
    assert bundle_ver["valid"] is True

    # Import into fresh store
    fresh_tmp = tempfile.mkdtemp(prefix="tt_test_fresh_")
    fresh_service = TwinService(storage_dir=fresh_tmp)
    imp_res = fresh_service.twin_import(bundle_source=export_path, target_twin_id="imp1")
    assert imp_res["twin_id"] == "imp1"
    assert imp_res["verification"]["valid"] is True

    fresh_insp = fresh_service.twin_inspect("imp1")
    assert fresh_insp["revisions_count"] >= 1

# =============================================================================
# 2. UNIFIED CLI COMMAND SURFACE TESTS
# =============================================================================

def test_cli_twin_commands(temp_store):
    _, tmp_dir = temp_store
    bom_file = Path(tmp_dir) / "test_bom.csv"
    bom_file.write_text(SAMPLE_BOM_CSV, encoding="utf-8")

    tt_py = str(REPO_ROOT / "apps" / "api" / "tt.py")

    # tt twin create
    cmd_create = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "create", "--title", "CLI Cryo Twin", "--creator", "CLI Tester",
        "--bom", str(bom_file), "--rights-mode", "Open Development"
    ]
    res = subprocess.run(cmd_create, capture_output=True, text=True, check=True)
    created = json.loads(res.stdout)
    twin_id = created["id"]
    assert twin_id is not None

    # tt twin inspect
    cmd_insp = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "inspect", twin_id
    ]
    res_insp = subprocess.run(cmd_insp, capture_output=True, text=True, check=True)
    insp = json.loads(res_insp.stdout)
    assert insp["id"] == twin_id
    assert insp["creator"] == "CLI Tester"

    # tt twin edit
    cmd_edit = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "edit", twin_id, "--title", "CLI Cryo V2",
        "--owner-token", created["owner_token"]
    ]
    res_edit = subprocess.run(cmd_edit, capture_output=True, text=True, check=True)
    assert json.loads(res_edit.stdout)["manifest"]["title"] == "CLI Cryo V2"

    # tt twin sign
    cmd_sign = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "sign", twin_id, "--revision", "R0", "--notes", "Signed from CLI"
    ]
    res_sign = subprocess.run(cmd_sign, capture_output=True, text=True, check=True)
    signed = json.loads(res_sign.stdout)
    assert signed["revision"] == "R0"
    assert signed["signature"] is not None

    # tt twin verify
    cmd_ver = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "verify", twin_id
    ]
    res_ver = subprocess.run(cmd_ver, capture_output=True, text=True, check=True)
    ver = json.loads(res_ver.stdout)
    assert ver["valid"] is True

    # tt twin export
    out_bundle = Path(tmp_dir) / "cli_bundle.twin"
    cmd_exp = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "export", twin_id, "--output", str(out_bundle)
    ]
    subprocess.run(cmd_exp, capture_output=True, text=True, check=True)
    assert out_bundle.exists()

    # tt twin import
    cmd_imp = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "import", str(out_bundle), "--twin-id", "climp"
    ]
    res_imp = subprocess.run(cmd_imp, capture_output=True, text=True, check=True)
    imp = json.loads(res_imp.stdout)
    assert imp["twin_id"] == "climp"
    assert imp["verification"]["valid"] is True

def test_cli_bom_and_governance_commands(temp_store):
    service, tmp_dir = temp_store
    files = {"bom.csv": SAMPLE_BOM_CSV.encode("utf-8")}
    created = service.twin_create(files=files, title="Gov Twin")
    twin_id = created["id"]

    tt_py = str(REPO_ROOT / "apps" / "api" / "tt.py")

    # tt bom inspect
    cmd_b_insp = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "bom", "inspect", twin_id
    ]
    res_b_insp = subprocess.run(cmd_b_insp, capture_output=True, text=True, check=True)
    b_insp = json.loads(res_b_insp.stdout)
    assert b_insp["total_rolled_up_cost"] == 187.5

    # tt bom validate
    cmd_b_val = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "bom", "validate", twin_id
    ]
    res_b_val = subprocess.run(cmd_b_val, capture_output=True, text=True, check=True)
    b_val = json.loads(res_b_val.stdout)
    assert b_val["valid"] is True

    # tt access grant
    cmd_grant = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "access", "grant", twin_id, "--subject", "did:twin:auditor99",
        "--permissions", "read,bom:read"
    ]
    res_grant = subprocess.run(cmd_grant, capture_output=True, text=True, check=True)
    tok = json.loads(res_grant.stdout)
    assert tok["token_id"].startswith("cap_")

    # tt access revoke
    cmd_rev = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "access", "revoke", tok["token_id"], "--reason", "CLI Revocation Test"
    ]
    res_rev = subprocess.run(cmd_rev, capture_output=True, text=True, check=True)
    rev = json.loads(res_rev.stdout)
    assert rev["token_id"] == tok["token_id"]

    # tt evidence attach
    cmd_ev = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "evidence", "attach", twin_id, "--title", "CLI Calibration",
        "--metrics", json.dumps({"passed": True})
    ]
    res_ev = subprocess.run(cmd_ev, capture_output=True, text=True, check=True)
    ev = json.loads(res_ev.stdout)
    assert ev["twin_id"] == twin_id

    # tt provenance show
    cmd_prov = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "provenance", "show", twin_id
    ]
    res_prov = subprocess.run(cmd_prov, capture_output=True, text=True, check=True)
    prov = json.loads(res_prov.stdout)
    assert isinstance(prov, list)

    # tt dpp preview
    cmd_dpp = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "dpp", "preview", twin_id
    ]
    res_dpp = subprocess.run(cmd_dpp, capture_output=True, text=True, check=True)
    dpp = json.loads(res_dpp.stdout)
    assert dpp["twin_id"] == twin_id

# =============================================================================
# 3. MODEL CONTEXT PROTOCOL (MCP) SERVER TESTS
# =============================================================================

def test_mcp_initialize_and_tools_list(temp_store):
    service, _ = temp_store
    server = McpServer(service=service)

    # initialize
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {},
            "clientInfo": {"name": "test-agent", "version": "1.0"}
        }
    }
    init_resp = server.handle_request(init_req)
    assert init_resp["jsonrpc"] == "2.0"
    assert init_resp["id"] == 1
    assert init_resp["result"]["protocolVersion"] == PROTOCOL_VERSION
    assert init_resp["result"]["serverInfo"]["name"] == "twinthink-mcp"

    # tools/list
    list_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {}
    }
    list_resp = server.handle_request(list_req)
    tools = list_resp["result"]["tools"]
    tool_names = [t["name"] for t in tools]

    expected_tools = [
        "twin_create", "twin_inspect", "twin_edit", "twin_sign", "twin_verify",
        "twin_export", "twin_import", "bom_inspect", "bom_validate",
        "access_grant", "access_revoke", "evidence_attach", "provenance_show", "dpp_preview"
    ]
    for exp in expected_tools:
        assert exp in tool_names

def test_mcp_tool_execution(temp_store):
    service, tmp_dir = temp_store
    server = McpServer(service=service)

    # 1. twin_create via MCP
    create_call = {
        "jsonrpc": "2.0",
        "id": 10,
        "method": "tools/call",
        "params": {
            "name": "twin_create",
            "arguments": {
                "title": "MCP Generated Engine",
                "creator": "Antigravity Assistant",
                "bom_csv": SAMPLE_BOM_CSV,
                "rights_mode": "Open Development"
            }
        }
    }
    create_resp = server.handle_request(create_call)
    assert create_resp["result"]["isError"] is False
    res_text = create_resp["result"]["content"][0]["text"]
    created = json.loads(res_text)
    twin_id = created["id"]
    assert twin_id is not None

    # 2. bom_inspect via MCP
    bom_call = {
        "jsonrpc": "2.0",
        "id": 11,
        "method": "tools/call",
        "params": {
            "name": "bom_inspect",
            "arguments": {"twin_id": twin_id}
        }
    }
    bom_resp = server.handle_request(bom_call)
    assert bom_resp["result"]["isError"] is False
    bom_data = json.loads(bom_resp["result"]["content"][0]["text"])
    assert bom_data["total_rolled_up_cost"] == 187.5

    # 3. twin_sign via MCP
    sign_call = {
        "jsonrpc": "2.0",
        "id": 12,
        "method": "tools/call",
        "params": {
            "name": "twin_sign",
            "arguments": {
                "twin_id": twin_id,
                "revision_name": "R0",
                "notes": "Signed via MCP tool"
            }
        }
    }
    sign_resp = server.handle_request(sign_call)
    assert sign_resp["result"]["isError"] is False
    signed_data = json.loads(sign_resp["result"]["content"][0]["text"])
    assert signed_data["revision"] == "R0"
    assert signed_data["signature"] is not None

    # 4. access_grant via MCP
    access_call = {
        "jsonrpc": "2.0",
        "id": 13,
        "method": "tools/call",
        "params": {
            "name": "access_grant",
            "arguments": {
                "twin_id": twin_id,
                "subject": "did:twin:agent_partner",
                "permissions": ["read", "bom:read"]
            }
        }
    }
    acc_resp = server.handle_request(access_call)
    assert acc_resp["result"]["isError"] is False
    tok = json.loads(acc_resp["result"]["content"][0]["text"])
    assert tok["token_id"].startswith("cap_")

    # 5. dpp_preview via MCP
    dpp_call = {
        "jsonrpc": "2.0",
        "id": 14,
        "method": "tools/call",
        "params": {
            "name": "dpp_preview",
            "arguments": {"twin_id": twin_id}
        }
    }
    dpp_resp = server.handle_request(dpp_call)
    assert dpp_resp["result"]["isError"] is False
    dpp_data = json.loads(dpp_resp["result"]["content"][0]["text"])
    assert dpp_data["twin_id"] == twin_id

# =============================================================================
# 4. MULTI-CLIENT EQUIVALENCE TEST
# =============================================================================

def test_multi_client_identical_state(temp_store):
    """
    Demonstrates that:
    1. A Twin created via CLI (`tt twin create`),
    2. Signed via MCP (`tools/call twin_sign`),
    3. And inspected via API/Service (`TwinService.twin_inspect`),
    all operate against the exact same canonical state and cryptographic invariants.
    """
    service, tmp_dir = temp_store
    bom_file = Path(tmp_dir) / "equiv_bom.csv"
    bom_file.write_text(SAMPLE_BOM_CSV, encoding="utf-8")

    tt_py = str(REPO_ROOT / "apps" / "api" / "tt.py")

    # Step 1: Create via CLI
    cmd = [
        sys.executable, tt_py, "--storage-dir", tmp_dir, "--json",
        "twin", "create", "--title", "Multi-Client Equivalence Twin",
        "--bom", str(bom_file)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    created = json.loads(res.stdout)
    twin_id = created["id"]

    # Step 2: Sign via MCP server instance connected to same storage
    server = McpServer(service=service)
    sign_call = {
        "jsonrpc": "2.0",
        "id": 99,
        "method": "tools/call",
        "params": {
            "name": "twin_sign",
            "arguments": {
                "twin_id": twin_id,
                "revision_name": "R0",
                "notes": "Signed via MCP"
            }
        }
    }
    sign_resp = server.handle_request(sign_call)
    mcp_sign_result = json.loads(sign_resp["result"]["content"][0]["text"])

    # Step 3: Inspect via TwinService / API directly
    service_insp = service.twin_inspect(twin_id)

    # Step 4: Verify complete cryptographic equivalence across interfaces
    assert service_insp["revisions_count"] == 1
    rev_record = service_insp["revisions"][0]

    assert rev_record["revision"] == "R0"
    assert rev_record["signature"] == mcp_sign_result["signature"]
    assert rev_record["graph_hash"] == mcp_sign_result["graph_hash"]
    assert service_insp["rolled_up_unit_cost"] == 187.5

    # Step 5: Verify offline verification passes for this CLI-created, MCP-signed Twin
    ver_res = service.twin_verify(twin_id)
    assert ver_res["valid"] is True
