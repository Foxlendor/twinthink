import urllib.request
import uuid
import json

boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
csv_data = """timestamp_s,ambient_C,pcm_C,inlet_C,outlet_C,flow_ml_s
0,21.5,21.5,5.0,5.2,0
10,21.5,54.0,5.0,12.0,0
20,21.5,54.0,5.0,16.5,8
30,21.5,54.0,5.0,18.9,8
40,21.5,53.8,5.0,18.1,0
60,21.5,53.2,5.0,16.4,8
90,21.5,52.5,5.0,14.8,8
120,21.5,50.1,5.0,12.5,8
180,21.5,45.0,5.0,10.2,8
240,21.5,38.0,5.0,7.8,8
300,21.5,30.0,5.0,6.1,0
"""

body = (
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"title\"\r\n\r\n"
    f"Flow Bench Calibration Run #003\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"operator\"\r\n\r\n"
    f"@Foxlendor\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"notes\"\r\n\r\n"
    f"High precision K-type sensor log during steady sipping test.\r\n"
    f"--{boundary}\r\n"
    f"Content-Disposition: form-data; name=\"file\"; filename=\"telemetry.csv\"\r\n"
    f"Content-Type: text/csv\r\n\r\n"
    f"{csv_data}\r\n"
    f"--{boundary}--\r\n"
).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8001/api/twins/0001/tests',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    res = urllib.request.urlopen(req)
    print("Upload Status:", res.status)
    data = json.loads(res.read().decode('utf-8'))
    print("Upload Response:", json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
