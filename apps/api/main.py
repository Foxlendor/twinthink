import os
import shutil
import json
import uuid
import csv
import io
import math
import hashlib
from typing import List, Dict, Optional, Any
from pathlib import Path
import sys
import tempfile
import zipfile
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Header
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Add packages to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../packages'))
from twinthink.validator import validate_bundle
from twinthink.simulation.thermal import ThermalStrawSimulator
from twinthink.simulation.flow import FlowTimeline, SipEvent
from twinthink.simulation.calibration import calculate_error_metrics, generate_validation_report
from twinthink.factory import TwinFactoryEngine
from twinthink.bom import CyclicBomError, OrphanBomNodeError, project_dpp, BomNode
from twinthink.crypto import (
    IdentityDocument,
    Keypair,
    verify_signature,
    TwinRevisionRecord,
    create_signed_revision,
    verify_revision,
    verify_revision_chain,
    CapabilityToken,
    RevocationRecord,
    issue_capability,
    verify_capability,
    EncryptedSegment,
    WrappedKey,
    encrypt_segment,
    decrypt_segment,
    wrap_key_for_recipient,
    unwrap_key_with_private_key,
    pack_twin_bundle,
    verify_twin_bundle,
    get_or_create_default_identity
)
from twinthink.schema import resolve_node_rights, RightsPolicyDeclaration

