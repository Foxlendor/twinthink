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
test_storage = tempfile.mkdtemp(prefix="tt_test_m2_storage_")
os.environ["TT_STORAGE_DIR"] = test_storage

import main
from main import app
from twinthink.bom import (
    BomNode,
    CostSpec,
    MaterialSpec,
    ManufacturingSpec,
    calculate_bom_costs,
    validate_bom_acyclic,
    build_bom_tree,
    flatten_bom_tree,
    parse_bom_csv,
    parse_bom_dict,
    CyclicBomError
)
from twinthink.validator import validate_bundle

client = TestClient(app)

# ============================================================================
# 1. BOM ENGINE UNIT TESTS
# ============================================================================

def test_bom_engine_3_tier_cost_rollup():
    """
    Verifies 3-tier bottom-up cost calculations:
    extended_cost = unit_cost * quantity
    assembly unit_cost = sum(child.extended_cost) + processing_cost
    """
    # Tier 3 (Leaves of Subassembly)
    rod = BomNode(
        node_id="part_rod",
        node_type="component",
        name="Piston Rod",
        quantity=1.0,
        cost=CostSpec(unit_cost=10.0, currency="USD")
    )
    seal = BomNode(
        node_id="part_seal",
        node_type="component",
        name="O-Ring Seal",
        quantity=2.0,
        cost=CostSpec(unit_cost=2.50, currency="USD")
    )

    # Tier 2 (Subassembly + Sibling Part)
    subassembly = BomNode(
        node_id="sub_piston",
        node_type="subassembly",
        name="Piston Subassembly",
        quantity=2.0,
        manufacturing=ManufacturingSpec(processing_cost=3.0),
        children=[rod, seal]
    )
    valve_body = BomNode(
        node_id="part_body",
        node_type="component",
        name="Valve Body",
        quantity=1.0,
        cost=CostSpec(unit_cost=40.0, currency="USD")
    )
    m4_screws = BomNode(
        node_id="part_m4",
        node_type="fastener",
        name="M4 Socket Screw",
        quantity=4.0,
        cost=CostSpec(unit_cost=0.50, currency="USD")
    )

    # Tier 1 (Root Assembly)
    root = BomNode(
        node_id="assembly_valve",
        node_type="assembly",
        name="Hydraulic Valve Assembly",
        quantity=1.0,
        manufacturing=ManufacturingSpec(processing_cost=10.0),
        children=[subassembly, valve_body, m4_screws]
    )

    # Execute Rollup
    calculate_bom_costs(root)

    # Assert Tier 3
    assert rod.cost.extended_cost == 10.0  # 10 * 1
    assert seal.cost.extended_cost == 5.0  # 2.5 * 2

    # Assert Tier 2 Subassembly: unit = (10 + 5) + 3 = 18; ext = 18 * 2 = 36
    assert subassembly.cost.unit_cost == 18.0
    assert subassembly.cost.extended_cost == 36.0

    # Assert Tier 2 Components
    assert valve_body.cost.extended_cost == 40.0  # 40 * 1
    assert m4_screws.cost.extended_cost == 2.0    # 0.5 * 4

    # Assert Tier 1 Root Assembly:
    # children ext sum = 36 + 40 + 2 = 78
    # unit = 78 + 10 (assembly processing) = 88.0
    # ext = 88.0 * 1 = 88.0
    assert root.cost.unit_cost == 88.0
    assert root.cost.extended_cost == 88.0

def test_bom_engine_cycle_detection_rejected():
    """
    Verifies that cyclic graphs (A -> B -> C -> A) are strictly rejected with CyclicBomError.
    """
    cyclic_nodes = [
        {"node_id": "part_a", "parent_id": "part_c"},
        {"node_id": "part_b", "parent_id": "part_a"},
        {"node_id": "part_c", "parent_id": "part_b"},
    ]
    with pytest.raises(CyclicBomError) as excinfo:
        validate_bom_acyclic(cyclic_nodes)
    assert "Cyclic BOM dependency detected" in str(excinfo.value)

def test_bom_engine_self_cycle_rejected():
    """Verifies that a self-referential loop (A -> A) is rejected."""
    self_loop = [{"node_id": "part_x", "parent_id": "part_x"}]
    with pytest.raises(CyclicBomError) as excinfo:
        validate_bom_acyclic(self_loop)
    assert "Self-referential cyclic BOM" in str(excinfo.value) or "Cyclic BOM dependency" in str(excinfo.value)

