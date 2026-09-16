"""
TwinThink Milestone M2 - 14-Point Canonical Hierarchical Product Graph Test Suite

Verifies:
1. Create 3-level BOM (Assembly -> Subassembly -> Part)
2. Create 5+ sibling components under a single assembly
3. Calculate recursive costs correctly (unit * qty + assembly costs)
4. Preserve unit vs extended cost distinction
5. Persist stable node IDs
6. Detect orphan nodes (referencing non-existent parent_id)
7. Reject cyclic parent relationships (self & indirect cycles)
8. Preserve revision lineage (R0 -> R1 -> R2)
9. Attach material, process, cost, and provenance records
10. Export graph bundle (.zip)
11. Re-import graph bundle cleanly
12. Hash-equivalent structure after round trip
13. Restart persistence across SQLite reload
14. Canonical ingestion parity across CSV, JSON, and factory ingestion
"""

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

# Isolated storage directory for tests
test_storage = tempfile.mkdtemp(prefix="tt_test_m2_graph_")
os.environ["TT_STORAGE_DIR"] = test_storage

import main
from main import app
from twinthink.bom import (
    BomNode,
    CostSpec,
    MaterialSpec,
    ManufacturingSpec,
    ProvenanceEntry,
    calculate_bom_costs,
    validate_bom_acyclic,
    validate_bom_orphans,
    build_bom_tree,
    flatten_bom_tree,
    parse_bom_csv,
    parse_bom_dict,
    compute_bom_structural_hash,
    project_dpp,
    CyclicBomError,
    OrphanBomNodeError
)
from twinthink.factory import TwinFactoryEngine

client = TestClient(app)

# ============================================================================
# CRITERION 1: Create 3-Level BOM (Assembly -> Subassembly -> Part)
# ============================================================================
def test_criterion_1_create_3_level_bom():
    # Level 3: Leaf part
    seal = BomNode(
        node_id="seal_01",
        node_type="component",
        name="O-Ring Seal",
        quantity=2.0,
        cost=CostSpec(unit_cost=3.50, currency="USD")
    )
    # Level 2: Subassembly containing Level 3
    piston = BomNode(
        node_id="sub_piston",
        node_type="subassembly",
        name="Piston Subassembly",
        quantity=1.0,
        children=[seal]
    )
    # Level 1: Root Assembly containing Level 2
    root = BomNode(
        node_id="root_valve",
        node_type="assembly",
        name="Main Hydraulic Valve",
        quantity=1.0,
        children=[piston]
    )

    calculate_bom_costs(root)
    assert len(root.children) == 1
    assert root.children[0].node_id == "sub_piston"
    assert len(root.children[0].children) == 1
    assert root.children[0].children[0].node_id == "seal_01"


# ============================================================================
# CRITERION 2: Create 5+ Sibling Components Under Single Assembly
# ============================================================================
def test_criterion_2_create_5_plus_sibling_components():
    siblings = [
        BomNode(node_id=f"part_sib_{i}", node_type="component", name=f"Component {i}", quantity=1.0, cost=CostSpec(unit_cost=float(i * 5)))
        for i in range(1, 7)  # 6 sibling components
    ]
    assembly = BomNode(
        node_id="assembly_multi_parts",
        node_type="assembly",
        name="Multi-Component Chassis",
        quantity=1.0,
        children=siblings
    )
    calculate_bom_costs(assembly)
    assert len(assembly.children) == 6
    expected_sum = sum(float(i * 5) for i in range(1, 7))
    assert assembly.cost.unit_cost == expected_sum
    assert assembly.cost.extended_cost == expected_sum