app = FastAPI(title="TwinThink API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
AWS_ENDPOINT_URL_S3 = os.getenv("AWS_ENDPOINT_URL_S3")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("BUCKET_NAME", "bundles")

USE_CLOUD = all([DATABASE_URL, AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY])

# Storage Configuration
DEFAULT_STORAGE = os.path.join(os.path.dirname(__file__), "storage")
STORAGE_DIR = Path(os.getenv("TT_STORAGE_DIR", DEFAULT_STORAGE)).resolve()
BUNDLES_DIR = STORAGE_DIR / "bundles"
EXTRACTED_DIR = STORAGE_DIR / "extracted"
DB_PATH = STORAGE_DIR / "twinthink.db"

# Initialize local directories
for d in [STORAGE_DIR, BUNDLES_DIR, EXTRACTED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# S3 Client setup
s3_client = None
if USE_CLOUD:
    import boto3
    import psycopg2
    from psycopg2.extras import RealDictCursor
    print("CLOUD MODE: Using Postgres and S3/R2")
    s3_client = boto3.client(
        's3',
        region_name=AWS_REGION,
        endpoint_url=AWS_ENDPOINT_URL_S3,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    def get_db_cloud():
        return psycopg2.connect(DATABASE_URL)
else:
    import sqlite3
    print(f"LOCAL MODE: Using SQLite at {DB_PATH}")

    def get_db_local():
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    def init_local_db():
        conn = get_db_local()
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

    init_local_db()

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def generate_unique_id() -> str:
    # 4-character hex ID (e.g. 0a1b), retry if collision
    conn = get_db_local()
    for _ in range(20):
        candidate = uuid.uuid4().hex[:4]
        row = conn.execute("SELECT 1 FROM twins WHERE id = ?", (candidate,)).fetchone()
        if not row:
            conn.close()
            return candidate
    conn.close()
    return uuid.uuid4().hex[:8]

def require_owner(twin_id: str, token: Optional[str]):
    if not token:
        raise HTTPException(status_code=403, detail="Unauthorized: Owner token required")
    conn = get_db_local()
    row = conn.execute("SELECT owner_token_hash FROM twins WHERE id = ?", (twin_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Twin not found")
    expected_hash = row["owner_token_hash"]
    if not expected_hash:
        # If legacy twin without token hash, allow or deny
        return True
    if hash_token(token) != expected_hash:
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid owner token")
    return True

# Shadow continuity log (append-only, server-timestamped, hash-chained).
if not USE_CLOUD:
    from shadows import make_router as make_shadow_router
    app.include_router(make_shadow_router(get_db_local))

@app.get("/health")
async def health():
    return {"status": "ok", "mode": "cloud" if USE_CLOUD else "local", "storage_dir": str(STORAGE_DIR)}

# ==========================================
# TWIN INGESTION & CREATION
# ==========================================

@app.post("/api/twins/upload")
async def upload_twin(
    file: UploadFile = File(...),
    creator: str = Form("Anonymous"),
    owner_token: Optional[str] = Form(None)
):
    temp_dir = tempfile.mkdtemp()
    temp_zip_path = Path(temp_dir) / f"temp_{uuid.uuid4().hex}.zip"
    
    with open(temp_zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        validation_error = validate_bundle(str(temp_zip_path))
        if validation_error is not True:
            raise HTTPException(status_code=400, detail=f"Invalid Twin Bundle: {validation_error}")
            
        with zipfile.ZipFile(temp_zip_path, 'r') as zf:
            for name in zf.namelist():
                norm = name.replace('\\', '/')
                if '..' in norm or norm.startswith('/'):
                    raise HTTPException(status_code=400, detail="Invalid zip path: path traversal detected")

            with zf.open('manifest.json') as f:
                manifest = json.load(f)
                
            token = owner_token or f"tok_{uuid.uuid4().hex}"
            token_h = hash_token(token)

            if USE_CLOUD:
                conn = get_db_cloud()
                with conn.cursor() as cur:
                    cur.execute("INSERT INTO twins (manifest_json) VALUES (%s) RETURNING id", (json.dumps(manifest),))
                    twin_int_id = cur.fetchone()[0]
                conn.commit()
                conn.close()
                twin_id = f"{twin_int_id:04d}"
                
                # Upload zip to S3
                s3_key = f"{twin_id}/bundle.zip"
                with open(temp_zip_path, "rb") as f:
                    s3_client.upload_fileobj(f, BUCKET_NAME, s3_key)
                    
                # Upload extracted files to S3
                for name in zf.namelist():
                    if not name.endswith('/'):
                        with zf.open(name) as member:
                            s3_client.upload_fileobj(member, BUCKET_NAME, f"{twin_id}/assets/{name}")
            else:
                twin_id = generate_unique_id()
                conn = get_db_local()
                
                final_zip_path = BUNDLES_DIR / f"{twin_id}.zip"
                shutil.copyfile(str(temp_zip_path), str(final_zip_path))
                
                extract_path = EXTRACTED_DIR / twin_id
                extract_path.mkdir(parents=True, exist_ok=True)
                zf.extractall(extract_path)

                # Build file_map from extracted files
                file_map: Dict[str, bytes] = {}
                for name in zf.namelist():
                    if not name.endswith('/'):
                        member_path = extract_path / name
                        if member_path.exists() and member_path.is_file():
                            file_map[name.replace('\\', '/')] = member_path.read_bytes()

                # Derive full TwinDocument
                doc_json_str = None
                if "twin.json" in file_map:
                    try:
                        doc_json_str = file_map["twin.json"].decode("utf-8", errors="ignore")
                    except Exception:
                        pass
                if not doc_json_str:
                    try:
                        compiled_doc = TwinFactoryEngine.process_bundle(file_map, twin_id=twin_id, creator=creator)
                        doc_json_str = compiled_doc.model_dump_json()
                    except Exception:
                        doc_json_str = json.dumps({"identity": manifest})

                conn.execute(
                    "INSERT INTO twins (id, creator, owner_token_hash, manifest_json, document_json) VALUES (?, ?, ?, ?, ?)",
                    (twin_id, creator, token_h, json.dumps(manifest), doc_json_str)
                )

                # Record file inventory
                for name in zf.namelist():
                    if not name.endswith('/'):
                        member_path = extract_path / name
                        if member_path.exists() and member_path.is_file():
                            sz = member_path.stat().st_size
                            content_bytes = member_path.read_bytes()
                            h = hashlib.sha256(content_bytes).hexdigest()
                            conn.execute(
                                "INSERT OR REPLACE INTO twin_files (twin_id, relative_path, size_bytes, sha256) VALUES (?, ?, ?, ?)",
                                (twin_id, name.replace('\\', '/'), sz, h)
                            )
                conn.commit()
                conn.close()
                    
        return {"status": "success", "id": twin_id, "owner_token": token}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_zip_path.exists():
            os.remove(temp_zip_path)
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.post("/api/twins/create")
async def create_twin_from_factory(
    files: List[UploadFile] = File(...),
    creator: str = Form("Anonymous"),
    owner_token: Optional[str] = Form(None)
):
    """
    Twin Factory Ingestion Pipeline:
    Accepts raw CAD, CSV, Markdown, and Images, parses them into a structured TwinDocument,
    saves the compiled bundle and metadata to persistent local storage, and returns
    discovered counts and owner token.
    """
    file_map: Dict[str, bytes] = {}
    
    for upload in files:
        data = await upload.read()
        fname = upload.filename or "file"
        
        # If it's a zip bundle, unpack members safely
        if fname.lower().endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(data), 'r') as zf:
                    for member in zf.namelist():
                        norm = member.replace('\\', '/')
                        if '..' in norm or norm.startswith('/'):
                            raise HTTPException(status_code=400, detail="Invalid zip member: path traversal detected")
                        if not member.endswith('/'):
                            file_map[norm] = zf.read(member)
            except HTTPException:
                raise
            except Exception as e:
                file_map[fname] = data
        else:
            norm = fname.replace('\\', '/')
            if '..' in norm or norm.startswith('/'):
                raise HTTPException(status_code=400, detail="Invalid filename: path traversal detected")
            file_map[norm] = data
            
    twin_id = generate_unique_id()
    token = owner_token or f"tok_{uuid.uuid4().hex}"
    token_h = hash_token(token)

    # Process through TwinFactoryEngine
    try:
        twin_doc = TwinFactoryEngine.process_bundle(file_map, twin_id=twin_id, creator=creator)
    except CyclicBomError as e:
        raise HTTPException(status_code=400, detail=f"Cyclic BOM Error: {str(e)}")
    except OrphanBomNodeError as e:
        raise HTTPException(status_code=400, detail=f"Orphan BOM Node Error: {str(e)}")
    
    # Derive compliant manifest.json
    assets_list = []
    for rel_path, content in file_map.items():
        media_type = "application/octet-stream"
        lower = rel_path.lower()
        if lower.endswith(".md"):
            media_type = "text/markdown"
        elif lower.endswith(".csv"):
            media_type = "text/csv"
        elif lower.endswith(".json"):
            media_type = "application/json"
        elif lower.endswith(".glb"):
            media_type = "model/gltf-binary"
        elif lower.endswith((".step", ".stp")):
            media_type = "application/step"
        elif lower.endswith((".jpg", ".jpeg")):
            media_type = "image/jpeg"
        elif lower.endswith(".png"):
            media_type = "image/png"

        entrypoint_name = ""
        is_entry = 0
        if lower.endswith("bom.csv"):
            entrypoint_name = "bom"
            is_entry = 1
        elif lower.endswith("preview.glb"):
            entrypoint_name = "cad_preview"
            is_entry = 1
        elif lower.endswith((".step", ".stp")):
            entrypoint_name = "cad_source"
            is_entry = 1
        elif lower.endswith("spec.md"):
            entrypoint_name = "spec"
            is_entry = 1
        elif lower.endswith("readme.md"):
            entrypoint_name = "readme"
            is_entry = 1

        # Determine explicit asset kind and format
        ext = rel_path.rsplit(".", 1)[-1].lower() if "." in rel_path else "bin"
        if lower.endswith(("preview.glb", "concept_preview.glb", "preview.gltf")) or entrypoint_name == "cad_preview":
            kind = "concept_preview"
        elif lower.endswith((".step", ".stp", ".dwg", ".dxf", ".fcstd", ".sldprt")) or entrypoint_name == "cad_source":
            kind = "engineering_cad"
        elif lower.endswith(("bom.csv", "bom.json")) or entrypoint_name == "bom":
            kind = "bom"
        elif lower.endswith("spec.md") or entrypoint_name == "spec":
            kind = "specification"
        elif lower.endswith("readme.md") or entrypoint_name == "readme":
            kind = "documentation"
        elif lower.endswith((".py", ".json", ".csv")):
            kind = "simulation_data"
        else:
            kind = "file"

        asset_id = f"asset-{hashlib.sha256(rel_path.encode()).hexdigest()[:12]}"

        assets_list.append({
            "id": asset_id,
            "kind": kind,
            "format": ext,
            "relative_path": rel_path,
            "url": f"/api/twins/{twin_id}/assets/{rel_path}",
            "media_type": media_type,
            "size_bytes": len(content),
            "is_entrypoint": is_entry,
            "entrypoint_name": entrypoint_name,
            "publication_scope": "private"
        })

    # Add README and spec if not already in file map
    if "README.md" not in file_map and "readme.md" not in file_map:
        readme_bytes = f"# {twin_doc.identity.title}\n\n> {twin_doc.identity.summary}\n".encode("utf-8")
        file_map["README.md"] = readme_bytes
        assets_list.append({
            "id": f"asset-{hashlib.sha256(b'README.md').hexdigest()[:12]}",
            "kind": "documentation",
            "format": "md",
            "relative_path": "README.md",
            "url": f"/api/twins/{twin_id}/assets/README.md",
            "media_type": "text/markdown",
            "size_bytes": len(readme_bytes),
            "is_entrypoint": 1,
            "entrypoint_name": "readme",
            "publication_scope": "private"
        })

    if "spec.md" not in file_map and "spec.md" not in file_map:
        spec_bytes = f"# Specification: {twin_doc.identity.title}\n\nVersion: {twin_doc.identity.version}\nLicense: {twin_doc.identity.license}\n".encode("utf-8")
        file_map["spec.md"] = spec_bytes
        assets_list.append({
            "id": f"asset-{hashlib.sha256(b'spec.md').hexdigest()[:12]}",
            "kind": "specification",
            "format": "md",
            "relative_path": "spec.md",
            "url": f"/api/twins/{twin_id}/assets/spec.md",
            "media_type": "text/markdown",
            "size_bytes": len(spec_bytes),
            "is_entrypoint": 1,
            "entrypoint_name": "spec",
            "publication_scope": "private"
        })

    # Create derived manifest
    manifest = {
        "version": twin_doc.identity.version,
        "visibility": "private",
        "publication_status": "draft",
        "disclosure": {
            "public_preview_approved": False,
            "level": 1,
            "public_note": "No engineering package is public by default."
        },
        "title": twin_doc.identity.title,
        "summary": twin_doc.identity.summary,
        "license": twin_doc.identity.license,
        "ontology_class": twin_doc.identity.classification,
        "creator": creator,
        "creator_public": False,
        "properties": [
            {
                "key": "estimated_bom_usd",
                "value": twin_doc.structure.estimated_bom_usd,
                "type": "number",
                "unit": "USD",
                "label": "Estimated BOM"
            }
        ] if twin_doc.structure.estimated_bom_usd is not None else [],
        "relationships": [],
        "assets": assets_list,
        "parent_twin": twin_doc.lineage.parent_twin_id
    }

    manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")

    # Persist bundle zip and extracted directory
    extract_path = EXTRACTED_DIR / twin_id
    extract_path.mkdir(parents=True, exist_ok=True)

    bundle_zip_path = BUNDLES_DIR / f"{twin_id}.zip"
    with zipfile.ZipFile(bundle_zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", manifest_bytes)
        (extract_path / "manifest.json").write_bytes(manifest_bytes)
        
        for rel_path, data in file_map.items():
            if rel_path.lower() == "manifest.json":
                continue
            zf.writestr(rel_path, data)
            dest_file = extract_path / rel_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            dest_file.write_bytes(data)

    # Persist to SQLite
    conn = get_db_local()
    conn.execute(
        "INSERT INTO twins (id, creator, owner_token_hash, manifest_json, document_json) VALUES (?, ?, ?, ?, ?)",
        (twin_id, creator, token_h, json.dumps(manifest), json.dumps(twin_doc.model_dump()))
    )
    for asset in assets_list:
        p = asset["relative_path"]
        content = file_map.get(p, b"")
        h = hashlib.sha256(content).hexdigest()
        conn.execute(
            "INSERT OR REPLACE INTO twin_files (twin_id, relative_path, size_bytes, sha256) VALUES (?, ?, ?, ?)",
            (twin_id, p, asset["size_bytes"], h)
        )
    conn.commit()
    conn.close()

    relationships_count = sum(len(c.relationships) for c in twin_doc.claims) + len(twin_doc.structure.components) * 2

    return {
        "status": "success",
        "id": twin_id,
        "owner_token": token,
        "discovery": {
            "title": twin_doc.identity.title,
            "summary": twin_doc.identity.summary,
            "objects_count": 1,
            "components_count": len(twin_doc.structure.components),
            "claims_count": len(twin_doc.claims),
            "relationships_count": relationships_count,
            "files_ingested_count": len(file_map),
            "reality_state": twin_doc.reality_state.model_dump()
        },
        "twin": twin_doc.model_dump()
    }

# ==========================================
# TWIN RETRIEVAL & MANAGEMENT
# ==========================================

@app.get("/api/twins")
async def list_twins():
    conn = get_db_local()
    rows = conn.execute("SELECT id, creator, manifest_json, created_at FROM twins ORDER BY created_at DESC").fetchall()
    conn.close()
    twins = []
    for r in rows:
        try:
            m = json.loads(r["manifest_json"])
            if m.get("visibility") != "public" or m.get("publication_status") != "approved":
                continue
            twins.append({
                "id": r["id"],
                "title": m.get("title", "Untitled"),
                "summary": m.get("summary", ""),
                "created_at": str(r["created_at"])
            })
        except Exception:
            continue
    return {"twins": twins}

@app.get("/api/twins/{twin_id}")
async def get_twin(twin_id: str, x_twin_owner_token: Optional[str] = Header(None)):
    if USE_CLOUD:
        conn = get_db_cloud()
        with conn.cursor() as cur:
            cur.execute("SELECT manifest_json FROM twins WHERE id = %s", (int(twin_id),))
            row = cur.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Twin not found")
        manifest_json = row[0]
        creator = "Anon"
        created_at = ""
        doc_json = None
    else:
        conn = get_db_local()
        cursor = conn.execute("SELECT creator, manifest_json, document_json, created_at FROM twins WHERE id = ?", (twin_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Twin not found")
        manifest_json = row['manifest_json']
        creator = row['creator'] or "Anonymous"
        created_at = str(row['created_at'])
        doc_json = row['document_json']
        
    manifest = json.loads(manifest_json)

    is_owner = False
    if x_twin_owner_token:
        try:
            is_owner = require_owner(twin_id, x_twin_owner_token)
        except HTTPException:
            is_owner = False

    if not is_owner and (
        manifest.get("visibility") != "public" or
        manifest.get("publication_status") != "approved"
    ):
        raise HTTPException(status_code=404, detail="Twin not publicly published")

    # Format lineage
    parent_twin = manifest.get("parent_twin")
    lineage_parent = None
    if parent_twin:
        lineage_parent = {
            "parent_twin_id": parent_twin,
            "parent_version": "1.0.0",
            "mutation_notes": "Derived from parent digital twin"
        }

    response = {
        "id": twin_id,
        "slug": f"{twin_id}-{manifest.get('title', 'twin').lower().replace(' ', '-')[:30]}",
        "creator": creator if is_owner or manifest.get("creator_public") else None,
        "created_at": created_at,
        "current_version": manifest if is_owner else {
            "version": manifest.get("version", "1.0.0"),
            "title": manifest.get("title", "Untitled"),
            "summary": manifest.get("summary", ""),
            "license": manifest.get("license", "All rights reserved"),
            "ontology_class": manifest.get("ontology_class", "Concept"),
            "properties": [],
            "relationships": [],
            "assets": [
                asset for asset in manifest.get("assets", [])
                if asset.get("publication_scope") == "public_preview"
            ],
            "disclosure": manifest.get("disclosure", {})
        },
        "lineage": {
            "parent": lineage_parent,
            "descendants": [],
            "root_twin_id": parent_twin or twin_id
        },
        "versions": [
            {
                "semver": manifest.get("version", "1.0.0"),
                "title": manifest.get("title", "Untitled"),
                "published_at": created_at
            }
        ]
    }
    if doc_json and is_owner:
        try:
            response["document"] = json.loads(doc_json)
        except Exception:
            pass
    return response

@app.get("/api/twins/{twin_id}/dpp")
async def get_twin_dpp_projection(twin_id: str, tier: str = "public"):
    """
    Returns an uncertified DPP Projection Preview for the twin based on current graph attributes.
    Supports tier: 'public', 'recycler', 'authority'.
    """
    if tier not in ["public", "recycler", "authority"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Must be 'public', 'recycler', or 'authority'.")
    twin_data = await get_twin(twin_id)
    doc_dict = twin_data.get("document")
    if not doc_dict or not doc_dict.get("structure") or not doc_dict["structure"].get("bom_root"):
        raise HTTPException(status_code=404, detail="No structural BOM graph found on twin to project DPP")
    bom_root = BomNode.model_validate(doc_dict["structure"]["bom_root"])
    projection = project_dpp(bom_root, tier=tier)  # type: ignore
    projection["twin_id"] = twin_id
    return projection

@app.post("/api/twins/{twin_id}/publication")
async def update_publication(
    twin_id: str,
    action: str = Form(...),
    owner_token: Optional[str] = Form(None),
    x_twin_owner_token: Optional[str] = Header(None)
):
    """Explicit inventor-controlled public concept publication gate."""
    token = x_twin_owner_token or owner_token
    require_owner(twin_id, token)

    if action not in {"approve", "revoke"}:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'revoke'")

    conn = get_db_local()
    row = conn.execute("SELECT manifest_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Twin not found")

    manifest = json.loads(row["manifest_json"])
    assets = manifest.get("assets", [])

    if action == "approve":
        preview_assets = [
            a for a in assets
            if a.get("kind") == "concept_preview" or (
                a.get("entrypoint_name") == "cad_preview"
                and a.get("relative_path", "").lower().endswith((".glb", ".gltf"))
            )
        ]
        if not preview_assets:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="No concept preview asset is available. Add an explicitly approved concept_preview asset first."
            )

        for asset in assets:
            if not asset.get("kind"):
                if asset in preview_assets:
                    asset["kind"] = "concept_preview"
                else:
                    asset["kind"] = "engineering_asset"
            if not asset.get("format"):
                ext = asset.get("relative_path", "").rsplit(".", 1)[-1].lower() if "." in asset.get("relative_path", "") else "bin"
                asset["format"] = ext

            asset["publication_scope"] = "public_preview" if asset in preview_assets else "private"

        manifest["visibility"] = "public"
        manifest["publication_status"] = "approved"
        manifest["disclosure"] = {
            "public_preview_approved": True,
            "level": 1,
            "public_note": "Interactive concept preview only. Manufacturing geometry and the engineering package remain restricted."
        }
    else:
        for asset in assets:
            asset["publication_scope"] = "private"
        manifest["visibility"] = "private"
        manifest["publication_status"] = "draft"
        manifest["disclosure"] = {
            "public_preview_approved": False,
            "level": 1,
            "public_note": "No engineering package is public by default."
        }

    conn.execute(
        "UPDATE twins SET manifest_json = ? WHERE id = ?",
        (json.dumps(manifest), twin_id)
    )
    conn.commit()
    conn.close()

    mf_path = EXTRACTED_DIR / twin_id / "manifest.json"
    if mf_path.exists():
        mf_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    return {
        "status": "success",
        "id": twin_id,
        "visibility": manifest["visibility"],
        "publication_status": manifest["publication_status"],
        "disclosure": manifest["disclosure"]
    }


@app.patch("/api/twins/{twin_id}")
async def edit_twin(
    twin_id: str,
    request: Request,
    title: Optional[str] = Form(None),
    summary: Optional[str] = Form(None),
    license: Optional[str] = Form(None),
    creator: Optional[str] = Form(None),
    owner_token: Optional[str] = Form(None),
    x_twin_owner_token: Optional[str] = Header(None)
):
    token = x_twin_owner_token or owner_token
    # Also check JSON body if form is empty
    if not token and request.headers.get("content-type", "").startswith("application/json"):
        try:
            body = await request.json()
            token = body.get("owner_token")
            title = title or body.get("title")
            summary = summary or body.get("summary")
            license = license or body.get("license")
            creator = creator or body.get("creator")
        except Exception:
            pass

    require_owner(twin_id, token)

    conn = get_db_local()
    row = conn.execute("SELECT manifest_json, document_json, creator FROM twins WHERE id = ?", (twin_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Twin not found")

    manifest = json.loads(row["manifest_json"])
    doc = json.loads(row["document_json"]) if row["document_json"] else {}

    if title:
        manifest["title"] = title
        if "identity" in doc:
            doc["identity"]["title"] = title
    if summary:
        manifest["summary"] = summary
        if "identity" in doc:
            doc["identity"]["summary"] = summary
    if license:
        manifest["license"] = license
        if "identity" in doc:
            doc["identity"]["license"] = license
    new_creator = creator or row["creator"]

    conn.execute(
        "UPDATE twins SET creator = ?, manifest_json = ?, document_json = ? WHERE id = ?",
        (new_creator, json.dumps(manifest), json.dumps(doc), twin_id)
    )
    conn.commit()
    conn.close()

    # Update manifest on disk if exists
    mf_path = EXTRACTED_DIR / twin_id / "manifest.json"
    if mf_path.exists():
        mf_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Update manifest inside bundle zip if exists
    bundle_zip_path = BUNDLES_DIR / f"{twin_id}.zip"
    if bundle_zip_path.exists():
        temp_zip = bundle_zip_path.with_suffix(".tmp.zip")
        with zipfile.ZipFile(bundle_zip_path, 'r') as zin:
            with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
                for item in zin.namelist():
                    if item.lower() != "manifest.json":
                        zout.writestr(item, zin.read(item))
                zout.writestr("manifest.json", json.dumps(manifest, indent=2).encode("utf-8"))
        shutil.move(str(temp_zip), str(bundle_zip_path))

    return {"status": "success", "id": twin_id, "twin": manifest}

@app.get("/api/twins/{twin_id}/assets/{path:path}")
async def get_asset(
    twin_id: str,
    path: str,
    x_twin_owner_token: Optional[str] = Header(None)
):
    if ".." in path or path.startswith("/") or "\\" in path:
        raise HTTPException(status_code=400, detail="Invalid path: path traversal detected")

    conn = get_db_local()
    row = conn.execute("SELECT manifest_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Twin not found")

    manifest = json.loads(row["manifest_json"])
    asset = next((a for a in manifest.get("assets", []) if a.get("relative_path") == path), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    public_preview = (
        manifest.get("visibility") == "public"
        and manifest.get("publication_status") == "approved"
        and asset.get("publication_scope") == "public_preview"
    )

    if not public_preview:
        require_owner(twin_id, x_twin_owner_token)

    if USE_CLOUD:
        s3_key = f"{twin_id}/assets/{path}"
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=3600
        )
        return RedirectResponse(url)
    else:
        asset_path = EXTRACTED_DIR / twin_id / path
        if not asset_path.exists() or not asset_path.is_file():
            raise HTTPException(status_code=404, detail="Asset not found")
        return FileResponse(str(asset_path))
    
@app.get("/api/twins/{twin_id}/download")
async def download_bundle(twin_id: str, x_twin_owner_token: Optional[str] = Header(None)):
    require_owner(twin_id, x_twin_owner_token)
    if USE_CLOUD:
        s3_key = f"{twin_id}/bundle.zip"
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME, 
                'Key': s3_key,
                'ResponseContentDisposition': f'attachment; filename="twin_{twin_id}.zip"'
            },
            ExpiresIn=3600
        )
        return RedirectResponse(url)
    else:
        bundle_path = BUNDLES_DIR / f"{twin_id}.zip"
        if not bundle_path.exists():
            raise HTTPException(status_code=404, detail="Bundle not found")
        return FileResponse(str(bundle_path), filename=f"twin_{twin_id}.zip", media_type="application/zip")

@app.get("/api/twins/{twin_id}/bom")
async def get_twin_bom(twin_id: str, x_twin_owner_token: Optional[str] = Header(None)):
    """
    Returns the canonical hierarchical Bill of Materials (BOM) for a twin,
    including the tree root, flattened nodes, total rolled-up cost, and currency.
    """
    require_owner(twin_id, x_twin_owner_token)
    conn = get_db_local()
    row = conn.execute("SELECT manifest_json, document_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Twin not found")

    doc = json.loads(row["document_json"]) if row["document_json"] else {}
    structure = doc.get("structure", {})
    bom_root = structure.get("bom_root")
    bom_nodes = structure.get("bom_nodes", [])
    components = structure.get("components", [])

    total_cost = None
    currency = "USD"
    if bom_root and isinstance(bom_root, dict) and bom_root.get("cost"):
        total_cost = bom_root["cost"].get("extended_cost") or bom_root["cost"].get("unit_cost")
        currency = bom_root["cost"].get("currency", "USD")
    if total_cost is None:
        total_cost = structure.get("estimated_bom_usd")

    return {
        "twin_id": twin_id,
        "bom_root": bom_root,
        "bom_nodes": bom_nodes,
        "total_cost": total_cost,
        "currency": currency,
        "leaf_components_count": len(components)
    }

@app.get("/api/twins/{twin_id}/bom/dpp")
async def get_twin_dpp(twin_id: str):
    """
    EU Digital Product Passport (DPP) compliance endpoint (2027 mandate preparation).
    Extracts component traceability, materials, recycled content, and supplier provenance.
    """
    conn = get_db_local()
    row = conn.execute("SELECT creator, manifest_json, document_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Twin not found")

    manifest = json.loads(row["manifest_json"])
    doc = json.loads(row["document_json"]) if row["document_json"] else {}
    structure = doc.get("structure", {})
    bom_nodes = structure.get("bom_nodes", [])
    components = structure.get("components", [])

    dpp_components = []
    if bom_nodes:
        for node in bom_nodes:
            mat = node.get("material") or {}
            mfg = node.get("manufacturing") or {}
            dpp_components.append({
                "node_id": node.get("node_id"),
                "parent_id": node.get("parent_id"),
                "node_type": node.get("node_type", "component"),
                "name": node.get("name"),
                "part_number": node.get("part_number") or node.get("node_id"),
                "revision": node.get("revision", "R1"),
                "quantity": node.get("quantity", 1),
                "unit": node.get("unit", "ea"),
                "material": mat.get("name") if isinstance(mat, dict) else mat,
                "material_grade": mat.get("grade") if isinstance(mat, dict) else None,
                "recycled_content_pct": mat.get("recycled_content_pct") if isinstance(mat, dict) else None,
                "manufacturing_process": mfg.get("process") if isinstance(mfg, dict) else None,
                "surface_finish": mfg.get("finish") if isinstance(mfg, dict) else None,
                "supplier": node.get("supplier"),
                "dpp_id": node.get("dpp_id")
            })
    else:
        for comp in components:
            dpp_components.append({
                "node_id": comp.get("cad_body_name") or comp.get("name", "comp"),
                "parent_id": None,
                "node_type": "component",
                "name": comp.get("name"),
                "part_number": comp.get("name"),
                "revision": "R1",
                "quantity": comp.get("qty", 1),
                "unit": "ea",
                "material": comp.get("material"),
                "supplier": comp.get("supplier"),
                "dpp_id": None
            })

    return {
        "twin_id": twin_id,
        "dpp_version": "2027.1",
        "product_name": manifest.get("title", "Unknown"),
        "manufacturer": row["creator"] or manifest.get("creator", "Unknown"),
        "license": manifest.get("license", "CERN-OHL-S-2.0"),
        "components": dpp_components
    }

# ==========================================
# M3: CRYPTOGRAPHIC IDENTITY, REVISIONS, CAPABILITIES & BUNDLE API
# ==========================================

@app.post("/api/identities")
async def register_identity(doc: IdentityDocument):
    """Registers or updates a public creator IdentityDocument."""
    conn = get_db_local()
    conn.execute("""
        INSERT INTO identities (identity_id, algorithm, public_key, name, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(identity_id) DO UPDATE SET
            name=excluded.name,
            status=excluded.status
    """, (
        doc.identity_id,
        doc.algorithm,
        doc.public_key,
        doc.name,
        doc.created_at,
        doc.status
    ))
    conn.commit()
    conn.close()
    return doc

@app.get("/api/identities/{identity_id}")
async def get_identity(identity_id: str):
    """Fetches a registered IdentityDocument by its DID."""
    conn = get_db_local()
    row = conn.execute("SELECT * FROM identities WHERE identity_id = ?", (identity_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Identity not found")
    return {
        "identity_id": row["identity_id"],
        "algorithm": row["algorithm"],
        "public_key": row["public_key"],
        "name": row["name"],
        "created_at": str(row["created_at"]),
        "status": row["status"]
    }

@app.post("/api/twins/{twin_id}/revisions")
async def create_revision_endpoint(twin_id: str, rec: TwinRevisionRecord):
    """
    Submits a signed revision for a twin.
    Verifies author Ed25519 signature and revision chain continuity.
    """
    if rec.twin_id != twin_id:
        raise HTTPException(status_code=400, detail=f"Revision twin_id mismatch: {rec.twin_id} vs {twin_id}")

    # Verify signature
    if not verify_revision(rec):
        raise HTTPException(status_code=400, detail="Invalid cryptographic signature on revision")

    conn = get_db_local()
    # Check parent continuity if existing revisions
    rows = conn.execute(
        "SELECT * FROM twin_revisions WHERE twin_id = ? ORDER BY id ASC",
        (twin_id,)
    ).fetchall()

    existing_revs = [
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
        for r in rows
    ]

    if existing_revs:
        last_rev = existing_revs[-1]
        expected_parent = last_rev.compute_hash()
        if rec.parent_revision != expected_parent:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Broken revision lineage: expected parent_revision {expected_parent[:12]}..., got {str(rec.parent_revision)[:12]}..."
            )
    else:
        if rec.parent_revision is not None:
            conn.close()
            raise HTTPException(status_code=400, detail="Initial revision must have parent_revision == null")

    try:
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
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Failed to record revision: {str(e)}")
    conn.close()

    return {
        "status": "signed",
        "twin_id": twin_id,
        "revision": rec.revision,
        "commit_hash": rec.compute_hash(),
        "record": rec.model_dump()
    }

@app.get("/api/twins/{twin_id}/revisions")
async def list_twin_revisions(twin_id: str):
    """Returns the signed revision chain for a twin and verifies chain integrity."""
    conn = get_db_local()
    rows = conn.execute(
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
        for r in rows
    ]

    chain_ok, chain_err = verify_revision_chain(revisions) if revisions else (True, None)

    return {
        "twin_id": twin_id,
        "revisions_count": len(revisions),
        "chain_valid": chain_ok,
        "chain_error": chain_err,
        "revisions": [r.model_dump() for r in revisions]
    }

@app.post("/api/twins/{twin_id}/capabilities")
async def issue_capability_endpoint(twin_id: str, token: CapabilityToken):
    """Registers an authorized CapabilityToken for a subject DID."""
    if token.twin_id != twin_id:
        raise HTTPException(status_code=400, detail="Capability twin_id mismatch")

    valid, err = verify_capability(token)
    if not valid:
        raise HTTPException(status_code=400, detail=f"Invalid capability token: {err}")

    conn = get_db_local()
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

    return {"status": "issued", "token": token.model_dump()}

@app.post("/api/twins/{twin_id}/capabilities/revoke")
async def revoke_capability_endpoint(twin_id: str, revocation: RevocationRecord):
    """Revokes a previously issued capability token."""
    conn = get_db_local()
    conn.execute("""
        INSERT INTO capability_revocations (token_id, revoked_by, revoked_at, reason)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(token_id) DO UPDATE SET
            revoked_at=excluded.revoked_at,
            reason=excluded.reason
    """, (
        revocation.token_id,
        revocation.revoked_by,
        revocation.revoked_at,
        revocation.reason
    ))
    conn.commit()
    conn.close()

    return {"status": "revoked", "token_id": revocation.token_id}

@app.get("/api/twins/{twin_id}/capabilities")
async def list_twin_capabilities(twin_id: str):
    """Lists capability tokens and revocations for a twin."""
    conn = get_db_local()
    caps = conn.execute("SELECT * FROM capabilities WHERE twin_id = ?", (twin_id,)).fetchall()
    revs = set(r[0] for r in conn.execute("SELECT token_id FROM capability_revocations").fetchall())
    conn.close()

    result = []
    for c in caps:
        is_rev = c["token_id"] in revs
        result.append({
            "token_id": c["token_id"],
            "subject": c["subject"],
            "twin_id": c["twin_id"],
            "permissions": json.loads(c["permissions_json"]),
            "issued_by": c["issued_by"],
            "created_at": str(c["created_at"]),
            "expires_at": str(c["expires_at"]) if c["expires_at"] else None,
            "revoked": is_rev
        })
    return {"twin_id": twin_id, "capabilities": result}

@app.get("/api/twins/{twin_id}/bundle")
async def get_twin_m3_bundle(twin_id: str):
    """
    Exports a 100% portable, verifiable .twin bundle containing:
    - manifest.json
    - identity/creator.json
    - graph/nodes.json & graph/edges.json
    - revisions/*.json & signatures/revisions.json
    - rights/policy.json
    - provenance/ledger.json
    - public/envelope.json
    """
    conn = get_db_local()
    row = conn.execute("SELECT * FROM twins WHERE id = ?", (twin_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Twin not found")

    manifest = json.loads(row["manifest_json"]) if row["manifest_json"] else {}
    doc = json.loads(row["document_json"]) if row["document_json"] else {}

    # Get identity
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
        # Generate or mock identity document from creator string
        kp = get_or_create_default_identity()
        creator_id = kp.export_identity(name=creator_did or "Anonymous Creator")

    # Get revisions
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

    # If no revisions recorded yet, create signed initial R0 revision
    if not revisions:
        from twinthink.bom import BomEngine, parse_bom_dict
        bom_nodes_raw = doc.get("structure", {}).get("bom_nodes", [])
        try:
            tree_root = parse_bom_dict(bom_nodes_raw)
            g_hash = BomEngine.compute_hash(tree_root)
        except Exception:
            g_hash = hashlib.sha256(json.dumps(bom_nodes_raw, sort_keys=True).encode()).hexdigest()
        kp = get_or_create_default_identity()
        r0 = create_signed_revision(
            twin_id=twin_id,
            revision_name="R0",
            graph_hash=g_hash,
            keypair=kp,
            mutation_notes="Initial M3 export snapshot"
        )
        revisions = [r0]

    conn.close()

    graph_nodes = doc.get("structure", {}).get("bom_nodes", [])
    rights_policy = doc.get("rights_policy") or {
        "mode": doc.get("identity", {}).get("declared_rights_mode", "Open Development"),
        "scope": "twin",
        "declared_by": creator_id.identity_id
    }

    # Extract provenance ledger from nodes
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

    from fastapi import Response
    return Response(
        content=bundle_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="twin_{twin_id}.twin"'}
    )

@app.post("/api/twins/verify-bundle")
async def verify_bundle_endpoint(file: UploadFile = File(...)):
    """Verifies a portable .twin bundle archive 100% offline."""
    content = await file.read()
    result = verify_twin_bundle(content)
    return result.to_dict()

# ==========================================
# PHYSICAL TEST TELEMETRY & CALIBRATION API
# ==========================================

@app.get("/api/twins/{twin_id}/tests")
async def get_twin_tests(twin_id: str):
    if USE_CLOUD:
        conn = get_db_cloud()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, test_number, title, operator, status, notes, s3_csv_key, metrics, initial_conditions, raw_preview, created_at
                FROM twin_tests
                WHERE twin_id = %s
                ORDER BY test_number DESC
            """, (int(twin_id),))
            rows = cur.fetchall()
        conn.close()
    else:
        conn = get_db_local()
        rows = conn.execute("""
            SELECT id, test_number, title, operator, status, notes, csv_path as s3_csv_key, metrics, initial_conditions, raw_preview, created_at
            FROM twin_tests
            WHERE twin_id = ?
            ORDER BY test_number DESC
        """, (twin_id,)).fetchall()
        conn.close()

    tests_list = []
    total_rmse = 0.0
    total_mae = 0.0
    valid_metric_count = 0
    
    for r in rows:
        m = r['metrics'] if isinstance(r['metrics'], dict) else (json.loads(r['metrics']) if r['metrics'] else {})
        init = r['initial_conditions'] if isinstance(r['initial_conditions'], dict) else (json.loads(r['initial_conditions']) if r['initial_conditions'] else {})
        prev = r['raw_preview'] if isinstance(r['raw_preview'], list) else (json.loads(r['raw_preview']) if r['raw_preview'] else [])
        
        if 'rmse_C' in m and m['rmse_C'] is not None:
            total_rmse += m['rmse_C']
            valid_metric_count += 1
        if 'mae_C' in m and m['mae_C'] is not None:
            total_mae += m['mae_C']
        
        tests_list.append({
            "id": r['id'],
            "test_number": r['test_number'],
            "title": r['title'],
            "operator": r['operator'],
            "status": r['status'],
            "notes": r['notes'],
            "s3_csv_key": r['s3_csv_key'],
            "metrics": m,
            "initial_conditions": init,
            "raw_preview": prev,
            "created_at": str(r['created_at'])
        })

    count = len(tests_list)
    avg_rmse = round(total_rmse / valid_metric_count, 2) if valid_metric_count > 0 else None
    avg_mae = round(total_mae / valid_metric_count, 2) if valid_metric_count > 0 else None
    model_status = "EXPERIMENTALLY_CALIBRATED" if (valid_metric_count > 0 and avg_rmse is not None and avg_rmse <= 2.5) else "CALIBRATION_REQUIRED"

    return {
        "twin_id": twin_id,
        "summary": {
            "physical_tests_count": count,
            "mean_absolute_error_C": avg_mae or 0.0,
            "root_mean_square_error_C": avg_rmse or 0.0,
            "model_status": model_status,
            "last_test": f"Test #{tests_list[0]['test_number']:03d}" if count > 0 else "None"
        },
        "tests": tests_list
    }

@app.post("/api/twins/{twin_id}/tests")
async def upload_twin_test(
    twin_id: str,
    file: UploadFile = File(...),
    title: str = Form("Physical Test Run"),
    operator: str = Form("@Anonymous"),
    notes: str = Form(""),
    owner_token: Optional[str] = Form(None),
    x_twin_owner_token: Optional[str] = Header(None)
):
    token = x_twin_owner_token or owner_token
    require_owner(twin_id, token)

    content = await file.read()
    text = content.decode('utf-8', errors='ignore')
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Flexible column detection
    cols = [c.strip() for c in (reader.fieldnames or [])]
    temp_cols = [c for c in cols if 'c' in c.lower() or 'temp' in c.lower()]
    
    test_id = f"test_{twin_id}_{uuid.uuid4().hex[:6]}"
    dest_csv = EXTRACTED_DIR / twin_id / "tests" / f"{test_id}.csv"
    dest_csv.parent.mkdir(parents=True, exist_ok=True)
    dest_csv.write_bytes(content)

    time_series = []
    for r in rows[:100]:
        time_series.append({k: v for k, v in r.items() if k})

    metrics = {
        "sample_count": len(rows),
        "columns": cols
    }

    # If straw beverage / outlet telemetry is present, run simulation comparison
    outlet_col = next((c for c in cols if 'outlet' in c.lower() or 'beverage' in c.lower()), None)
    if outlet_col and all(k in cols for k in ['ambient_C', 'inlet_C']):
        try:
            measured_temps = [float(r[outlet_col]) for r in rows if r.get(outlet_col)]
            amb = float(rows[0]['ambient_C'])
            inlet = float(rows[0]['inlet_C'])
            sim = ThermalStrawSimulator(thermal={
                "m_pcm_kg": 0.05,
                "m_wall_kg": 0.015,
                "c_wall_J_kgK": 500.0,
                "m_bev_kg": 0.02,
                "c_bev_J_kgK": 4184.0,
                "R_pcm_to_wall": 0.15,
                "R_wall_to_bev": 0.30,
                "R_env": 2.20,
                "T_ambient_C": amb,
                "T_inlet_C": inlet,
                "T_pcm_init_C": 54.0
            })
            timeline = FlowTimeline.generate_periodic(total_duration_s=len(rows), sip_interval_s=30, sip_duration_s=3)
            sim_res = sim.simulate(timeline, duration_s=len(rows))
            err_m = calculate_error_metrics(sim_res["beverage_temp_C"], measured_temps)
            metrics.update(err_m)
        except Exception:
            pass

    status = "verified" if metrics.get("rmse_C", 99.0) <= 2.5 else "unverified"

    conn = get_db_local()
    cur_count = conn.execute("SELECT COUNT(*) FROM twin_tests WHERE twin_id = ?", (twin_id,)).fetchone()[0]
    next_num = cur_count + 1

    conn.execute("""
        INSERT INTO twin_tests (id, twin_id, test_number, title, operator, status, notes, csv_path, metrics, initial_conditions, raw_preview)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        test_id,
        twin_id,
        next_num,
        title,
        operator,
        status,
        notes,
        str(dest_csv.relative_to(STORAGE_DIR)),
        json.dumps(metrics),
        json.dumps({}),
        json.dumps(time_series[:50])
    ))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "test": {
            "id": test_id,
            "test_number": next_num,
            "title": title,
            "operator": operator,
            "status": status,
            "metrics": metrics,
            "csv_path": str(dest_csv.name)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
