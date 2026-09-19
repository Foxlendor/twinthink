"""
TwinThink Milestone M3 Acceptance Tests
Verifies all 20 required criteria:
1. Generate creator identity
2. Export public identity
3. Sign Twin revision
4. Verify revision offline
5. Modify signed content
6. Verification fails (tamper detection)
7. Create R0 -> R1 -> R2 chain
8. Verify parent lineage
9. Encrypt private graph segment
10. Authorized capability decrypts it
11. Unauthorized identity cannot decrypt it
12. Revoke capability
13. Previously authorized access is rejected
14. Rights inheritance works
15. Component-level override works
16. Provenance entries are signed
17. Export encrypted .twin
18. Import .twin
19. Verify all signatures after import
20. tt and Web produce equivalent signed records
"""

import os
import sys
import json
import zipfile
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure repo packages and apps/api are in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "packages"))
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))

# Set isolated storage directory for tests
test_storage = tempfile.mkdtemp(prefix="tt_test_m3_storage_")
os.environ["TT_STORAGE_DIR"] = test_storage

from twinthink.crypto import (
    Keypair,
    IdentityDocument,
    TwinRevisionRecord,
    create_signed_revision,
    verify_revision,
    verify_revision_chain,
    CapabilityToken,
    issue_capability,
    verify_capability,
    RevocationRecord,
    EncryptedSegment,
    WrappedKey,
    encrypt_segment,
    decrypt_segment,
    wrap_key_for_recipient,
    unwrap_key_with_private_key,
    pack_twin_bundle,
    verify_twin_bundle,
    verify_signature,
)
from twinthink.schema import (
    TwinDocument,
    TwinIdentity,
    TwinObjectGeometry,
    TwinStructure,
    TwinBehavior,
    TwinEvidence,
    TwinLineage,
    RealityState,
    RealityDimensionState,
    BomNode,
    ProvenanceEntry,
    RightsPolicyDeclaration,
    resolve_node_rights,
)
from twinthink.bom import BomEngine, parse_bom_dict

from apps.api.main import app, init_local_db

@pytest.fixture(scope="module")
def test_client():
    client = TestClient(app)
    return client

# ==============================================================================
# Criterion 1: Generate creator identity
# ==============================================================================
def test_01_generate_creator_identity():
    kp = Keypair.generate()
    assert kp.did.startswith("did:twin:")
    assert len(kp.did.split("did:twin:")[-1]) == 64  # 32-byte hex public key
    assert len(kp.public_hex) == 64
    assert len(kp.private_hex) == 64
    assert kp.public_bytes is not None
    assert kp.private_bytes is not None

# ==============================================================================
# Criterion 2: Export public identity
# ==============================================================================
def test_02_export_public_identity():
    kp = Keypair.generate()
    pub_doc = kp.export_identity(name="Alice Engineer")
    assert isinstance(pub_doc, IdentityDocument)
    assert pub_doc.identity_id == kp.did
    assert pub_doc.public_key == kp.public_hex
    assert pub_doc.algorithm == "Ed25519"
    assert pub_doc.name == "Alice Engineer"
    assert pub_doc.status == "active"
    # Private key must NEVER be included in exported identity document
    dumped = pub_doc.model_dump()
    assert "private_key" not in dumped
    assert kp.private_hex not in json.dumps(dumped)

# ==============================================================================
# Criterion 3: Sign Twin revision
# ==============================================================================
def test_03_sign_twin_revision():
    kp = Keypair.generate()
    graph_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    rev = create_signed_revision(
        twin_id="twin_m3_test",
        revision_name="R0",
        graph_hash=graph_hash,
        keypair=kp,
        mutation_notes="Initial baseline release"
    )
    assert rev.twin_id == "twin_m3_test"
    assert rev.revision == "R0"
    assert rev.parent_revision is None
    assert rev.author_identity == kp.did
    assert len(rev.signature) == 128  # 64-byte Ed25519 signature in hex
    assert verify_revision(rev) is True

# ==============================================================================
# Criterion 4: Verify revision offline
# ==============================================================================
def test_04_verify_revision_offline():
    kp = Keypair.generate()
    rev = create_signed_revision(
        twin_id="twin_offline_1",
        revision_name="R0",
        graph_hash="a" * 64,
        keypair=kp
    )
    # Verification takes only the revision record, no network or external database
    assert verify_revision(rev, expected_author_did=kp.did) is True

