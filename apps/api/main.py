import os
import shutil
import json
import uuid
import boto3
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys
import tempfile
from dotenv import load_dotenv

load_dotenv()

# Add packages to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../packages'))
from twinthink.validator import validate_bundle

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

# Local Fallback
STORAGE_DIR = Path("../../storage")
BUNDLES_DIR = STORAGE_DIR / "bundles"
EXTRACTED_DIR = STORAGE_DIR / "extracted"
DB_PATH = STORAGE_DIR / "twinthink.db"

if not USE_CLOUD:
    print("WARNING: Missing Cloud Credentials. Falling back to Local SQLite/Disk.")
    for d in [STORAGE_DIR, BUNDLES_DIR, EXTRACTED_DIR]:
        d.mkdir(parents=True, exist_ok=True)

# S3 Client setup
s3_client = None
if USE_CLOUD:
    print("CLOUD MODE: Using Postgres and S3/R2")
    s3_client = boto3.client(
        's3',
        region_name=AWS_REGION,
        endpoint_url=AWS_ENDPOINT_URL_S3,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    import psycopg2
    
    def get_db_cloud():
        conn = psycopg2.connect(DATABASE_URL)
        # Create table if not exists
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS twins (
                    id SERIAL PRIMARY KEY,
                    manifest_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()
        return conn
else:
    import sqlite3
    def get_db_local():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("""
            CREATE TABLE IF NOT EXISTS twins (
                id TEXT PRIMARY KEY,
                manifest_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        return conn

def generate_id_local(conn):
    cursor = conn.execute("SELECT count(*) FROM twins")
    count = cursor.fetchone()[0]
    return f"{(count + 1):04d}"

def insert_twin_cloud(conn, manifest_json):
    with conn.cursor() as cur:
        cur.execute("INSERT INTO twins (manifest_json) VALUES (%s) RETURNING id", (manifest_json,))
        twin_id = cur.fetchone()[0]
    conn.commit()
    return f"{twin_id:04d}"

@app.post("/api/twins/upload")
async def upload_twin(file: UploadFile = File(...)):
    temp_dir = tempfile.mkdtemp()
    temp_zip_path = Path(temp_dir) / f"temp_{uuid.uuid4().hex}.zip"
    
    with open(temp_zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Validate
        validation_error = validate_bundle(str(temp_zip_path))
        if validation_error is not True:
            raise HTTPException(status_code=400, detail=f"Invalid Twin Bundle: {validation_error}")
            
        import zipfile
        with zipfile.ZipFile(temp_zip_path, 'r') as zf:
            with zf.open('manifest.json') as f:
                manifest = json.load(f)
                
            if USE_CLOUD:
                conn = get_db_cloud()
                twin_id = insert_twin_cloud(conn, json.dumps(manifest))
                conn.close()
                
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
                conn = get_db_local()
                twin_id = generate_id_local(conn)
                conn.execute("INSERT INTO twins (id, manifest_json) VALUES (?, ?)", (twin_id, json.dumps(manifest)))
                conn.commit()
                conn.close()
                
                final_zip_path = BUNDLES_DIR / f"{twin_id}.zip"
                shutil.move(str(temp_zip_path), str(final_zip_path))
                extract_path = EXTRACTED_DIR / twin_id
                extract_path.mkdir(exist_ok=True)
                with zipfile.ZipFile(final_zip_path, 'r') as ext_zf:
                    ext_zf.extractall(extract_path)
                    
        return {"status": "success", "id": twin_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_zip_path.exists():
            os.remove(temp_zip_path)
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.get("/api/twins/{twin_id}")
async def get_twin(twin_id: str):
    if USE_CLOUD:
        conn = get_db_cloud()
        with conn.cursor() as cur:
            cur.execute("SELECT manifest_json FROM twins WHERE id = %s", (int(twin_id),))
            row = cur.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Twin not found")
        manifest_json = row[0]
    else:
        conn = get_db_local()
        cursor = conn.execute("SELECT manifest_json FROM twins WHERE id = ?", (twin_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Twin not found")
        manifest_json = row['manifest_json']
        
    manifest = json.loads(manifest_json)
    
    return {
        "id": twin_id,
        "slug": f"{twin_id}-twin",
        "creator": "Anon",
        "current_version": manifest,
        "lineage": {
            "parent": manifest.get("parent_twin", None)
        }
    }

@app.get("/api/twins/{twin_id}/assets/{path:path}")
async def get_asset(twin_id: str, path: str):
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
        if ".." in path or path.startswith("/"):
            raise HTTPException(status_code=400, detail="Invalid path")
        return FileResponse(asset_path)
    
@app.get("/api/twins/{twin_id}/download")
async def download_bundle(twin_id: str):
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
        return FileResponse(bundle_path, filename=f"twin_{twin_id}.zip", media_type="application/zip")