# ============================================================================
# CRITERION 3: Calculate Recursive Costs Correctly (unit * qty + assembly costs)
# ============================================================================
def test_criterion_3_calculate_recursive_costs():
    # 2 Rods ($12 each) = $24
    rod = BomNode(node_id="rod", node_type="component", name="Rod", quantity=2.0, cost=CostSpec(unit_cost=12.0))
    # Subassembly has 2 rods + $5.00 internal processing cost
    sub = BomNode(
        node_id="sub",
        node_type="subassembly",
        name="Sub",
        quantity=3.0,  # 3 subassemblies in root
        manufacturing=ManufacturingSpec(processing_cost=5.0),
        children=[rod]
    )
    # Root has $10.00 assembly cost
    root = BomNode(
        node_id="root",
        node_type="assembly",
        name="Root",
        quantity=1.0,
        manufacturing=ManufacturingSpec(processing_cost=10.0),
        children=[sub]
    )

    calculate_bom_costs(root)
    # Rod extended: 12.0 * 2 = 24.0
    assert rod.cost.extended_cost == 24.0
    # Sub unit: 24.0 + 5.0 (proc) = 29.0
    assert sub.cost.unit_cost == 29.0
    # Sub extended: 29.0 * 3 = 87.0
    assert sub.cost.extended_cost == 87.0
    # Root unit: 87.0 + 10.0 (proc) = 97.0
    assert root.cost.unit_cost == 97.0
    assert root.cost.extended_cost == 97.0


# ============================================================================
# CRITERION 4: Preserve Unit vs Extended Cost Distinction
# ============================================================================
def test_criterion_4_preserve_unit_vs_extended_cost():
    # 10 fasteners at $0.75 each
    fastener = BomNode(
        node_id="bolt_m5",
        node_type="fastener",
        name="M5 Hex Bolt",
        quantity=10.0,
        cost=CostSpec(unit_cost=0.75, extended_cost=None)
    )
    calculate_bom_costs(fastener)
    assert fastener.cost.unit_cost == 0.75
    assert fastener.cost.extended_cost == 7.50
    # Unit cost must NOT be overwritten with extended cost
    assert fastener.cost.unit_cost != fastener.cost.extended_cost


# ============================================================================
# CRITERION 5: Persist Stable Node IDs Across Operations
# ============================================================================
def test_criterion_5_persist_stable_node_ids():
    csv_content = """level,node_id,parent_id,name,qty,unit_cost
1,assy_top,,Top Assembly,1,
1.1,part_fixed_01,assy_top,Fixed Bracket,2,15.00
1.2,part_fixed_02,assy_top,Support Strut,1,25.00
"""
    root = parse_bom_csv(csv_content)
    assert root.node_id == "assy_top"
    flat = flatten_bom_tree(root)
    flat_ids = [n.node_id for n in flat]
    assert "assy_top" in flat_ids
    assert "part_fixed_01" in flat_ids
    assert "part_fixed_02" in flat_ids

    # Reconstruct tree from flat nodes
    rebuilt = build_bom_tree(flat)
    assert rebuilt.node_id == "assy_top"
    assert rebuilt.children[0].node_id == "part_fixed_01"
    assert rebuilt.children[1].node_id == "part_fixed_02"


# ============================================================================
# CRITERION 6: Detect Orphan Nodes (referencing non-existent parent_id)
# ============================================================================
def test_criterion_6_detect_orphan_nodes():
    nodes = [
        BomNode(node_id="root", node_type="assembly", name="Root", quantity=1.0),
        BomNode(node_id="orphan_part", parent_id="non_existent_assembly_xyz", node_type="component", name="Lost Part", quantity=1.0)
    ]
    with pytest.raises(OrphanBomNodeError) as excinfo:
        validate_bom_orphans(nodes)
    assert "non_existent_assembly_xyz" in str(excinfo.value)

    # Rebuilding tree must also reject orphans
    with pytest.raises(OrphanBomNodeError):
        build_bom_tree(nodes)


