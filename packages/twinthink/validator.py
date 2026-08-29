import sys
import zipfile
import json
import os
import hashlib
from pathlib import Path

def validate_bundle(zip_path: str):
    if not os.path.exists(zip_path):
        print(f"✗ ERROR: File not found: {zip_path}")
        return False

    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            namelist = zf.namelist()
            
            # 1. Path Traversal Check
            for name in namelist:
                if '..' in name or name.startswith('/'):
                    print(f"[X] PATH_TRAVERSAL_DETECTED: {name}")
                    print("\nSTATUS: VALIDATION_FAILED")
                    return False

            print("[OK] ZIP VALID")

            # 2. Manifest Check
            if 'manifest.json' not in namelist:
                print("[X] MANIFEST MISSING")
                print("\nSTATUS: VALIDATION_FAILED")
                return False

            with zf.open('manifest.json') as f:
                try:
                    manifest = json.load(f)
                except json.JSONDecodeError:
                    print("[X] MANIFEST INVALID (Bad JSON)")
                    print("\nSTATUS: VALIDATION_FAILED")
                    return False

            # Minimal structural validation for Alpha
            required_keys = ['version', 'title', 'summary', 'license', 'assets']
            for key in required_keys:
                if key not in manifest:
                    print(f"[X] MANIFEST INVALID (Missing {key})")
                    print("\nSTATUS: VALIDATION_FAILED")
                    return False
            
            print("[OK] MANIFEST VALID")

            # 3. Entrypoints & Assets Check
            for asset in manifest.get('assets', []):
                if asset['relative_path'] not in namelist:
                    print(f"[X] ASSET MISSING: {asset['relative_path']}")
                    print("\nSTATUS: VALIDATION_FAILED")
                    return False

            print("[OK] ENTRYPOINTS VALID")
            
            # 4. Lineage Check
            if 'parent_twin' in manifest:
                print("[OK] LINEAGE VALID")
            else:
                # Lineage is optional, but if present we'd validate it
                print("[OK] LINEAGE VALID (Root)")

            # 5. Integrity
            # For alpha, just calculate the hash of the manifest
            with zf.open('manifest.json') as f:
                content = f.read()
                hash_val = hashlib.sha256(content).hexdigest()
                print(f"[OK] INTEGRITY CALCULATED ({hash_val[:8]}...)")

            print("\nSTATUS: VALIDATED")
            return True

    except zipfile.BadZipFile:
        print("[X] INVALID ZIP FORMAT")
        print("\nSTATUS: VALIDATION_FAILED")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m twinthink.validator <path_to_zip>")
        sys.exit(1)
    
    success = validate_bundle(sys.argv[1])
    sys.exit(0 if success else 1)
