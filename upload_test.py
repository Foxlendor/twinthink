import requests
import json
import sys
import os

API_URL = "https://twinthink.onrender.com"
FILE_PATH = "fixtures/valid/straw_v1.zip"

print(f"Testing TwinThink Production API at {API_URL}")
print("-" * 50)

# 1. Test Health (Skipping, no root endpoint)
print("1. Skipping Health Check (no endpoint)")

# 2. Upload Twin
print(f"\n2. Uploading {FILE_PATH}...")
if not os.path.exists(FILE_PATH):
    print(f"   Error: File {FILE_PATH} not found.")
    sys.exit(1)

try:
    with open(FILE_PATH, 'rb') as f:
        files = {'file': (os.path.basename(FILE_PATH), f, 'application/zip')}
        res = requests.post(f"{API_URL}/api/twins/upload", files=files)
        
    print(f"   Status: {res.status_code}")
    print(f"   Response: {json.dumps(res.json(), indent=2) if res.ok else res.text}")
    
    if res.ok:
        data = res.json()
        twin_id = data.get('id')
        print(f"\nSuccess! Twin ID created: {twin_id}")
        
        # 3. Test Retrieval
        print(f"\n3. Retrieving Twin {twin_id}...")
        get_res = requests.get(f"{API_URL}/api/twins/{twin_id}")
        print(f"   Status: {get_res.status_code}")
        if get_res.ok:
            print("   Retrieval successful.")
        else:
            print(f"   Error: {get_res.text}")
            
except Exception as e:
    print(f"   Error: {e}")