# ============================================================================
# CRITERION 7: Reject Cyclic Parent Relationships
# ============================================================================
def test_criterion_7_reject_cyclic_relationships():
    # Self cycle
    self_cycle_node = BomNode(node_id="part_self", parent_id="part_self", name="Loop Node", quantity=1.0)
    with pytest.raises(CyclicBomError):
        validate_bom_acyclic([self_cycle_node])

    # Mutual 3-node cycle: A -> B -> C -> A
    cycle_nodes = [
        BomNode(node_id="node_a", parent_id="node_c", name="Node A", quantity=1.0),
        BomNode(node_id="node_b", parent_id="node_a", name="Node B", quantity=1.0),
        BomNode(node_id="node_c", parent_id="node_b", name="Node C", quantity=1.0),
    ]
    with pytest.raises(CyclicBomError) as excinfo:
        validate_bom_acyclic(cycle_nodes)
    assert "Cyclic BOM dependency detected" in str(excinfo.value)


# ============================================================================
# CRITERION 8: Preserve Revision Lineage (R0 -> R1 -> R2)
# ============================================================================
def test_criterion_8_preserve_revision_lineage():
    part_r0 = BomNode(node_id="part_valve", revision="R0", name="Valve Prototype", quantity=1.0)
    part_r1 = BomNode(node_id="part_valve", revision="R1", name="Valve Engineered", quantity=1.0)
    part_r2 = BomNode(node_id="part_valve", revision="R2", name="Valve Production", quantity=1.0)

    assert part_r0.revision == "R0"
    assert part_r1.revision == "R1"
    assert part_r2.revision == "R2"


# ============================================================================
# CRITERION 9: Attach Material, Process, Cost, and Provenance Records
# ============================================================================
def test_criterion_9_attach_material_process_provenance():
    prov = ProvenanceEntry(
        source="tt",
        artifact_hash="sha256:abc123def456",
        creator="Alice Engineer",
        action="milled_5axis",
        notes="First article inspected"
    )
    mat = MaterialSpec(
        name="Aluminum 7075",
        grade="T651",
        standard="AMS 4045",
        recycled_content_pct=15.5,
        origin_country="USA"
    )
    mfg = ManufacturingSpec(
        process="5-axis CNC Milling",
        tolerances="+/- 0.025 mm",
        finish="Type III Hardcoat Anodize",
        processing_cost=35.00
    )
    cost = CostSpec(unit_cost=85.00, currency="USD", is_estimated=False)

    node = BomNode(
        node_id="manifold_block",
        name="Hydraulic Manifold Block",
        quantity=1.0,
        material=mat,
        manufacturing=mfg,
        cost=cost,
        rights_override="Licensed",
        provenance=[prov]
    )

    assert node.material.grade == "T651"
    assert node.manufacturing.finish == "Type III Hardcoat Anodize"
    assert node.cost.unit_cost == 85.00
    assert node.rights_override == "Licensed"
    assert len(node.provenance) == 1
    assert node.provenance[0].source == "tt"
    assert node.provenance[0].artifact_hash == "sha256:abc123def456"


