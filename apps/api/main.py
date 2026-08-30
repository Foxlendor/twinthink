import os
import shutil
import json
import uuid
import csv
import io
import math
import boto3
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
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
from twinthink.simulation.thermal import ThermalStrawSimulator
from twinthink.simulation.flow import FlowTimeline, SipEvent
from twinthink.simulation.calibration import calculate_error_metrics, generate_validation_report

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
    from psycopg2.extras import RealDictCursor
    
    def get_db_cloud():
        conn = psycopg2.connect(DATABASE_URL)
        return conn
else:
    import sqlite3
    def get_db_local():
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

@app.post("/api/twins/upload")
async def upload_twin(file: UploadFile = File(...)):
    temp_dir = tempfile.mkdtemp()
    temp_zip_path = Path(temp_dir) / f"temp_{uuid.uuid4().hex}.zip"
    
    with open(temp_zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        validation_error = validate_bundle(str(temp_zip_path))
        if validation_error is not True:
            raise HTTPException(status_code=400, detail=f"Invalid Twin Bundle: {validation_error}")
            
        import zipfile
        with zipfile.ZipFile(temp_zip_path, 'r') as zf:
            with zf.open('manifest.json') as f:
                manifest = json.load(f)
                
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
                conn = get_db_local()
                cursor = conn.execute("SELECT count(*) FROM twins")
                count = cursor.fetchone()[0]
                twin_id = f"{(count + 1):04d}"
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

# ==========================================
# PHYSICAL TEST TELEMETRY & CALIBRATION API
# ==========================================

@app.get("/api/twins/{twin_id}/tests")
async def get_twin_tests(twin_id: str):
    twin_int = int(twin_id)
    if USE_CLOUD:
        conn = get_db_cloud()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, test_number, title, operator, status, notes, s3_csv_key, metrics, initial_conditions, raw_preview, created_at
                FROM twin_tests
                WHERE twin_id = %s
                ORDER BY test_number DESC
            """, (twin_int,))
            rows = cur.fetchall()
        conn.close()
    else:
        rows = []

    tests_list = []
    total_rmse = 0.0
    total_mae = 0.0
    
    for r in rows:
        m = r['metrics'] if isinstance(r['metrics'], dict) else json.loads(r['metrics'])
        init = r['initial_conditions'] if isinstance(r['initial_conditions'], dict) else json.loads(r['initial_conditions'])
        prev = r['raw_preview'] if isinstance(r['raw_preview'], list) else json.loads(r['raw_preview'])
        
        total_rmse += m.get('rmse_C', 0.0)
        total_mae += m.get('mae_C', 0.0)
        
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
    avg_rmse = round(total_rmse / count, 2) if count > 0 else 0.0
    avg_mae = round(total_mae / count, 2) if count > 0 else 0.0
    model_status = "EXPERIMENTALLY_CALIBRATED" if (count > 0 and avg_rmse <= 2.5) else "CALIBRATION_REQUIRED"

    return {
        "twin_id": twin_id,
        "summary": {
            "physical_tests_count": count,
            "mean_absolute_error_C": avg_mae,
            "root_mean_square_error_C": avg_rmse,
            "model_status": model_status,
            "last_test": f"Test #{tests_list[0]['test_number']:03d}" if count > 0 else "None"
        },
        "tests": tests_list
    }

@app.post("/api/twins/{twin_id}/tests")
async def upload_twin_test(
    twin_id: str,
    file: UploadFile = File(...),
    title: str = Form("Physical Flow Bench Test Run"),
    operator: str = Form("@Foxlendor"),
    notes: str = Form("")
):
    twin_int = int(twin_id)
    content = await file.read()
    text = content.decode('utf-8')
    
    # Parse CSV
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Validate columns
    required_cols = ['ambient_C', 'pcm_C', 'inlet_C', 'outlet_C', 'flow_ml_s']
    for col in required_cols:
        if col not in reader.fieldnames:
            raise HTTPException(status_code=400, detail=f"Missing required CSV column: {col}. Expected: timestamp_s,{','.join(required_cols)}")

    # Extract initial conditions and time series
    try:
        t_col = 'timestamp_s' if 'timestamp_s' in reader.fieldnames else ('time' if 'time' in reader.fieldnames else 'timestamp_ms')
        time_series = []
        measured_bev_temps = []
        sip_events = []
        
        current_sip_start = None
        current_sip_flow = 0.0

        for r in rows:
            raw_t = float(r[t_col])
            t_sec = raw_t / 1000.0 if t_col == 'timestamp_ms' else raw_t
            amb = float(r['ambient_C'])
            pcm_t = float(r['pcm_C'])
            inlet = float(r['inlet_C'])
            outlet = float(r['outlet_C'])
            flow = float(r['flow_ml_s'])

            time_series.append({
                "time_s": round(t_sec, 1),
                "ambient_C": amb,
                "pcm_C": pcm_t,
                "inlet_C": inlet,
                "outlet_C": outlet,
                "flow_ml_s": flow
            })
            measured_bev_temps.append(outlet)

            # Detect sip events
            if flow > 0.5:
                if current_sip_start is None:
                    current_sip_start = t_sec
                    current_sip_flow = flow
            else:
                if current_sip_start is not None:
                    duration = max(1.0, t_sec - current_sip_start)
                    sip_events.append(SipEvent(start_time_s=current_sip_start, duration_s=duration, flow_rate_ml_s=current_sip_flow))
                    current_sip_start = None

        if current_sip_start is not None:
            sip_events.append(SipEvent(start_time_s=current_sip_start, duration_s=3.0, flow_rate_ml_s=current_sip_flow))

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing telemetry numbers: {str(e)}")

    # Run dynamic simulation with matched initial conditions and sip timeline
    init_amb = time_series[0]['ambient_C']
    init_inlet = time_series[0]['inlet_C']
    total_duration = int(time_series[-1]['time_s'])

    sim = ThermalStrawSimulator(thermal={
        "m_pcm_kg": 0.05,
        "m_wall_kg": 0.015,
        "c_wall_J_kgK": 500.0,
        "m_bev_kg": 0.02,
        "c_bev_J_kgK": 4184.0,
        "R_pcm_to_wall": 0.15,
        "R_wall_to_bev": 0.30,
        "R_env": 2.20,
        "T_ambient_C": init_amb,
        "T_inlet_C": init_inlet,
        "T_pcm_init_C": 54.0
    })

    timeline = FlowTimeline(sip_events) if sip_events else FlowTimeline.generate_periodic(total_duration_s=total_duration, sip_interval_s=30, sip_duration_s=3)
    sim_res = sim.simulate(timeline, duration_s=total_duration)

    # Compute calibration metrics
    metrics = calculate_error_metrics(sim_res["beverage_temp_C"], measured_bev_temps)
    metrics["predicted_peak_C"] = sim_res["summary"]["peak_beverage_temp_C"]
    metrics["measured_peak_C"] = round(max(measured_bev_temps), 2)
    metrics["peak_delta_C"] = round(metrics["predicted_peak_C"] - metrics["measured_peak_C"], 2)

    status = "verified" if metrics["rmse_C"] <= 2.5 else "unverified"

    # Get next test number
    test_id = f"test_{twin_id}_{uuid.uuid4().hex[:6]}"
    
    if USE_CLOUD:
        conn = get_db_cloud()
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(MAX(test_number), 0) + 1 FROM twin_tests WHERE twin_id = %s", (twin_int,))
            next_num = cur.fetchone()[0]

            s3_key = f"{twin_id}/tests/test_{next_num:03d}_{uuid.uuid4().hex[:6]}.csv"
            s3_client.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=content, ContentType='text/csv')

            init_cond = {
                "ambient_C": init_amb,
                "inlet_C": init_inlet,
                "initial_pcm_C": time_series[0]['pcm_C']
            }

            cur.execute("""
                INSERT INTO twin_tests (id, twin_id, test_number, title, operator, status, notes, s3_csv_key, metrics, initial_conditions, raw_preview)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                test_id,
                twin_int,
                next_num,
                title,
                operator,
                status,
                notes,
                s3_key,
                json.dumps(metrics),
                json.dumps(init_cond),
                json.dumps(time_series[:50])
            ))
        conn.commit()
        conn.close()
    else:
        next_num = 1
        s3_key = f"local/tests/{test_id}.csv"

    return {
        "status": "success",
        "test": {
            "id": test_id,
            "test_number": next_num,
            "title": title,
            "operator": operator,
            "status": status,
            "metrics": metrics,
            "s3_csv_key": s3_key
        }
    }