# ==============================================================================
# Criterion 5: Modify signed content
# ==============================================================================
def test_05_modify_signed_content():
    kp = Keypair.generate()
    rev = create_signed_revision(
        twin_id="twin_tamper_1",
        revision_name="R0",
        graph_hash="11" * 32,
        keypair=kp
    )
    assert verify_revision(rev) is True

    # Tamper with graph hash
    tampered_1 = rev.model_copy(update={"graph_hash": "22" * 32})
    assert verify_revision(tampered_1) is False

    # Tamper with author identity
    other_kp = Keypair.generate()
    tampered_2 = rev.model_copy(update={"author_identity": other_kp.did})
    assert verify_revision(tampered_2) is False

    # Tamper with revision name
    tampered_3 = rev.model_copy(update={"revision": "R1"})
    assert verify_revision(tampered_3) is False

# ==============================================================================
# Criterion 6: Verification fails (tampered signature)
# ==============================================================================
def test_06_verification_fails():
    kp = Keypair.generate()
    rev = create_signed_revision(
        twin_id="twin_tamper_sig",
        revision_name="R0",
        graph_hash="33" * 32,
        keypair=kp
    )
    assert verify_revision(rev) is True

    # Mutated signature bytes
    tampered_sig = rev.model_copy(update={"signature": "00" * 64})
    assert verify_revision(tampered_sig) is False

# ==============================================================================
# Criterion 7: Create R0 -> R1 -> R2 chain
# ==============================================================================
def test_07_create_r0_r1_r2_chain():
    kp = Keypair.generate()
    twin_id = "twin_chain_test"

    r0 = create_signed_revision(
        twin_id=twin_id,
        revision_name="R0",
        graph_hash="00" * 32,
        keypair=kp,
        parent_revision_hash=None,
        mutation_notes="Genesis revision"
    )

    r1 = create_signed_revision(
        twin_id=twin_id,
        revision_name="R1",
        graph_hash="11" * 32,
        keypair=kp,
        parent_revision_hash=r0.compute_hash(),
        mutation_notes="Add cooling jacket"
    )

    r2 = create_signed_revision(
        twin_id=twin_id,
        revision_name="R2",
        graph_hash="22" * 32,
        keypair=kp,
        parent_revision_hash=r1.compute_hash(),
        mutation_notes="Optimized silicone gaskets"
    )

    chain = [r0, r1, r2]
    assert len(chain) == 3
    assert r0.parent_revision is None
    assert r1.parent_revision == r0.compute_hash()
    assert r2.parent_revision == r1.compute_hash()

# ==============================================================================
# Criterion 8: Verify parent lineage
# ==============================================================================
def test_08_verify_parent_lineage():
    kp = Keypair.generate()
    twin_id = "twin_lineage_test"

    r0 = create_signed_revision(twin_id, "R0", "00" * 32, kp, None)
    r1 = create_signed_revision(twin_id, "R1", "11" * 32, kp, r0.compute_hash())
    r2 = create_signed_revision(twin_id, "R2", "22" * 32, kp, r1.compute_hash())

    # Valid chain
    ok, err = verify_revision_chain([r0, r1, r2])
    assert ok is True
    assert err is None

    # Broken chain: swapped sequence [r0, r2, r1]
    broken_ok, broken_err = verify_revision_chain([r0, r2, r1])
    assert broken_ok is False
    assert "Broken lineage" in broken_err

    # Broken chain: bad parent hash
    bad_r1 = create_signed_revision(twin_id, "R1", "11" * 32, kp, "bad_hash_value")
    bad_ok, bad_err = verify_revision_chain([r0, bad_r1])
    assert bad_ok is False

# ==============================================================================
# Criterion 9: Encrypt private graph segment
# ==============================================================================
def test_09_encrypt_private_graph_segment():
    sensitive_design = {
        "cad_tolerances": "+/-0.005mm",
        "internal_cad_url": "s3://vault/confidential_core.step",
        "margin_usd": 42.50
    }

    seg, key = encrypt_segment("design", sensitive_design)
    assert seg.segment_name == "design"
    assert seg.algorithm == "AES-256-GCM"
    assert len(key) == 32
    assert "margin_usd" not in seg.ciphertext_b64
    assert len(seg.nonce_hex) == 24  # 12-byte nonce in hex
    assert len(seg.content_sha256) == 64