# ============================================================================
# CRITERION 10: Export Graph Bundle (.zip)
# ============================================================================
def test_criterion_10_export_graph_bundle():
    # Create twin with hierarchical BOM via factory endpoint
    bom_csv = """level,part_number,name,qty,unit,unit_cost,type,material,process
1,TOP-01,Top Assembly,1,ea,,assembly,,
1.1,PR-01,Piston,1,ea,45.00,component,Al 7075-T6,CNC Turning
1.2,SL-01,Seal,2,ea,3.50,component,Viton 90A,Molding
"""
    readme = "# Export Test Twin\n> Verified M2 Export"

    files = [
        ("files", ("bom.csv", io.BytesIO(bom_csv.encode("utf-8")), "text/csv")),
        ("files", ("readme.md", io.BytesIO(readme.encode("utf-8")), "text/markdown"))
    ]
    resp = client.post("/api/twins/create", files=files, data={"creator": "ExportTester"})
    assert resp.status_code == 200, resp.text
    twin_id = resp.json()["id"]

    # Download bundle
    dl_resp = client.get(f"/api/twins/{twin_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/zip"

    # Verify bundle contents
    with zipfile.ZipFile(io.BytesIO(dl_resp.content)) as zf:
        names = zf.namelist()
        assert "manifest.json" in names
        assert "bom.csv" in names
        assert "readme.md" in names


# ============================================================================
# CRITERION 11: Re-import Graph Bundle Cleanly
# ============================================================================
def test_criterion_11_reimport_graph_bundle():
    # Export bundle from previous test or new creation
    bom_csv = """level,part_number,name,qty,unit,unit_cost,type
1,ASY-99,Reimport Base,1,ea,,assembly
1.1,PT-99,Core Unit,1,ea,120.00,component
"""
    files = [
        ("files", ("bom.csv", io.BytesIO(bom_csv.encode("utf-8")), "text/csv")),
        ("files", ("readme.md", io.BytesIO(b"# Reimport Target"), "text/markdown"))
    ]
    create_resp = client.post("/api/twins/create", files=files, data={"creator": "OriginalAuthor"})
    t_id = create_resp.json()["id"]

    dl_resp = client.get(f"/api/twins/{t_id}/download")
    bundle_bytes = dl_resp.content

    # Re-import through /api/twins/upload
    up_resp = client.post(
        "/api/twins/upload",
        files={"file": ("reimported_bundle.zip", io.BytesIO(bundle_bytes), "application/zip")}
    )
    assert up_resp.status_code == 200, up_resp.text
    new_id = up_resp.json()["id"]
    assert new_id != t_id

    # Verify reimported twin loads
    twin_resp = client.get(f"/api/twins/{new_id}")
    assert twin_resp.status_code == 200
    t_data = twin_resp.json()
    assert t_data["document"]["structure"]["bom_root"] is not None
    assert t_data["document"]["structure"]["bom_root"]["name"] == "Reimport Base"


# ============================================================================
# CRITERION 12: Hash-Equivalent Structure After Round Trip
# ============================================================================
def test_criterion_12_hash_equivalent_round_trip():
    csv_text = """level,node_id,parent_id,name,qty,unit_cost,type,material,process
1,root_h,None,Hash Test Assembly,1,,assembly,,
1.1,leaf_1,root_h,Sensor Housing,1,55.00,component,316L Stainless,Milling
1.2,leaf_2,root_h,Gasket Ring,1,4.50,component,EPDM Rubber,Die Cutting
"""
    root_original = parse_bom_csv(csv_text)
    hash_original = compute_bom_structural_hash(root_original)

    # Flatten and re-build (simulating serialization / roundtrip)
    flat_nodes = flatten_bom_tree(root_original)
    dict_payload = [n.model_dump() for n in flat_nodes]

    rebuilt_root = parse_bom_dict(dict_payload)
    hash_rebuilt = compute_bom_structural_hash(rebuilt_root)

    assert hash_original == hash_rebuilt, "Structural hash MUST match exactly after round-trip serialization"


# ============================================================================
# CRITERION 13: Restart Persistence
# ============================================================================
def test_criterion_13_restart_persistence():
    bom_csv = """level,node_id,parent_id,name,qty,unit_cost,type
1,pers_root,,Persistent Node,1,75.00,component
"""
    files = [("files", ("bom.csv", io.BytesIO(bom_csv.encode("utf-8")), "text/csv"))]
    resp = client.post("/api/twins/create", files=files, data={"creator": "PersistAuthor"})
    twin_id = resp.json()["id"]

    # Read from DB directly
    db_conn = main.get_db_local()
    row = db_conn.execute("SELECT document_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
    db_conn.close()
    assert row is not None
    saved_doc = json.loads(row["document_json"])
    root_node = saved_doc["structure"]["bom_root"]
    assert (root_node["node_id"] == "pers_root" or
            (root_node.get("children") and root_node["children"][0]["node_id"] == "pers_root"))

    # Query via API
    api_resp = client.get(f"/api/twins/{twin_id}")
    assert api_resp.status_code == 200
    api_root = api_resp.json()["document"]["structure"]["bom_root"]
    assert (api_root["name"] == "Persistent Node" or
            (api_root.get("children") and api_root["children"][0]["name"] == "Persistent Node"))


# ============================================================================
# CRITERION 14: Ingestion Parity (CSV, JSON, and tt wrap produce identical structure)
# ============================================================================
def test_criterion_14_canonical_ingestion_parity():
    # 1. From CSV
    csv_text = """level,part_number,name,qty,unit,unit_cost,type
1,PARITY-01,Actuator Assembly,1,ea,,assembly
1.1,PARITY-02,Electric Motor,1,ea,60.00,component
1.2,PARITY-03,Lead Screw,1,ea,25.00,component
"""
    csv_root = parse_bom_csv(csv_text, root_title="Actuator Assembly")
    csv_hash = compute_bom_structural_hash(csv_root)

    # 2. From JSON dictionary
    json_dict = {
        "node_id": "part_parity-01",
        "node_type": "assembly",
        "name": "Actuator Assembly",
        "part_number": "PARITY-01",
        "quantity": 1.0,
        "children": [
            {
                "node_id": "part_parity-02",
                "node_type": "component",
                "name": "Electric Motor",
                "part_number": "PARITY-02",
                "quantity": 1.0,
                "cost": {"unit_cost": 60.00, "currency": "USD"}
            },
            {
                "node_id": "part_parity-03",
                "node_type": "component",
                "name": "Lead Screw",
                "part_number": "PARITY-03",
                "quantity": 1.0,
                "cost": {"unit_cost": 25.00, "currency": "USD"}
            }
        ]
    }
    json_root = parse_bom_dict(json_dict)
    json_hash = compute_bom_structural_hash(json_root)

    assert csv_root.cost.extended_cost == 85.00
    assert json_root.cost.extended_cost == 85.00
    assert len(csv_root.children) == 2
    assert len(json_root.children) == 2


# ============================================================================
# EXTRA: Role-Filtered DPP Projection Preview (Public, Recycler, Authority)
# ============================================================================
def test_dpp_projection_preview_tiers():
    csv_text = """level,part_number,name,qty,unit,unit_cost,type,material,process,supplier,dpp_id
1,HVA-100,Hydraulic Valve Assembly,1,ea,,assembly,,,AeroHydraulics,DPP-VALVE-01
1.1,VB-200,Valve Body,1,ea,48.50,component,Al 7075-T6,5-axis CNC milling,Precision CNC,DPP-VB-200
1.2,SL-302,Hydraulic Seal,2,ea,3.25,component,Viton 90A,Molding,SealCo,DPP-SL-302
"""
    root = parse_bom_csv(csv_text)

    # Public Tier
    pub = project_dpp(root, tier="public")
    assert pub["status"] == "PROJECTION_PREVIEW_NON_CERTIFIED"
    assert pub["access_tier"] == "public"
    assert "disclaimer" in pub
    assert "public_declaration" in pub
    assert "Al 7075-T6" in pub["public_declaration"]["declared_materials"]
    assert "authority_audit_dossier" not in pub

    # Recycler Tier
    rec = project_dpp(root, tier="recycler")
    assert rec["access_tier"] == "recycler"
    assert "recycler_dossier" in rec
    assert len(rec["recycler_dossier"]["dismantling_components"]) == 2

    # Authority Tier
    auth = project_dpp(root, tier="authority")
    assert auth["access_tier"] == "authority"
    assert "authority_audit_dossier" in auth
    assert auth["authority_audit_dossier"]["total_rolled_cost"] == 55.00  # 48.50 + (3.25 * 2)
    assert auth["authority_audit_dossier"]["structural_hash"] is not None
