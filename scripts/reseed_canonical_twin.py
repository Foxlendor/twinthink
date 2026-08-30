import os
import sys
import json
import zipfile
import psycopg2
import boto3
from dotenv import load_dotenv

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

with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
    with zf.open('manifest.json') as mf:
        manifest_json = mf.read().decode('utf-8')

# Update or insert Twin #1
cur.execute("SELECT id FROM twins WHERE id = 1")
row = cur.fetchone()
if row:
    cur.execute("UPDATE twins SET manifest_json = %s WHERE id = 1", (manifest_json,))
    print("Updated Twin #0001 manifest in Neon Postgres.")
else:
    cur.execute("INSERT INTO twins (id, manifest_json) VALUES (1, %s)", (manifest_json,))
    print("Inserted Twin #0001 into Neon Postgres.")

conn.commit()
cur.close()
conn.close()

twin_id = "0001"

# Upload assets to Neon S3
print(f"Uploading assets to S3 bucket '{BUCKET_NAME}'...")
s3 = boto3.client(
    's3',
    region_name=AWS_REGION,
    endpoint_url=AWS_ENDPOINT_URL_S3,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

with open(ZIP_PATH, 'rb') as f:
    s3.upload_fileobj(f, BUCKET_NAME, f"{twin_id}/bundle.zip")
print(f" -> Uploaded {twin_id}/bundle.zip")

with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
    for name in zf.namelist():
        if not name.endswith('/'):
            with zf.open(name) as member:
                s3.upload_fileobj(member, BUCKET_NAME, f"{twin_id}/assets/{name}")
                print(f" -> Uploaded asset: {twin_id}/assets/{name}")

print("\nSync Complete! Resip™ Twin #0001 is updated and canonical.")