# ==============================================================================
# Criterion 10: Authorized capability decrypts it
# ==============================================================================
def test_10_authorized_capability_decrypts_it():
    creator_kp = Keypair.generate()
    fabricator_kp = Keypair.generate()

    secret_cad = {"proprietary_cad_token": "secret_step_file_content_12345"}
    seg, seg_key = encrypt_segment("design", secret_cad)

    # Creator wraps segment key for fabricator's X25519 public key
    wrapped_key = wrap_key_for_recipient(
        segment_key=seg_key,
        recipient_x25519_public_bytes=fabricator_kp.x25519_public_bytes,
        recipient_did=fabricator_kp.did
    )

    # Creator issues capability token
    cap = issue_capability(
        issuer_keypair=creator_kp,
        subject_did=fabricator_kp.did,
        twin_id="twin_123",
        permissions=["read:design", "read:bom"]
    )
    valid, _ = verify_capability(cap, required_permission="read:design")
    assert valid is True

    # Fabricator unwraps segment key using their private key
    unwrapped_key = unwrap_key_with_private_key(wrapped_key, fabricator_kp.x25519_private_bytes)
    assert unwrapped_key == seg_key

    # Fabricator decrypts segment
    decrypted_bytes = decrypt_segment(seg, unwrapped_key)
    decrypted_data = json.loads(decrypted_bytes.decode("utf-8"))
    assert decrypted_data == secret_cad

# ==============================================================================
# Criterion 11: Unauthorized identity cannot decrypt it
# ==============================================================================
def test_11_unauthorized_identity_cannot_decrypt_it():
    creator_kp = Keypair.generate()
    fabricator_kp = Keypair.generate()
    eavesdropper_kp = Keypair.generate()

    secret_data = {"margin_sheet": 99.9}
    seg, seg_key = encrypt_segment("financials", secret_data)

    wrapped_key = wrap_key_for_recipient(
        segment_key=seg_key,
        recipient_x25519_public_bytes=fabricator_kp.x25519_public_bytes,
        recipient_did=fabricator_kp.did
    )

    # Eavesdropper attempts to unwrap using their own private key
    with pytest.raises(Exception):
        unwrap_key_with_private_key(wrapped_key, eavesdropper_kp.x25519_private_bytes)

    # Direct decrypt with wrong key fails
    fake_key = os.urandom(32)
    with pytest.raises(Exception):
        decrypt_segment(seg, fake_key)

# ==============================================================================
# Criterion 12: Revoke capability
# ==============================================================================
def test_12_revoke_capability():
    creator_kp = Keypair.generate()
    contractor_kp = Keypair.generate()

    cap = issue_capability(
        issuer_keypair=creator_kp,
        subject_did=contractor_kp.did,
        twin_id="twin_rev_test",
        permissions=["read:bom"],
        expires_in_seconds=3600
    )
    assert cap.token_id.startswith("cap_")

    rev_record = RevocationRecord(token_id=cap.token_id, revoked_by=creator_kp.did, reason="Contract ended")
    assert rev_record.token_id == cap.token_id
    assert rev_record.revoked_by == creator_kp.did

# ==============================================================================
# Criterion 13: Previously authorized access is rejected
# ==============================================================================
def test_13_previously_authorized_access_is_rejected():
    creator_kp = Keypair.generate()
    contractor_kp = Keypair.generate()

    cap = issue_capability(
        issuer_keypair=creator_kp,
        subject_did=contractor_kp.did,
        twin_id="twin_rev_test",
        permissions=["read:bom"],
        expires_in_seconds=3600
    )
    ok, _ = verify_capability(cap, required_permission="read:bom")
    assert ok is True

    # 1. Revocation reject
    rev_set = {cap.token_id}
    rejected_ok, reason = verify_capability(cap, required_permission="read:bom", revocation_set=rev_set)
    assert rejected_ok is False
    assert "revoked" in reason.lower()

    # 2. Expiration reject
    import datetime
    future_time = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1))
    expired_ok, exp_reason = verify_capability(cap, reference_time=future_time)
    assert expired_ok is False
    assert "expired" in exp_reason.lower()

