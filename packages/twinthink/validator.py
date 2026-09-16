import sys
import zipfile
import json
import os
import hashlib
from pathlib import Path

def validate_bundle(zip_path: str):
    if not os.path.exists(zip_path):
        return f"File not found: {zip_path}"

    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            namelist = zf.namelist()
            
            # Normalize slashes for cross-platform (Windows zip on Linux)
            normalized_namelist = [name.replace('\\', '/') for name in namelist]
            
            # 1. Path Traversal Check
            for name in normalized_namelist:
                if '..' in name or name.startswith('/'):
                    return f"PATH_TRAVERSAL_DETECTED: {name}"

            # 2. Manifest Check
            if 'manifest.json' not in normalized_namelist:
                return "MANIFEST MISSING"

            with zf.open('manifest.json') as f:
                try:
                    manifest = json.load(f)
                except json.JSONDecodeError:
                    return "MANIFEST INVALID (Bad JSON)"

            # Minimal structural validation for Alpha
            required_keys = ['version', 'title', 'summary', 'license', 'assets']
            for key in required_keys:
                if key not in manifest:
                    return f"MANIFEST INVALID (Missing {key})"
            
            # 3. Entrypoints & Assets Check
            for asset in manifest.get('assets', []):
                if asset['relative_path'] not in normalized_namelist:
                    return f"ASSET MISSING: {asset['relative_path']}"
            
            # 4. BOM acyclicity check if present
            for name in normalized_namelist:
                if name.lower().endswith("bom.json"):
                    try:
                        with zf.open(name) as bf:
                            bom_data = json.load(bf)
                            from twinthink.bom import validate_bom_acyclic
                            validate_bom_acyclic(bom_data)
                    except Exception as e:
                        return f"BOM INVALID: {str(e)}"
                elif name.lower().endswith("bom.csv"):
                    try:
                        with zf.open(name) as bf:
                            csv_text = bf.read().decode("utf-8", errors="ignore")
                            from twinthink.bom import parse_bom_csv
                            parse_bom_csv(csv_text)
                    except Exception as e:
                        return f"BOM INVALID: {str(e)}"

            # 5. Integrity
            with zf.open('manifest.json') as f:
                content = f.read()
                hash_val = hashlib.sha256(content).hexdigest()

            return True

    except zipfile.BadZipFile:
        return "INVALID ZIP FORMAT"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m twinthink.validator <path_to_zip>")
        sys.exit(1)
    
    result = validate_bundle(sys.argv[1])
    if result is True:
        print("Bundle is valid.")
        sys.exit(0)
    else:
        print(f"Validation failed: {result}")
        sys.exit(1)