def test_bom_engine_missing_cost_honesty():
    """
    Verifies M0/M1/M2 rule: Missing pricing remains None / unknown, never fabricated.
    """
    known_part = BomNode(
        node_id="part_known",
        node_type="component",
        name="Known Part",
        quantity=1.0,
        cost=CostSpec(unit_cost=15.0)
    )
    unknown_part = BomNode(
        node_id="part_unquoted",
        node_type="component",
        name="Custom Machined Billet",
        quantity=1.0,
        cost=None  # Missing pricing
    )
    assembly = BomNode(
        node_id="assembly_mixed",
        node_type="assembly",
        name="Mixed Assembly",
        quantity=1.0,
        children=[known_part, unknown_part]
    )

    calculate_bom_costs(assembly)

    assert known_part.cost.extended_cost == 15.0
    assert unknown_part.cost is None
    # Assembly cost must be None (honest unknown) because one constituent is unpriced
    assert assembly.cost.unit_cost is None
    assert assembly.cost.extended_cost is None

def test_bom_csv_hierarchical_dot_notation():
    """
    Verifies CSV parsing with dot-level hierarchy (1, 1.1, 1.1.1, 1.2).
    """
    csv_content = """level,part_number,name,qty,unit,unit_cost,type,material
1,ASSY-100,Actuator Assembly,1,ea,,assembly,
1.1,CYL-200,Hydraulic Cylinder,1,ea,,subassembly,
1.1.1,ROD-01,Piston Rod,1,ea,25.00,component,316L Stainless
1.1.2,SEAL-01,Hydraulic Seal,2,ea,3.50,component,Viton
1.2,VALVE-01,Check Valve,1,ea,45.00,component,Al 7075-T6
"""
    root = parse_bom_csv(csv_content)
    assert root.part_number == "ASSY-100"
    assert len(root.children) == 2

    cylinder = next(c for c in root.children if c.part_number == "CYL-200")
    check_valve = next(c for c in root.children if c.part_number == "VALVE-01")

    assert len(cylinder.children) == 2
    # Cylinder cost: ROD (25 * 1) + SEAL (3.5 * 2 = 7) = 32.0
    assert cylinder.cost.unit_cost == 32.0
    assert cylinder.cost.extended_cost == 32.0

    # Valve cost: 45.0
    assert check_valve.cost.unit_cost == 45.0
    assert check_valve.cost.extended_cost == 45.0

    # Total root cost: 32 + 45 = 77.0
    assert root.cost.unit_cost == 77.0
    assert root.cost.extended_cost == 77.0

# ============================================================================
# 2. API INTEGRATION & DPP TESTS
# ============================================================================

def test_api_create_twin_with_hierarchical_bom_json():
    """
    Tests creating a twin with a hierarchical bom.json, verifying:
    - Ingestion parses tree
    - Total cost is rolled up
    - /api/twins/{id}/bom returns full tree
    - /api/twins/{id}/bom/dpp returns EU DPP traceability
    """
    bom_data = {
        "node_id": "valve_root",
        "node_type": "assembly",
        "name": "Precision Flow Valve",
        "part_number": "PFV-100",
        "quantity": 1.0,
        "children": [
            {
                "node_id": "sub_body",
                "node_type": "subassembly",
                "name": "Valve Housing Subassembly",
                "part_number": "VHB-01",
                "quantity": 1.0,
                "children": [
                    {
                        "node_id": "part_billet",
                        "node_type": "raw_material",
                        "name": "7075-T6 Al Billet",
                        "part_number": "BIL-7075",
                        "quantity": 1.0,
                        "material": {"name": "Al 7075-T6", "grade": "Aircraft", "recycled_content_pct": 25.0},
                        "manufacturing": {"process": "5-axis CNC Milling", "finish": "Hardcoat Anodize"},
                        "cost": {"unit_cost": 50.0, "currency": "USD"},
                        "supplier": "AeroMetals Co",
                        "dpp_id": "DPP-EU-7075-998"
                    }
                ]
            },
            {
                "node_id": "part_spring",
                "node_type": "component",
                "name": "Return Spring",
                "part_number": "SPR-302",
                "quantity": 2.0,
                "material": {"name": "302 Stainless Steel"},
                "cost": {"unit_cost": 4.50, "currency": "USD"},
                "supplier": "SpringCorp",
                "dpp_id": "DPP-EU-SPR-112"
            }
        ]
    }

    files = [
        ("files", ("README.md", b"# Precision Flow Valve\n> Aerospace valve")),
        ("files", ("bom.json", json.dumps(bom_data).encode("utf-8")))
    ]

    res = client.post("/api/twins/create", files=files, data={"creator": "Chief Engineer"})
    assert res.status_code == 200
    data = res.json()
    twin_id = data["id"]
    owner_token = data["owner_token"]

    # Verify BOM rollup: Billet ($50) + Springs (2 * $4.50 = $9) = $59.0
    structure = data["twin"]["structure"]
    assert structure["bom_root"] is not None
    assert structure["estimated_bom_usd"] == 59.0

    # Test GET /api/twins/{twin_id}/bom
    bom_res = client.get(f"/api/twins/{twin_id}/bom")
    assert bom_res.status_code == 200
    bom_info = bom_res.json()
    assert bom_info["twin_id"] == twin_id
    assert bom_info["total_cost"] == 59.0
    assert bom_info["currency"] == "USD"
    assert bom_info["bom_root"]["name"] == "Precision Flow Valve"

    # Test GET /api/twins/{twin_id}/bom/dpp (EU DPP compliance)
    dpp_res = client.get(f"/api/twins/{twin_id}/bom/dpp")
    assert dpp_res.status_code == 200
    dpp_info = dpp_res.json()
    assert dpp_info["dpp_version"] == "2027.1"
    assert dpp_info["manufacturer"] == "Chief Engineer"
    components = dpp_info["components"]
    assert len(components) >= 2

    billet = next(c for c in components if c["part_number"] == "BIL-7075")
    assert billet["material"] == "Al 7075-T6"
    assert billet["recycled_content_pct"] == 25.0
    assert billet["dpp_id"] == "DPP-EU-7075-998"
    assert billet["manufacturing_process"] == "5-axis CNC Milling"

