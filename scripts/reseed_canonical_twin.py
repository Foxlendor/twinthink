import os
import sys
import json
import zipfile
import psycopg2
import boto3
from dotenv import load_dotenv

# Load env from apps/api/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '../apps/api/.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
AWS_ENDPOINT_URL_S3 = os.getenv("AWS_ENDPOINT_URL_S3")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
BUCKET_NAME = os.getenv("BUCKET_NAME", "bundles")

ZIP_PATH = os.path.join(os.path.dirname(__file__), '../fixtures/valid/straw_v1.zip')

print("Connecting to Neon Postgres...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Reset table and restart identity sequence at 1
cur.execute("""
    TRUNCATE TABLE twins RESTART IDENTITY;
""")
conn.commit()

# Read manifest from zip
with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
    with zf.open('manifest.json') as mf:
        manifest_json = mf.read().decode('utf-8')

# Insert canonical Twin #0001
cur.execute("INSERT INTO twins (manifest_json) VALUES (%s) RETURNING id", (manifest_json,))
raw_id = cur.fetchone()[0]
conn.commit()
cur.close()
conn.close()

twin_id = f"{raw_id:04d}"
print(f"Inserted into Neon Postgres as Twin #{twin_id}")

# Upload assets to Neon S3
print(f"Uploading assets to S3 bucket '{BUCKET_NAME}'...")
s3 = boto3.client(
    's3',
    region_name=AWS_REGION,
    endpoint_url=AWS_ENDPOINT_URL_S3,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

# Upload bundle.zip
with open(ZIP_PATH, 'rb') as f:
    s3.upload_fileobj(f, BUCKET_NAME, f"{twin_id}/bundle.zip")
print(f" -> Uploaded {twin_id}/bundle.zip")

# Upload extracted assets
with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
    for name in zf.namelist():
        if not name.endswith('/'):
            with zf.open(name) as member:
                s3.upload_fileobj(member, BUCKET_NAME, f"{twin_id}/assets/{name}")
                print(f" -> Uploaded asset: {twin_id}/assets/{name}")

print("\nSeeding Complete! Twin #0001 is canonical and ready.")