# ==============================================================================
# Criterion 14: Rights inheritance works
# ==============================================================================
def test_14_rights_inheritance_works():
    root = BomNode(
        node_id="root_assembly",
        name="Main Assembly",
        node_type="assembly",
        children=[
            BomNode(
                node_id="sub_a",
                name="Subassembly A",
                node_type="subassembly",
                parent_id="root_assembly",
                children=[
                    BomNode(
                        node_id="part_a1",
                        name="Part A1",
                        node_type="component",
                        parent_id="sub_a"
                    )
                ]
            )
        ]
    )

    doc = TwinDocument(
        identity=TwinIdentity(
            title="Modular Enclosure",
            summary="Test twin",
            declared_rights_mode="Licensed"
        ),
        object=TwinObjectGeometry(),
        structure=TwinStructure(bom_root=root, bom_nodes=[root, root.children[0], root.children[0].children[0]]),
        behavior=TwinBehavior(),
        evidence=TwinEvidence(),
        lineage=TwinLineage(),
        reality_state=RealityState(
            structural=RealityDimensionState(status="Verified", score_pct=85, evidence_count=3, rationale="Structural FEA"),
            thermal=RealityDimensionState(status="Experimental", score_pct=70, evidence_count=2, rationale="Thermal chamber test"),
            material=RealityDimensionState(status="Verified", score_pct=90, evidence_count=4, rationale="Mill test certificates"),
            safety=RealityDimensionState(status="Verified", score_pct=80, evidence_count=2, rationale="FMEA reviewed"),
            manufacturing=RealityDimensionState(status="Verified", score_pct=75, evidence_count=2, rationale="DFM completed"),
            overall_score_pct=80
        ),
        rights_policy=RightsPolicyDeclaration(mode="Licensed", scope="twin")
    )

    # Subassembly A and Part A1 inherit "Licensed" from root
    assert resolve_node_rights(doc, "sub_a") == "Licensed"
    assert resolve_node_rights(doc, "part_a1") == "Licensed"

# ==============================================================================
# Criterion 15: Component-level override works
# ==============================================================================
def test_15_component_level_override_works():
    root = BomNode(
        node_id="root_chassis",
        name="Chassis System",
        node_type="assembly",
        children=[
            BomNode(
                node_id="standard_bracket",
                name="Standard Bracket",
                node_type="component",
                parent_id="root_chassis"
            ),
            BomNode(
                node_id="patented_latch",
                name="Patented Latch",
                node_type="component",
                parent_id="root_chassis",
                rights_override="Private"
            )
        ]
    )

    doc = TwinDocument(
        identity=TwinIdentity(title="Chassis", summary="Test", declared_rights_mode="Open Development"),
        object=TwinObjectGeometry(),
        structure=TwinStructure(bom_root=root, bom_nodes=[root, root.children[0], root.children[1]]),
        behavior=TwinBehavior(),
        evidence=TwinEvidence(),
        lineage=TwinLineage(),
        reality_state=RealityState(
            structural=RealityDimensionState(status="Verified", score_pct=85, evidence_count=3, rationale="FEA verified"),
            thermal=RealityDimensionState(status="Verified", score_pct=85, evidence_count=3, rationale="Thermal test"),
            material=RealityDimensionState(status="Verified", score_pct=85, evidence_count=3, rationale="Cert sheets"),
            safety=RealityDimensionState(status="Verified", score_pct=85, evidence_count=3, rationale="Safety review"),
            manufacturing=RealityDimensionState(status="Verified", score_pct=85, evidence_count=3, rationale="DFM clean"),
            overall_score_pct=85
        ),
        rights_policy=RightsPolicyDeclaration(mode="Open Development", scope="twin")
    )

    # Standard bracket inherits Open Development
    assert resolve_node_rights(doc, "standard_bracket") == "Open Development"
    # Patented latch has component-level override -> Private
    assert resolve_node_rights(doc, "patented_latch") == "Private"

# ==============================================================================
# Criterion 16: Provenance entries are signed
# ==============================================================================
def test_16_provenance_entries_are_signed():
    kp = Keypair.generate()
    payload = {
        "source": "tt",
        "artifact_hash": "sha256:abc123def456",
        "creator_identity": kp.did,
        "action": "created",
        "revision": "R0"
    }
    sig = kp.sign(payload)

    entry = ProvenanceEntry(
        source="tt",
        artifact_hash="sha256:abc123def456",
        creator_identity=kp.did,
        action="created",
        revision="R0",
        signature=sig
    )

    # Validate signature over provenance entry
    assert verify_signature(kp.did, entry.signature, payload) is True

    # Mutated payload fails
    mutated_payload = dict(payload, action="deleted")
    assert verify_signature(kp.did, entry.signature, mutated_payload) is False

