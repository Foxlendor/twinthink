import io
import json
import os
import shutil
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Dict, List
import boto3
import csv
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../../packages'))
from twinthink.factory import TwinFactoryEngine
from twinthink.simulation.calibration import calculate_error_metrics
from twinthink.simulation.flow import FlowTimeline, SipEvent
from twinthink.simulation.thermal import ThermalStrawSimulator
from twinthink.validator import validate_bundle

app = FastAPI(title="TwinThink API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
DATABASE_URL = os.getenv("DATABASE_URL")
AWS_ENDPOINT_URL_S3 = os.getenv("AWS_ENDPOINT_URL_S3")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("BUCKET_NAME", "bundles")
USE_CLOUD = all([DATABASE_URL, AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY])
MAX_UPLOAD_BYTES = 75 * 1024 * 1024
STORAGE_DIR = Path("../../storage")
BUNDLES_DIR = STORAGE_DIR / "bundles"
EXTRACTED_DIR = STORAGE_DIR / "extracted"
DB_PATH = STORAGE_DIR / "twinthink.db"
if not USE_CLOUD:
    for directory in (STORAGE_DIR, BUNDLES_DIR, EXTRACTED_DIR):
        directory.mkdir(parents=True, exist_ok=True)
s3_client = None
if USE_CLOUD:
    s3_client = boto3.client("s3", region_name=AWS_REGION, endpoint_url=AWS_ENDPOINT_URL_S3, aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY)
    import psycopg2
    from psycopg2.extras import RealDictCursor
    def get_db_cloud(): return psycopg2.connect(DATABASE_URL)
else:
    import sqlite3
    def get_db_local():
        conn = sqlite3.connect(DB_PATH); conn.row_factory = sqlite3.Row; return conn

def _safe_zip_members(zf: zipfile.ZipFile) -> list[str]:
    names = []
    for raw in zf.namelist():
        name = raw.replace("\\", "/")
        if name.startswith("/") or ".." in Path(name).parts:
            raise HTTPException(status_code=400, detail=f"Unsafe archive path: {name}")
        if name and not name.endswith("/"): names.append(name)
    return names

@app.get("/health")
async def health(): return {"status": "ok", "service": "twinthink-api", "version": "0.2.0"}

@app.post("/api/twins/upload")
async def upload_twin(file: UploadFile = File(...)):
    temp_dir = Path(tempfile.mkdtemp()); temp_zip_path = temp_dir / f"upload_{uuid.uuid4().hex}.zip"
    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES: raise HTTPException(status_code=413, detail="Twin bundle exceeds the 75 MB upload limit.")
        temp_zip_path.write_bytes(content)
        validation = validate_bundle(str(temp_zip_path))
        if validation is not True: raise HTTPException(status_code=400, detail=f"Invalid Twin bundle: {validation}")
        with zipfile.ZipFile(temp_zip_path, "r") as zf:
            members = _safe_zip_members(zf)
            manifest_name = "twin.json" if "twin.json" in members else "manifest.json"
            manifest = json.loads(zf.read(manifest_name))
            if USE_CLOUD:
                conn = get_db_cloud()
                try:
                    with conn.cursor() as cur:
                        cur.execute("INSERT INTO twins (manifest_json) VALUES (%s) RETURNING id", (json.dumps(manifest),)); database_id = cur.fetchone()[0]
                    conn.commit()
                finally: conn.close()
                twin_id = f"{database_id:04d}"
                s3_client.upload_file(str(temp_zip_path), BUCKET_NAME, f"{twin_id}/bundle.zip")
                for name in members: s3_client.put_object(Bucket=BUCKET_NAME, Key=f"{twin_id}/assets/{name}", Body=zf.read(name))
            else:
                conn = get_db_local()
                try:
                    count = conn.execute("SELECT count(*) FROM twins").fetchone()[0]; twin_id = f"{count + 1:04d}"
                    conn.execute("INSERT INTO twins (id, manifest_json) VALUES (?, ?)", (twin_id, json.dumps(manifest))); conn.commit()
                finally: conn.close()
                final_zip = BUNDLES_DIR / f"{twin_id}.zip"; shutil.copy2(temp_zip_path, final_zip)
                extract_path = EXTRACTED_DIR / twin_id; extract_path.mkdir(parents=True, exist_ok=True)
                with zipfile.ZipFile(final_zip, "r") as ext_zf: _safe_zip_members(ext_zf); ext_zf.extractall(extract_path)
        return {"status": "success", "id": twin_id}
    finally: shutil.rmtree(temp_dir, ignore_errors=True)

@app.get("/api/twins/{twin_id}")
async def get_twin(twin_id: str):
    if USE_CLOUD:
        conn = get_db_cloud()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT manifest_json FROM twins WHERE id = %s", (int(twin_id),)); row = cur.fetchone()
        finally: conn.close()
        if not row: raise HTTPException(status_code=404, detail="Twin not found")
        manifest = row[0]
    else:
        conn = get_db_local()
        try: row = conn.execute("SELECT manifest_json FROM twins WHERE id = ?", (twin_id,)).fetchone()
        finally: conn.close()
        if not row: raise HTTPException(status_code=404, detail="Twin not found")
        manifest = json.loads(row["manifest_json"])
    return {"id": twin_id, "slug": manifest.get("slug", f"{twin_id}-twin"), "creator": manifest.get("creator", manifest.get("identity", {}).get("creator", "Unknown")), "created_at": manifest.get("created_at", manifest.get("identity", {}).get("created_at", "")), "current_version": manifest, "lineage": {"parent": manifest.get("parent_twin", manifest.get("lineage", {}).get("parent", None)), "descendants": [], "root_twin_id": twin_id}, "versions": [{"semver": manifest.get("version", manifest.get("identity", {}).get("version", "0.1.0")), "title": manifest.get("title", manifest.get("identity", {}).get("title", "Twin")), "published_at": manifest.get("created_at", "")}]} 

@app.get("/api/twins/{twin_id}/assets/{path:path}")
async def get_asset(twin_id: str, path: str):
    normalized = path.replace("\\", "/")
    if normalized.startswith("/") or ".." in Path(normalized).parts: raise HTTPException(status_code=400, detail="Invalid asset path")
    if USE_CLOUD:
        url = s3_client.generate_presigned_url("get_object", Params={"Bucket": BUCKET_NAME, "Key": f"{twin_id}/assets/{normalized}"}, ExpiresIn=3600); return RedirectResponse(url)
    root = (EXTRACTED_DIR / twin_id).resolve(); asset_path = (root / normalized).resolve()
    if root not in asset_path.parents or not asset_path.is_file(): raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(asset_path)

@app.get("/api/twins/{twin_id}/download")
async def download_bundle(twin_id: str):
    if USE_CLOUD:
        url = s3_client.generate_presigned_url("get_object", Params={"Bucket": BUCKET_NAME, "Key": f"{twin_id}/bundle.zip", "ResponseContentDisposition": f'attachment; filename="twin_{twin_id}.zip"'}, ExpiresIn=3600); return RedirectResponse(url)
    path = BUNDLES_DIR / f"{twin_id}.zip"
    if not path.is_file(): raise HTTPException(status_code=404, detail="Bundle not found")
    return FileResponse(path, filename=f"twin_{twin_id}.zip", media_type="application/zip")

@app.get("/api/twins/{twin_id}/tests")
async def get_twin_tests(twin_id: str):
    if not USE_CLOUD:
        return {"twin_id": twin_id, "summary": {"physical_tests_count": 0, "mean_absolute_error_C": 0, "root_mean_square_error_C": 0, "model_status": "CALIBRATION_REQUIRED", "last_test": "None"}, "tests": []}
    conn = get_db_cloud()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, test_number, title, operator, status, notes, s3_csv_key, metrics, initial_conditions, raw_preview, created_at FROM twin_tests WHERE twin_id = %s ORDER BY test_number DESC", (int(twin_id),)); rows = cur.fetchall()
    finally: conn.close()
    tests=[]
    for r in rows:
        parse=lambda v: v if isinstance(v,(dict,list)) else json.loads(v)
        tests.append({"id":r["id"],"test_number":r["test_number"],"title":r["title"],"operator":r["operator"],"status":r["status"],"notes":r["notes"],"s3_csv_key":r["s3_csv_key"],"metrics":parse(r["metrics"]),"initial_conditions":parse(r["initial_conditions"]),"raw_preview":parse(r["raw_preview"]),"created_at":str(r["created_at"])})
    avg_rmse=round(sum(t["metrics"].get("rmse_C",0) for t in tests)/len(tests),2) if tests else 0; avg_mae=round(sum(t["metrics"].get("mae_C",0) for t in tests)/len(tests),2) if tests else 0
    return {"twin_id":twin_id,"summary":{"physical_tests_count":len(tests),"mean_absolute_error_C":avg_mae,"root_mean_square_error_C":avg_rmse,"model_status":"EXPERIMENTALLY_CALIBRATED" if tests and avg_rmse<=2.5 else "CALIBRATION_REQUIRED","last_test":f"Test #{tests[0]['test_number']:03d}" if tests else "None"},"tests":tests}

@app.post("/api/twins/{twin_id}/tests")
async def upload_twin_test(twin_id: str, file: UploadFile = File(...), title: str = Form("Physical Flow Bench Test Run"), operator: str = Form("@Foxlendor"), notes: str = Form("")):
    content=await file.read()
    if len(content)>MAX_UPLOAD_BYTES: raise HTTPException(status_code=413,detail="Telemetry file is too large.")
    reader=csv.DictReader(io.StringIO(content.decode("utf-8",errors="replace"))); rows=list(reader)
    required={"ambient_C","pcm_C","inlet_C","outlet_C","flow_ml_s"}; missing=sorted(required-set(reader.fieldnames or []))
    if not rows: raise HTTPException(status_code=400,detail="CSV file is empty")
    if missing: raise HTTPException(status_code=400,detail=f"Missing required CSV column(s): {', '.join(missing)}")
    time_col="timestamp_s" if "timestamp_s" in reader.fieldnames else "time" if "time" in reader.fieldnames else "timestamp_ms"
    series=[]; sip_events=[]; measured=[]; active_start=None; active_flow=0.0
    try:
        for row in rows:
            raw=float(row[time_col]); t=raw/1000 if time_col=="timestamp_ms" else raw; flow=float(row["flow_ml_s"])
            point={"time_s":round(t,2),"ambient_C":float(row["ambient_C"]),"pcm_C":float(row["pcm_C"]),"inlet_C":float(row["inlet_C"]),"outlet_C":float(row["outlet_C"]),"flow_ml_s":flow}; series.append(point); measured.append(point["outlet_C"])
            if flow>0.5 and active_start is None: active_start,active_flow=t,flow
            elif flow<=0.5 and active_start is not None: sip_events.append(SipEvent(start_time_s=active_start,duration_s=max(1,t-active_start),flow_rate_ml_s=active_flow)); active_start=None
        if active_start is not None: sip_events.append(SipEvent(start_time_s=active_start,duration_s=3,flow_rate_ml_s=active_flow))
    except (ValueError,TypeError) as exc: raise HTTPException(status_code=400,detail=f"Invalid telemetry value: {exc}")
    duration=max(1,int(series[-1]["time_s"]))
    sim=ThermalStrawSimulator(thermal={"m_pcm_kg":0.05,"m_wall_kg":0.015,"c_wall_J_kgK":500.0,"m_bev_kg":0.02,"c_bev_J_kgK":4184.0,"R_pcm_to_wall":0.15,"R_wall_to_bev":0.30,"R_env":2.20,"T_ambient_C":series[0]["ambient_C"],"T_inlet_C":series[0]["inlet_C"],"T_pcm_init_C":series[0]["pcm_C"]})
    timeline=FlowTimeline(sip_events) if sip_events else FlowTimeline.generate_periodic(total_duration_s=duration,sip_interval_s=30,sip_duration_s=3); result=sim.simulate(timeline,duration_s=duration)
    metrics=calculate_error_metrics(result["beverage_temp_C"],measured); metrics.update({"predicted_peak_C":result["summary"]["peak_beverage_temp_C"],"measured_peak_C":round(max(measured),2)}); metrics["peak_delta_C"]=round(metrics["predicted_peak_C"]-metrics["measured_peak_C"],2)
    status="verified" if metrics["rmse_C"]<=2.5 else "unverified"; test_id=f"test_{twin_id}_{uuid.uuid4().hex[:6]}"
    if USE_CLOUD:
        conn=get_db_cloud()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COALESCE(MAX(test_number),0)+1 FROM twin_tests WHERE twin_id=%s",(int(twin_id),)); number=cur.fetchone()[0]; key=f"{twin_id}/tests/test_{number:03d}_{uuid.uuid4().hex[:6]}.csv"; s3_client.put_object(Bucket=BUCKET_NAME,Key=key,Body=content,ContentType="text/csv")
                cur.execute("INSERT INTO twin_tests (id,twin_id,test_number,title,operator,status,notes,s3_csv_key,metrics,initial_conditions,raw_preview) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(test_id,int(twin_id),number,title,operator,status,notes,key,json.dumps(metrics),json.dumps({"ambient_C":series[0]["ambient_C"],"inlet_C":series[0]["inlet_C"],"initial_pcm_C":series[0]["pcm_C"]}),json.dumps(series[:50]))); conn.commit()
        finally: conn.close()
    else: number,key=1,f"local/tests/{test_id}.csv"
    return {"status":"success","test":{"id":test_id,"test_number":number,"title":title,"operator":operator,"status":status,"metrics":metrics,"s3_csv_key":key}}

@app.post("/api/twins/create")
async def create_twin_from_factory(files: List[UploadFile] = File(...), title: str = Form(""), author: str = Form("Unknown")):
    if not files: raise HTTPException(status_code=400,detail="Add at least one file.")
    file_map: Dict[str,bytes]={}; total=0
    for upload in files:
        data=await upload.read(); total+=len(data)
        if total>MAX_UPLOAD_BYTES: raise HTTPException(status_code=413,detail="The combined upload exceeds the 75 MB limit.")
        fname=(upload.filename or "file").replace("\\","/").lstrip("/")
        if ".." in Path(fname).parts: raise HTTPException(status_code=400,detail=f"Unsafe filename: {fname}")
        if fname.lower().endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(data),"r") as zf:
                    for member in _safe_zip_members(zf): file_map[member]=zf.read(member)
            except zipfile.BadZipFile: raise HTTPException(status_code=400,detail=f"{fname} is not a valid ZIP archive.")
        else: file_map[fname]=data
    try:
        twin_doc=TwinFactoryEngine.process_bundle(file_map,twin_id="draft",title=title.strip() or None,author=author.strip() or "Unknown")
    except ValueError as exc: raise HTTPException(status_code=422,detail=str(exc))
    except Exception as exc: raise HTTPException(status_code=500,detail=f"Twin Factory failed: {exc}")
    relationships=sum(len(c.relationships) for c in twin_doc.claims)
    return {"status":"success","discovery":{"title":twin_doc.identity.title,"summary":twin_doc.identity.summary,"objects_count":1,"components_count":len(twin_doc.structure.components),"claims_count":len(twin_doc.claims),"relationships_count":relationships,"files_ingested_count":len(file_map),"reality_state":twin_doc.reality_state.model_dump()},"twin":twin_doc.model_dump()}
