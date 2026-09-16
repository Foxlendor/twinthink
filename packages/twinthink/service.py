"""
TwinThink Canonical Service Layer (M4)
Implements the shared contract governing Twin lifecycle, hierarchical BOM graphs,
cryptographic rights, capabilities, evidence attachments, and portable bundles.
Every interface (tt CLI, Web Studio, Antigravity MCP, and API) delegates to this layer.
"""

import os
import sys
import json
import uuid
import shutil
import hashlib
import zipfile
import tempfile
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union

from .schema import (
    TwinDocument,
    TwinIdentity,
    DeclaredRightsMode,
    RightsPolicyDeclaration,
    BomNode,
    ProvenanceEntry,
    resolve_node_rights
)
from .bom import (
    BomEngine,
    parse_bom_csv,
    parse_bom_dict,
    flatten_bom_tree,
    project_dpp,
    CyclicBomError,
    OrphanBomNodeError
)
from .factory import TwinFactoryEngine
from .crypto import (
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
    pack_twin_bundle,
    verify_twin_bundle,
    get_or_create_default_identity,
    DEFAULT_KEYSTORE_DIR
)

DEFAULT_STORAGE = Path(__file__).resolve().parent.parent.parent / "apps" / "api" / "storage"

class TwinService:
    """Canonical service interface executing all Twin operations."""

    def __init__(self, storage_dir: Optional[Union[str, Path]] = None):
        self.storage_dir = Path(storage_dir or os.getenv("TT_STORAGE_DIR", DEFAULT_STORAGE)).resolve()
        self.bundles_dir = self.storage_dir / "bundles"
        self.extracted_dir = self.storage_dir / "extracted"
        self.db_path = self.storage_dir / "twinthink.db"
        self._ensure_dirs()
        self.init_db()

    def _ensure_dirs(self):
        for d in [self.storage_dir, self.bundles_dir, self.extracted_dir]:
            d.mkdir(parents=True, exist_ok=True)

    def get_db(self):
        import sqlite3
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_db()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS twins (
                id TEXT PRIMARY KEY,
                creator TEXT,
                owner_token_hash TEXT,
                manifest_json TEXT,
                document_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS twin_files (
                twin_id TEXT,
                relative_path TEXT,
                size_bytes INTEGER,
                sha256 TEXT,
                PRIMARY KEY (twin_id, relative_path)
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS twin_tests (
                id TEXT PRIMARY KEY,
                twin_id TEXT,
                test_number INTEGER,
                title TEXT,
                operator TEXT,
                status TEXT,
                notes TEXT,
                csv_path TEXT,
                metrics TEXT,
                initial_conditions TEXT,
                raw_preview TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS identities (
                identity_id TEXT PRIMARY KEY,
                algorithm TEXT,
                public_key TEXT,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS twin_revisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                twin_id TEXT,
                revision TEXT,
                parent_revision TEXT,
                graph_hash TEXT,
                author_identity TEXT,
                mutation_notes TEXT,
                signature TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(twin_id, revision)
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS capabilities (
                token_id TEXT PRIMARY KEY,
                subject TEXT,
                twin_id TEXT,
                permissions_json TEXT,
                issued_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                signature TEXT
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS capability_revocations (
                token_id TEXT PRIMARY KEY,
                revoked_by TEXT,
                revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reason TEXT
            );
        """)
        conn.commit()
        conn.close()

    # =========================================================================
    # TWIN OPERATIONS (tt twin *)
    # =========================================================================

    def twin_create(
        self,
        files: Dict[str, bytes],
        creator: str = "Anonymous",
        title: Optional[str] = None,
        owner_token: Optional[str] = None,
        rights_mode: Optional[DeclaredRightsMode] = None
    ) -> Dict[str, Any]:
        """Compiles raw files into a canonical TwinDocument and stores persistently."""
        token = owner_token or f"tok_{uuid.uuid4().hex[:16]}"
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

        # Generate unique short ID
        conn = self.get_db()
        twin_id = uuid.uuid4().hex[:4]
        for _ in range(20):
            if not conn.execute("SELECT 1 FROM twins WHERE id = ?", (twin_id,)).fetchone():
                break
            twin_id = uuid.uuid4().hex[:4]

        # Use TwinFactoryEngine
        compiled_doc = TwinFactoryEngine.process_bundle(files, twin_id=twin_id, creator=creator)
        document = compiled_doc.model_dump()
        manifest = {
            "twin_id": twin_id,
            "title": title or compiled_doc.identity.title,
            "creator": creator,
            "summary": compiled_doc.identity.summary,
            "version": compiled_doc.identity.version,
            "declared_rights_mode": rights_mode or "Open Development",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        if title:
            manifest["title"] = title
            document["identity"]["title"] = title
        if rights_mode:
            manifest["declared_rights_mode"] = rights_mode
            document["identity"]["declared_rights_mode"] = rights_mode
            document["rights_policy"] = {"mode": rights_mode, "scope": "twin", "declared_by": creator}

        # Store bundle and extracted files
        dest_dir = self.extracted_dir / twin_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        for rel_path, data in files.items():
            out_file = dest_dir / rel_path
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_bytes(data)

        # Store in SQLite
        conn.execute("""
            INSERT INTO twins (id, creator, owner_token_hash, manifest_json, document_json)
            VALUES (?, ?, ?, ?, ?)
        """, (
            twin_id,
            creator,
            token_hash,
            json.dumps(manifest),
            json.dumps(document)
        ))

        for rel_path, data in files.items():
            h = hashlib.sha256(data).hexdigest()
            conn.execute("""
                INSERT OR REPLACE INTO twin_files (twin_id, relative_path, size_bytes, sha256)
                VALUES (?, ?, ?, ?)
            """, (twin_id, rel_path, len(data), h))

        conn.commit()
        conn.close()

        return {
            "id": twin_id,
            "title": manifest.get("title", "Digital Twin"),
            "creator": creator,
            "owner_token": token,
            "manifest": manifest,
            "document": document
        }

    def twin_inspect(self, twin_id: str) -> Dict[str, Any]:
        """Retrieves full canonical state, BOM summary, and revisions for a twin."""
        conn = self.get_db()
        row = conn.execute("SELECT * FROM twins WHERE id = ?", (twin_id,)).fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Twin not found: {twin_id}")

        manifest = json.loads(row["manifest_json"]) if row["manifest_json"] else {}
        doc = json.loads(row["document_json"]) if row["document_json"] else {}

        rev_rows = conn.execute(
            "SELECT * FROM twin_revisions WHERE twin_id = ? ORDER BY id ASC",
            (twin_id,)
        ).fetchall()
        revisions = [dict(r) for r in rev_rows]

        test_count = conn.execute(
            "SELECT COUNT(*) FROM twin_tests WHERE twin_id = ?",
            (twin_id,)
        ).fetchone()[0]

        conn.close()

        structure = doc.get("structure", {})
        bom_nodes = structure.get("bom_nodes", [])
        total_cost = None
        bom_root = structure.get("bom_root")
        if bom_root and isinstance(bom_root, dict) and bom_root.get("cost"):
            total_cost = bom_root["cost"].get("extended_cost") or bom_root["cost"].get("unit_cost")
        elif bom_nodes:
            try:
                tree = parse_bom_dict(bom_nodes)
                if tree.cost:
                    total_cost = tree.cost.extended_cost or tree.cost.unit_cost
            except Exception:
                pass

        return {
            "id": twin_id,
            "creator": row["creator"],
            "created_at": str(row["created_at"]),
            "manifest": manifest,
            "document": doc,
            "revisions_count": len(revisions),
            "revisions": revisions,
            "bom_nodes_count": len(bom_nodes),
            "rolled_up_unit_cost": total_cost,
            "evidence_tests_count": test_count
        }

    def twin_edit(
        self,
        twin_id: str,
        title: Optional[str] = None,
        summary: Optional[str] = None,
        rights_mode: Optional[DeclaredRightsMode] = None,
        owner_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Edits metadata and rights mode of an existing Twin."""
        conn = self.get_db()
        row = conn.execute("SELECT * FROM twins WHERE id = ?", (twin_id,)).fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Twin not found: {twin_id}")

        if row["owner_token_hash"]:
            if not owner_token or hashlib.sha256(owner_token.encode()).hexdigest() != row["owner_token_hash"]:
                conn.close()
                raise PermissionError("Unauthorized: Valid owner_token required to edit twin")

        manifest = json.loads(row["manifest_json"]) if row["manifest_json"] else {}
        doc = json.loads(row["document_json"]) if row["document_json"] else {}

        if title:
            manifest["title"] = title
            doc.setdefault("identity", {})["title"] = title
        if summary:
            manifest["summary"] = summary
            doc.setdefault("identity", {})["summary"] = summary
        if rights_mode:
            manifest["declared_rights_mode"] = rights_mode
            doc.setdefault("identity", {})["declared_rights_mode"] = rights_mode
            doc["rights_policy"] = {
                "mode": rights_mode,
                "scope": "twin",
                "declared_by": row["creator"]
            }

        conn.execute("""
            UPDATE twins SET manifest_json = ?, document_json = ? WHERE id = ?
        """, (json.dumps(manifest), json.dumps(doc), twin_id))
        conn.commit()
        conn.close()

        return {
            "id": twin_id,
            "status": "updated",
            "manifest": manifest,
            "document": doc
        }

    def twin_sign(
        self,
        twin_id: str,
        revision_name: Optional[str] = None,
        identity_name: str = "default",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Signs a new revision snapshot for a Twin with author keypair."""
        try:
            kp = Keypair.load_from_disk(DEFAULT_KEYSTORE_DIR, identity_name)
        except Exception:
            kp = get_or_create_default_identity()

        conn = self.get_db()
        row = conn.execute("SELECT * FROM twins WHERE id = ?", (twin_id,)).fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Twin not found: {twin_id}")

        doc = json.loads(row["document_json"]) if row["document_json"] else {}
        bom_nodes = doc.get("structure", {}).get("bom_nodes", [])

        # Compute graph hash
        try:
            tree_root = parse_bom_dict(bom_nodes)
            g_hash = BomEngine.compute_hash(tree_root)
        except Exception:
            g_hash = hashlib.sha256(json.dumps(bom_nodes, sort_keys=True).encode()).hexdigest()

        # Fetch existing revisions
        rev_rows = conn.execute(
            "SELECT * FROM twin_revisions WHERE twin_id = ? ORDER BY id ASC",
            (twin_id,)
        ).fetchall()

        parent_hash = None
        rev_label = revision_name
        if rev_rows:
            last_r = TwinRevisionRecord(
                twin_id=rev_rows[-1]["twin_id"],
                revision=rev_rows[-1]["revision"],
                parent_revision=rev_rows[-1]["parent_revision"],
                graph_hash=rev_rows[-1]["graph_hash"],
                author_identity=rev_rows[-1]["author_identity"],
                mutation_notes=rev_rows[-1]["mutation_notes"],
                signature=rev_rows[-1]["signature"],
                created_at=str(rev_rows[-1]["created_at"])
            )
            parent_hash = last_r.compute_hash()
            if not rev_label:
                rev_label = f"R{len(rev_rows)}"
        else:
            if not rev_label:
                rev_label = "R0"

        rec = create_signed_revision(
            twin_id=twin_id,
            revision_name=rev_label,
            graph_hash=g_hash,
            keypair=kp,
            parent_revision_hash=parent_hash,
            mutation_notes=notes or "Signed via TwinThink Service"
        )

        conn.execute("""
            INSERT INTO twin_revisions (twin_id, revision, parent_revision, graph_hash, author_identity, mutation_notes, signature, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rec.twin_id,
            rec.revision,
            rec.parent_revision,
            rec.graph_hash,
            rec.author_identity,
            rec.mutation_notes,
            rec.signature,
            rec.created_at
        ))
        conn.commit()
        conn.close()

        return {
            "status": "signed",
            "twin_id": twin_id,
            "revision": rec.revision,
            "commit_hash": rec.compute_hash(),
            "graph_hash": rec.graph_hash,
            "author_identity": rec.author_identity,
            "signature": rec.signature
        }

    def twin_verify(self, target: Union[str, Path, bytes]) -> Dict[str, Any]:
        """
        Verifies a twin:
        - If target is a file path or bytes: verifies the portable .twin bundle offline.
        - If target is a twin_id: verifies the internal revision chain.
        """
        if isinstance(target, (Path, bytes)) or (isinstance(target, str) and (target.endswith(".twin") or target.endswith(".zip") or Path(target).exists())):
            res = verify_twin_bundle(target)
            return res.to_dict()

        # Database verification by twin_id
        twin_id = str(target)
        conn = self.get_db()
        rev_rows = conn.execute(
            "SELECT * FROM twin_revisions WHERE twin_id = ? ORDER BY id ASC",
            (twin_id,)
        ).fetchall()
        conn.close()

        revisions = [
            TwinRevisionRecord(
                twin_id=r["twin_id"],
                revision=r["revision"],
                parent_revision=r["parent_revision"],
                graph_hash=r["graph_hash"],
                author_identity=r["author_identity"],
                mutation_notes=r["mutation_notes"],
                signature=r["signature"],
                created_at=str(r["created_at"])
            )
            for r in rev_rows
        ]

        if not revisions:
            return {
                "valid": True,
                "summary": f"Twin {twin_id} has no revisions recorded yet (clean state).",
                "checks": {"revisions_count": 0}
            }

        ok, err = verify_revision_chain(revisions)
        return {
            "valid": ok,
            "summary": "VERIFIED — Revision chain integrity confirmed." if ok else f"Broken lineage: {err}",
            "checks": {
                "chain_valid": ok,
                "revisions_count": len(revisions)
            },
            "revisions": [r.model_dump() for r in revisions]
        }

    def twin_export(self, twin_id: str, output_path: Optional[Union[str, Path]] = None) -> Tuple[bytes, Path]:
        """Exports a standardized portable .twin bundle archive."""
        conn = self.get_db()
        row = conn.execute("SELECT * FROM twins WHERE id = ?", (twin_id,)).fetchone()
        if not row:
            conn.close()
            raise ValueError(f"Twin not found: {twin_id}")

        manifest = json.loads(row["manifest_json"]) if row["manifest_json"] else {}
        doc = json.loads(row["document_json"]) if row["document_json"] else {}

        # Identity
        creator_did = row["creator"]
        id_row = conn.execute("SELECT * FROM identities WHERE identity_id = ?", (creator_did,)).fetchone()
        if id_row:
            creator_id = IdentityDocument(
                identity_id=id_row["identity_id"],
                algorithm=id_row["algorithm"],
                public_key=id_row["public_key"],
                name=id_row["name"],
                created_at=str(id_row["created_at"]),
                status=id_row["status"]
            )
        else:
            kp = get_or_create_default_identity()
            creator_id = kp.export_identity(name=creator_did or "Anonymous Creator")

        # Revisions
        rev_rows = conn.execute(
            "SELECT * FROM twin_revisions WHERE twin_id = ? ORDER BY id ASC",
            (twin_id,)
        ).fetchall()
        revisions = [
            TwinRevisionRecord(
                twin_id=r["twin_id"],
                revision=r["revision"],
                parent_revision=r["parent_revision"],
                graph_hash=r["graph_hash"],
                author_identity=r["author_identity"],
                mutation_notes=r["mutation_notes"],
                signature=r["signature"],
                created_at=str(r["created_at"])
            )
            for r in rev_rows
        ]

        if not revisions:
            bom_nodes_raw = doc.get("structure", {}).get("bom_nodes", [])
            try:
                tree_root = parse_bom_dict(bom_nodes_raw)
                g_hash = BomEngine.compute_hash(tree_root)
            except Exception:
                g_hash = hashlib.sha256(json.dumps(bom_nodes_raw, sort_keys=True).encode()).hexdigest()
            kp = get_or_create_default_identity()
            revisions = [create_signed_revision(twin_id, "R0", g_hash, kp)]

        conn.close()

        graph_nodes = doc.get("structure", {}).get("bom_nodes", [])
        rights_policy = doc.get("rights_policy") or {
            "mode": doc.get("identity", {}).get("declared_rights_mode", "Open Development"),
            "scope": "twin",
            "declared_by": creator_id.identity_id
        }

        prov_ledger = []
        for n in graph_nodes:
            for p in n.get("provenance", []):
                prov_ledger.append(p)

        public_envelope = {
            "twin_id": twin_id,
            "title": manifest.get("title", "Digital Twin"),
            "creator": creator_id.identity_id,
            "created_at": manifest.get("created_at"),
            "declared_rights_mode": rights_policy.get("mode")
        }

        bundle_bytes = pack_twin_bundle(
            manifest_data=manifest,
            creator_identity=creator_id,
            graph_nodes=graph_nodes,
            revisions=revisions,
            rights_policy=rights_policy,
            provenance_ledger=prov_ledger,
            public_envelope=public_envelope
        )

        out_file = Path(output_path or self.bundles_dir / f"{twin_id}.twin")
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_bytes(bundle_bytes)

        return bundle_bytes, out_file

    def twin_import(self, bundle_source: Union[str, Path, bytes], target_twin_id: Optional[str] = None) -> Dict[str, Any]:
        """Imports a .twin bundle archive after verifying all signatures."""
        res = verify_twin_bundle(bundle_source)
        if not res.valid:
            raise ValueError(f"Cannot import corrupted or tampered bundle: {res.summary}")

        if isinstance(bundle_source, (str, Path)):
            zf_source = open(bundle_source, "rb")
        else:
            import io
            zf_source = io.BytesIO(bundle_source)

        with zipfile.ZipFile(zf_source, 'r') as zf:
            manifest = json.loads(zf.read("manifest.json").decode("utf-8"))
            creator_doc = json.loads(zf.read("identity/creator.json").decode("utf-8"))
            graph_nodes = json.loads(zf.read("graph/nodes.json").decode("utf-8")) if "graph/nodes.json" in zf.namelist() else []
            raw_revs = json.loads(zf.read("signatures/revisions.json").decode("utf-8")) if "signatures/revisions.json" in zf.namelist() else []

        twin_id = target_twin_id or manifest.get("twin_id") or uuid.uuid4().hex[:4]

        # Register Identity
        conn = self.get_db()
        conn.execute("""
            INSERT OR REPLACE INTO identities (identity_id, algorithm, public_key, name, created_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            creator_doc.get("identity_id"),
            creator_doc.get("algorithm", "Ed25519"),
            creator_doc.get("public_key"),
            creator_doc.get("name"),
            creator_doc.get("created_at"),
            creator_doc.get("status", "active")
        ))

        # Register Twin
        doc = {
            "identity": {
                "title": manifest.get("title", "Imported Twin"),
                "summary": manifest.get("summary", ""),
                "creator": creator_doc.get("identity_id")
            },
            "structure": {
                "bom_nodes": graph_nodes
            }
        }
        conn.execute("""
            INSERT OR REPLACE INTO twins (id, creator, manifest_json, document_json)
            VALUES (?, ?, ?, ?)
        """, (
            twin_id,
            creator_doc.get("identity_id"),
            json.dumps(manifest),
            json.dumps(doc)
        ))

        # Register Revisions
        for r in raw_revs:
            conn.execute("""
                INSERT OR REPLACE INTO twin_revisions (twin_id, revision, parent_revision, graph_hash, author_identity, mutation_notes, signature, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                twin_id,
                r.get("revision"),
                r.get("parent_revision"),
                r.get("graph_hash"),
                r.get("author_identity"),
                r.get("mutation_notes"),
                r.get("signature"),
                r.get("created_at")
            ))

        conn.commit()
        conn.close()

        return {
            "status": "imported",
            "twin_id": twin_id,
            "title": manifest.get("title"),
            "creator": creator_doc.get("identity_id"),
            "revisions_count": len(raw_revs),
            "verification": res.to_dict()
        }

    # =========================================================================
    # BOM OPERATIONS (tt bom *)
    # =========================================================================

    def bom_inspect(self, target: Optional[Union[str, Path]] = None, twin_id: Optional[str] = None, max_depth: Optional[int] = None) -> Dict[str, Any]:
        """Inspects hierarchical BOM tree, calculating recursive cost rollups."""
        t = target or twin_id
        if not t:
            raise ValueError("target or twin_id required for bom_inspect")
        p = Path(t)
        if p.exists() and p.is_file():
            content = p.read_text(encoding="utf-8")
            if p.suffix.lower() == ".csv":
                tree_root = parse_bom_csv(content)
            else:
                data = json.loads(content)
                tree_root = parse_bom_dict(data)
            bom_nodes = flatten_bom_tree(tree_root)
        else:
            insp = self.twin_inspect(str(t))
            bom_nodes_raw = insp["document"].get("structure", {}).get("bom_nodes", [])
            tree_root = parse_bom_dict(bom_nodes_raw)
            bom_nodes = flatten_bom_tree(tree_root)

        total_cost = tree_root.cost.extended_cost or tree_root.cost.unit_cost if tree_root.cost else None
        currency = tree_root.cost.currency if tree_root.cost else "USD"

        return {
            "target": str(t),
            "tree_root": tree_root.model_dump(),
            "nodes_count": len(bom_nodes),
            "total_rolled_up_cost": total_cost,
            "currency": currency,
            "graph_hash": BomEngine.compute_hash(tree_root)
        }

    def bom_validate(self, target: Optional[Union[str, Path]] = None, twin_id: Optional[str] = None) -> Dict[str, Any]:
        """Validates BOM for orphan nodes, cyclic parent references, and cost honesty."""
        t = target or twin_id
        if not t:
            raise ValueError("target or twin_id required for bom_validate")
        try:
            insp = self.bom_inspect(target=t)
            tree_root = parse_bom_dict(insp["tree_root"])
            # Re-flatten and test
            nodes = flatten_bom_tree(tree_root)
            orphans_err = None
            cycles_err = None
            try:
                BomEngine.validate_orphans(nodes)
            except OrphanBomNodeError as oe:
                orphans_err = str(oe)
            try:
                BomEngine.validate_acyclic(nodes)
            except CyclicBomError as ce:
                cycles_err = str(ce)

            missing_quotes = [n.name for n in nodes if n.cost is None or n.cost.unit_cost is None]
            valid = (orphans_err is None and cycles_err is None)
            return {
                "valid": valid,
                "target": str(t),
                "nodes_count": len(nodes),
                "orphans_count": 1 if orphans_err else 0,
                "cycles_detected": 1 if cycles_err else 0,
                "missing_quotes_count": len(missing_quotes),
                "missing_quotes": missing_quotes,
                "summary": "VALID — Hierarchy integrity confirmed." if valid else f"FAILED — {orphans_err or cycles_err}"
            }
        except (CyclicBomError, OrphanBomNodeError, Exception) as e:
            return {
                "valid": False,
                "target": str(t),
                "error": str(e),
                "summary": f"FAILED: {str(e)}"
            }

    # =========================================================================
    # ACCESS & CAPABILITY OPERATIONS (tt access *)
    # =========================================================================

    def access_grant(
        self,
        twin_id: str,
        subject: Optional[str] = None,
        subject_did: Optional[str] = None,
        permissions: Optional[List[str]] = None,
        expires_in_seconds: Optional[int] = None,
        expires_hours: Optional[float] = None,
        issuer_name: str = "default"
    ) -> Dict[str, Any]:
        """Issues a cryptographically signed CapabilityToken."""
        target_subject = subject or subject_did
        if not target_subject:
            raise ValueError("subject or subject_did is required")

        perms = permissions or ["read"]
        exp_sec = expires_in_seconds
        if exp_sec is None and expires_hours is not None:
            exp_sec = int(expires_hours * 3600)

        try:
            kp = Keypair.load_from_disk(DEFAULT_KEYSTORE_DIR, issuer_name)
        except Exception:
            kp = get_or_create_default_identity()

        token = issue_capability(
            issuer_keypair=kp,
            subject_did=target_subject,
            twin_id=twin_id,
            permissions=perms,
            expires_in_seconds=exp_sec
        )

        conn = self.get_db()
        conn.execute("""
            INSERT INTO capabilities (token_id, subject, twin_id, permissions_json, issued_by, created_at, expires_at, signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            token.token_id,
            token.subject,
            token.twin_id,
            json.dumps(token.permissions),
            token.issued_by,
            token.created_at,
            token.expires_at,
            token.signature
        ))
        conn.commit()
        conn.close()

        return token.model_dump()

    def access_revoke(
        self,
        token_id: str,
        reason: str = "Revoked via CLI",
        revoker_name: str = "default"
    ) -> Dict[str, Any]:
        """Revokes a capability token."""
        try:
            kp = Keypair.load_from_disk(DEFAULT_KEYSTORE_DIR, revoker_name)
        except Exception:
            kp = get_or_create_default_identity()

        rec = RevocationRecord(
            token_id=token_id,
            revoked_by=kp.did,
            reason=reason
        )

        conn = self.get_db()
        conn.execute("""
            INSERT INTO capability_revocations (token_id, revoked_by, revoked_at, reason)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(token_id) DO UPDATE SET
                revoked_at=excluded.revoked_at,
                reason=excluded.reason
        """, (rec.token_id, rec.revoked_by, rec.revoked_at, rec.reason))
        conn.commit()
        conn.close()

        return rec.model_dump()

    # =========================================================================
    # EVIDENCE & CALIBRATION (tt evidence *)
    # =========================================================================

    def evidence_attach(
        self,
        twin_id: str,
        title: str = "Physical Test Run",
        csv_content: Optional[Union[str, bytes]] = None,
        csv_data: Optional[Union[str, bytes]] = None,
        evidence_type: str = "physical_test",
        operator: str = "@Engineer",
        notes: str = "",
        metrics: Optional[Dict[str, Any]] = None,
        target_node_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Attaches physical test CSV evidence and records test metrics."""
        import csv
        import io
        from .simulation.thermal import ThermalStrawSimulator
        from .simulation.flow import FlowTimeline
        from .simulation.calibration import calculate_error_metrics

        raw_csv = csv_content if csv_content is not None else csv_data
        calc_metrics: Dict[str, Any] = dict(metrics or {})
        rows: List[Dict[str, Any]] = []

        test_id = f"test_{twin_id}_{uuid.uuid4().hex[:6]}"
        csv_rel_path = ""

        if raw_csv:
            text = raw_csv.decode("utf-8", errors="ignore") if isinstance(raw_csv, bytes) else str(raw_csv)
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)
            if rows:
                cols = [c.strip() for c in (reader.fieldnames or [])]
                calc_metrics.update({"sample_count": len(rows), "columns": cols})

                # Check simulation comparison
                outlet_col = next((c for c in cols if 'outlet' in c.lower() or 'beverage' in c.lower()), None)
                if outlet_col and all(k in cols for k in ['ambient_C', 'inlet_C']):
                    try:
                        measured = [float(r[outlet_col]) for r in rows if r.get(outlet_col)]
                        amb = float(rows[0]['ambient_C'])
                        inlet = float(rows[0]['inlet_C'])
                        sim = ThermalStrawSimulator(thermal={
                            "m_pcm_kg": 0.05, "m_wall_kg": 0.015, "c_wall_J_kgK": 500.0,
                            "m_bev_kg": 0.02, "c_bev_J_kgK": 4184.0, "R_pcm_to_wall": 0.15,
                            "R_wall_to_bev": 0.30, "R_env": 2.20, "T_ambient_C": amb,
                            "T_inlet_C": inlet, "T_pcm_init_C": 54.0
                        })
                        sim_res = sim.simulate(FlowTimeline.generate_periodic(total_duration_s=len(rows), sip_interval_s=30, sip_duration_s=3), duration_s=len(rows))
                        err = calculate_error_metrics(sim_res["beverage_temp_C"], measured)
                        calc_metrics.update(err)
                    except Exception:
                        pass

                dest_csv = self.extracted_dir / twin_id / "tests" / f"{test_id}.csv"
                dest_csv.parent.mkdir(parents=True, exist_ok=True)
                dest_csv.write_text(text, encoding="utf-8")
                csv_rel_path = str(dest_csv.name)

        status = "verified" if calc_metrics.get("rmse_C", 99.0) <= 2.5 else "unverified"

        conn = self.get_db()
        cur_count = conn.execute("SELECT COUNT(*) FROM twin_tests WHERE twin_id = ?", (twin_id,)).fetchone()[0]
        next_num = cur_count + 1

        conn.execute("""
            INSERT INTO twin_tests (id, twin_id, test_number, title, operator, status, notes, csv_path, metrics, initial_conditions, raw_preview)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            test_id, twin_id, next_num, title, operator, status, notes,
            csv_rel_path, json.dumps(calc_metrics), json.dumps({}), json.dumps(rows[:50])
        ))

        # If target_node_id provided, also attach to BOM node provenance / evidence
        if target_node_id:
            row = conn.execute("SELECT document_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
            if row and row["document_json"]:
                doc = json.loads(row["document_json"])
                bom_nodes = doc.get("structure", {}).get("bom_nodes", [])
                for node in bom_nodes:
                    if node.get("node_id") == target_node_id or node.get("part_number") == target_node_id:
                        node.setdefault("evidence", []).append({
                            "evidence_id": test_id,
                            "title": title,
                            "type": evidence_type,
                            "operator": operator,
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        })
                        node.setdefault("provenance", []).append({
                            "action": "evidence_attached",
                            "evidence_id": test_id,
                            "actor": operator,
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                        })
                conn.execute("UPDATE twins SET document_json = ? WHERE id = ?", (json.dumps(doc), twin_id))

        conn.commit()
        conn.close()

        return {
            "test_id": test_id,
            "test_number": next_num,
            "twin_id": twin_id,
            "title": title,
            "status": status,
            "metrics": calc_metrics,
            "target_node_id": target_node_id
        }

    # =========================================================================
    # PROVENANCE OPERATIONS (tt provenance *)
    # =========================================================================

    def provenance_show(self, twin_id: str, node_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Extracts cryptographic provenance ledger for a Twin or specific node."""
        insp = self.twin_inspect(twin_id)
        doc = insp["document"]
        bom_nodes = doc.get("structure", {}).get("bom_nodes", [])

        ledger = []
        for n in bom_nodes:
            if node_id and n.get("node_id") != node_id and n.get("part_number") != node_id:
                continue
            for p in n.get("provenance", []):
                item = dict(p)
                item["node_id"] = n.get("node_id")
                item["node_name"] = n.get("name")
                ledger.append(item)

        return ledger

    # =========================================================================
    # DPP PROJECTION (tt dpp *)
    # =========================================================================

    def dpp_preview(self, twin_id: str, tier: str = "public", public_only: bool = False) -> Dict[str, Any]:
        """Generates tier-filtered EU DPP compliance dossier."""
        chosen_tier = "public" if (public_only or tier == "public") else tier
        insp = self.twin_inspect(twin_id)
        doc = insp["document"]
        bom_nodes = doc.get("structure", {}).get("bom_nodes", [])
        tree_root = parse_bom_dict(bom_nodes)

        dpp_report = project_dpp(tree_root, tier=chosen_tier)
        dpp_report["twin_id"] = twin_id
        dpp_report["product_name"] = insp["manifest"].get("title", "Digital Twin")
        dpp_report["manufacturer"] = insp["creator"]
        dpp_report["components"] = [
            {
                "node_id": n.node_id,
                "part_number": n.part_number,
                "name": n.name,
                "node_type": n.node_type,
                "quantity": n.quantity,
                "unit": n.unit,
                "material": n.material.name if n.material else None,
                "material_grade": n.material.grade if n.material else None,
                "supplier": n.supplier,
                "manufacturing_process": n.manufacturing.process if n.manufacturing else None,
                "dpp_id": n.dpp_id
            }
            for n in flatten_bom_tree(tree_root)
        ]
        return dpp_report