def test_api_cyclic_bom_rejection():
    """
    Verifies that uploading a cyclic BOM to /api/twins/create returns HTTP 400.
    """
    cyclic_bom = {
        "node_id": "part_1",
        "name": "Part 1",
        "quantity": 1.0,
        "children": [
            {
                "node_id": "part_2",
                "name": "Part 2",
                "quantity": 1.0,
                "children": [
                    {
                        "node_id": "part_1",  # Cycle back to part_1
                        "name": "Part 1 Recursive",
                        "quantity": 1.0,
                        "children": []
                    }
                ]
            }
        ]
    }

    files = [
        ("files", ("README.md", b"# Bad Actuator")),
        ("files", ("bom.json", json.dumps(cyclic_bom).encode("utf-8")))
    ]

    res = client.post("/api/twins/create", files=files, data={"creator": "Tester"})
    assert res.status_code == 400
    detail = res.json()["detail"]
    assert "Cyclic BOM Error" in detail or "cycle" in detail.lower()

# ============================================================================
# 3. RESTART PERSISTENCE & EXPORT / IMPORT INTEGRITY
# ============================================================================

def test_twin_bom_restart_persistence_and_bundle_export():
    """
    Verifies:
    1. Twin with hierarchical BOM persists across database reconnections.
    2. Bundle zip downloaded via /api/twins/{id}/download contains manifest and valid BOM.
    3. validate_bundle verifies the exported zip successfully.
    """
    bom_data = {
        "node_id": "drone_root",
        "node_type": "assembly",
        "name": "Autonomous Delivery Drone",
        "quantity": 1.0,
        "children": [
            {
                "node_id": "motor_01",
                "node_type": "component",
                "name": "Brushless DC Motor",
                "quantity": 4.0,
                "cost": {"unit_cost": 22.0, "currency": "USD"}
            }
        ]
    }

    files = [
        ("files", ("README.md", b"# Autonomous Delivery Drone")),
        ("files", ("bom.json", json.dumps(bom_data).encode("utf-8")))
    ]
    res = client.post("/api/twins/create", files=files, data={"creator": "DroneLabs"})
    assert res.status_code == 200
    twin_id = res.json()["id"]

    # Phase 2: Simulate process restart by reading directly from new DB connection
    conn = main.get_db_local()
    row = conn.execute("SELECT manifest_json, document_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
    conn.close()

    assert row is not None
    doc = json.loads(row["document_json"])
    assert doc["structure"]["bom_root"]["name"] == "Autonomous Delivery Drone"
    assert doc["structure"]["bom_root"]["cost"]["extended_cost"] == 88.0  # 4 * 22

    # Phase 3: Download bundle zip
    dl_res = client.get(f"/api/twins/{twin_id}/download")
    assert dl_res.status_code == 200
    zip_bytes = dl_res.content

    # Save to temp zip and validate
    temp_zip = Path(test_storage) / f"downloaded_{twin_id}.zip"
    temp_zip.write_bytes(zip_bytes)

    val_res = validate_bundle(str(temp_zip))
    assert val_res is True