# ==============================================================================
# Criterion 17: Export encrypted .twin
# ==============================================================================
def test_17_export_encrypted_twin():
    kp = Keypair.generate()
    twin_id = "twin_bundle_export_test"

    nodes = [
        {"node_id": "root", "name": "Assembly", "node_type": "assembly", "quantity": 1.0, "unit": "ea"},
        {"node_id": "c1", "parent_id": "root", "name": "C1", "node_type": "component", "quantity": 2.0, "unit": "ea"}
    ]

    tree_root = parse_bom_dict(nodes)
    r0 = create_signed_revision(twin_id, "R0", BomEngine.compute_hash(tree_root), kp)

    sensitive_enc, _ = encrypt_segment("financials", {"target_margin": 0.35})

    bundle_bytes = pack_twin_bundle(
        manifest_data={"title": "Bundle Export Test", "twin_id": twin_id},
        creator_identity=kp.export_identity("Alice"),
        graph_nodes=nodes,
        revisions=[r0],
        rights_policy={"mode": "Licensed", "scope": "twin"},
        encrypted_segments={"financials": sensitive_enc}
    )

    assert len(bundle_bytes) > 0
    assert bundle_bytes[:2] == b"PK"  # Valid ZIP header

# ==============================================================================
# Criterion 18: Import .twin
# ==============================================================================
def test_18_import_twin():
    kp = Keypair.generate()
    twin_id = "twin_bundle_import_test"

    nodes = [
        {"node_id": "root", "name": "Assembly", "node_type": "assembly", "quantity": 1.0, "unit": "ea"},
        {"node_id": "c1", "parent_id": "root", "name": "C1", "node_type": "component", "quantity": 2.0, "unit": "ea"}
    ]

    tree_root = parse_bom_dict(nodes)
    r0 = create_signed_revision(twin_id, "R0", BomEngine.compute_hash(tree_root), kp)
    sensitive_enc, _ = encrypt_segment("financials", {"target_margin": 0.35})

    bundle_bytes = pack_twin_bundle(
        manifest_data={"title": "Bundle Import Test", "twin_id": twin_id},
        creator_identity=kp.export_identity("Alice"),
        graph_nodes=nodes,
        revisions=[r0],
        rights_policy={"mode": "Licensed", "scope": "twin"},
        encrypted_segments={"financials": sensitive_enc}
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        bundle_file = Path(tmpdir) / f"{twin_id}.twin"
        bundle_file.write_bytes(bundle_bytes)

        with zipfile.ZipFile(bundle_file, 'r') as zf:
            namelist = zf.namelist()
            assert "manifest.json" in namelist
            assert "identity/creator.json" in namelist
            assert "graph/nodes.json" in namelist
            assert "graph/edges.json" in namelist
            assert "revisions/R0.json" in namelist
            assert "signatures/revisions.json" in namelist
            assert "rights/policy.json" in namelist
            assert "encrypted/financials.enc" in namelist

            # Content can be read into memory
            manifest = json.loads(zf.read("manifest.json").decode())
            assert manifest["twin_id"] == twin_id

# ==============================================================================
# Criterion 19: Verify all signatures after import (Offline)
# ==============================================================================
def test_19_verify_all_signatures_after_import():
    kp = Keypair.generate()
    twin_id = "twin_offline_verify_test"

    nodes = [
        {"node_id": "root", "name": "Root", "node_type": "assembly", "quantity": 1.0, "unit": "ea"}
    ]
    tree_root = parse_bom_dict(nodes)
    r0 = create_signed_revision(twin_id, "R0", BomEngine.compute_hash(tree_root), kp)

    bundle_bytes = pack_twin_bundle(
        manifest_data={"title": "Offline Verify Test", "twin_id": twin_id},
        creator_identity=kp.export_identity("Alice"),
        graph_nodes=nodes,
        revisions=[r0]
    )

    # 100% offline verification
    result = verify_twin_bundle(bundle_bytes)
    assert result.valid is True
    assert result.checks["identity_valid"] is True
    assert result.checks["revisions_valid"] is True
    assert result.checks["revision_chain_valid"] is True
    assert result.checks["graph_hash_valid"] is True
    assert result.checks["bundle_structure_valid"] is True
    assert result.details["creator_did"] == kp.did
    assert result.details["latest_revision"] == "R0"

# ==============================================================================
# Criterion 20: tt and Web produce equivalent signed records
# ==============================================================================
def test_20_tt_and_web_produce_equivalent_signed_records(test_client):
    # 1. Web/API creates a twin
    files = [
        ("files", ("README.md", b"# Smart Hydroponics Tower\n> Verifiable firmware and BOM")),
        ("files", ("bom.csv", b"part,material,qty,unit_cost_usd,supplier\nPump,ABS,1,25.0,PumpCo\nReservoir,PET,1,40.0,PlasticsInc"))
    ]
    create_resp = test_client.post(
        "/api/twins/create",
        files=files,
        data={
            "creator": "@TwinMaker"
        }
    )
    assert create_resp.status_code == 200
    twin_id = create_resp.json()["id"]
    owner_tok = create_resp.json()["owner_token"]

    # 2. Keypair signs a revision
    kp = Keypair.generate()
    # Register identity
    id_resp = test_client.post("/api/identities", json=kp.export_identity("TwinMaker").model_dump())
    assert id_resp.status_code == 200

    # Fetch BOM: unauthenticated returns 403
    assert test_client.get(f"/api/twins/{twin_id}/bom").status_code == 403

    # Fetch BOM as authenticated owner -> 200
    bom_resp = test_client.get(f"/api/twins/{twin_id}/bom", headers={"X-Twin-Owner-Token": owner_tok})
    assert bom_resp.status_code == 200
    bom_nodes = bom_resp.json().get("bom_nodes", [])

    tree_root = parse_bom_dict(bom_nodes)
    g_hash = BomEngine.compute_hash(tree_root)
    rev_r0 = create_signed_revision(twin_id, "R0", g_hash, kp, mutation_notes="Signed via tt/API bridge")

    # Post revision to API
    post_rev = test_client.post(f"/api/twins/{twin_id}/revisions", json=rev_r0.model_dump())
    assert post_rev.status_code == 200
    assert post_rev.json()["status"] == "signed"

    # 3. Export bundle from API
    bundle_resp = test_client.get(f"/api/twins/{twin_id}/bundle")
    assert bundle_resp.status_code == 200
    bundle_content = bundle_resp.content

    # 4. Verify bundle using offline verify_twin_bundle
    offline_res = verify_twin_bundle(bundle_content)
    assert offline_res.valid is True
    assert offline_res.checks["revisions_valid"] is True
    assert offline_res.checks["graph_hash_valid"] is True

    # 5. Verify bundle through API endpoint
    import io
    api_verify_resp = test_client.post(
        "/api/twins/verify-bundle",
        files={"file": ("test.twin", io.BytesIO(bundle_content), "application/octet-stream")}
    )
    assert api_verify_resp.status_code == 200
    api_res = api_verify_resp.json()
    assert api_res["valid"] is True
    assert api_res["checks"]["identity_valid"] is True
    assert api_res["checks"]["revisions_valid"] is True
    assert api_res["checks"]["graph_hash_valid"] is True

# ==============================================================================
# Criterion 21: Private Key Non-Leakage Protection
# ==============================================================================
def test_21_private_key_leakage_protection(test_client):
    kp = Keypair.generate()
    priv_hex = kp.private_hex

    # 1. Register identity
    pub_doc = kp.export_identity(name="SecretKeeper")
    resp = test_client.post("/api/identities", json=pub_doc.model_dump())
    assert resp.status_code == 200
    assert priv_hex not in resp.text

    # 2. Check get identity endpoint
    get_resp = test_client.get(f"/api/identities/{kp.did}")
    assert get_resp.status_code == 200
    assert priv_hex not in get_resp.text

    # 3. Create twin and signed revision
    files = [("files", ("README.md", b"# Privacy Test"))]
    create_resp = test_client.post("/api/twins/create", files=files, data={"creator": kp.did})
    twin_id = create_resp.json()["id"]

    rev = create_signed_revision(twin_id, "R0", "00" * 32, kp)
    rev_resp = test_client.post(f"/api/twins/{twin_id}/revisions", json=rev.model_dump())
    assert rev_resp.status_code == 200
    assert priv_hex not in rev_resp.text

    # 4. Check database directly
    from apps.api.main import get_db_local
    conn = get_db_local()
    for table in ["identities", "twins", "twin_revisions", "capabilities"]:
        rows = conn.execute(f"SELECT * FROM {table}").fetchall()
        for r in rows:
            row_str = " ".join(str(val) for val in dict(r).values())
            assert priv_hex not in row_str, f"Private key leaked in table {table}!"
    conn.close()

    # 5. Check exported bundle
    bundle_resp = test_client.get(f"/api/twins/{twin_id}/bundle")
    assert priv_hex.encode("utf-8") not in bundle_resp.content

# ==============================================================================
# Criterion 22: Offline Verification with Zero Network Dependency
# ==============================================================================
def test_22_offline_tt_verify_zero_network(monkeypatch):
    # Cut off network entirely by pointing API to invalid address
    monkeypatch.setenv("TWINTHINK_API_URL", "http://0.0.0.0:1")

    kp = Keypair.generate()
    twin_id = "twin_zero_net"
    nodes = [{"node_id": "root", "name": "Assembly", "node_type": "assembly", "quantity": 1.0, "unit": "ea"}]
    tree_root = parse_bom_dict(nodes)
    g_hash = BomEngine.compute_hash(tree_root)
    r0 = create_signed_revision(twin_id, "R0", g_hash, kp)

    bundle_bytes = pack_twin_bundle(
        manifest_data={"title": "Zero Net", "twin_id": twin_id},
        creator_identity=kp.export_identity(),
        graph_nodes=nodes,
        revisions=[r0]
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        bundle_path = Path(tmpdir) / "valid.twin"
        bundle_path.write_bytes(bundle_bytes)

        # Runs 100% offline
        res = verify_twin_bundle(bundle_path)
        assert res.valid is True
        assert res.checks["identity_valid"] is True
        assert res.checks["revisions_valid"] is True
        assert res.checks["graph_hash_valid"] is True

        # Now tamper with graph/nodes.json inside the bundle
        tampered_path = Path(tmpdir) / "tampered.twin"
        with zipfile.ZipFile(bundle_path, 'r') as z_in:
            with zipfile.ZipFile(tampered_path, 'w') as z_out:
                for item in z_in.infolist():
                    data = z_in.read(item.filename)
                    if item.filename == "graph/nodes.json":
                        tampered_nodes = [{"node_id": "root", "name": "Tampered CAD", "node_type": "assembly", "quantity": 999.0, "unit": "ea"}]
                        data = json.dumps(tampered_nodes).encode()
                    z_out.writestr(item, data)

        tampered_res = verify_twin_bundle(tampered_path)
        assert tampered_res.valid is False
        assert tampered_res.checks["graph_hash_valid"] is False
        assert "tampered post-signing" in tampered_res.summary

# ==============================================================================
# Criterion 23: Capability Revocation Semantics & Information Disclosure Distinction
# ==============================================================================
def test_23_capability_revocation_semantics():
    """
    Verifies that capability revocation strictly denies future authorization,
    while acknowledging the protocol boundary that cryptographic revocation
    governs access authorization, not physical erasure of previously disclosed plaintext.
    """
    creator_kp = Keypair.generate()
    fabricator_kp = Keypair.generate()

    secret_data = {"cad_recipe": "proprietary_extrusion_formula_v3"}
    seg, seg_key = encrypt_segment("design", secret_data)
    wrapped = wrap_key_for_recipient(seg_key, fabricator_kp.x25519_public_bytes, fabricator_kp.did)

    token = issue_capability(
        issuer_keypair=creator_kp,
        subject_did=fabricator_kp.did,
        twin_id="twin_sem",
        permissions=["read:design"],
        expires_in_seconds=3600
    )

    # Phase 1: Authorized access works
    valid, _ = verify_capability(token, required_permission="read:design")
    assert valid is True
    unwrapped = unwrap_key_with_private_key(wrapped, fabricator_kp.x25519_private_bytes)
    decrypted = json.loads(decrypt_segment(seg, unwrapped).decode())
    assert decrypted == secret_data

    # Phase 2: Revocation strictly rejects future authorization
    rev_set = {token.token_id}
    rev_valid, reason = verify_capability(token, required_permission="read:design", revocation_set=rev_set)
    assert rev_valid is False
    assert "revoked" in reason.lower()

    # Phase 3: Without valid authorization, attempts by other or future requests fail
    unauthorized_token = issue_capability(
        issuer_keypair=creator_kp,
        subject_did=fabricator_kp.did,
        twin_id="twin_sem",
        permissions=["read:bom"]  # lacks read:design
    )
    scope_valid, scope_reason = verify_capability(unauthorized_token, required_permission="read:design")
    assert scope_valid is False
    assert "lacks required scope" in scope_reason.lower()
