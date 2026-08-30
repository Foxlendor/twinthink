import sys
import zipfile
import json
import os
import hashlib
from pathlib import Path
from typing import Any


def validate_twin_document(document: dict[str, Any]) -> str | bool:
    """Conservative validation for the canonical in-memory Twin document."""
    required = {
        "identity", "object", "structure", "behavior", "evidence",
        "history", "lineage", "claims", "reality_state", "unknowns_and_assumptions"
    }
    missing = sorted(required - set(document.keys()))
    if missing:
        return f"TWIN INVALID (Missing sections: {', '.join(missing)})"

    identity = document.get("identity") or {}
    for key in ("title", "summary", "version"):
        if not identity.get(key):
            return f"TWIN INVALID (identity.{key} is required)"

    allowed_status = {"VERIFIED", "EXPERIMENTAL", "ESTIMATED", "ASSUMED", "UNKNOWN", "LITERATURE", "MEASURED", "CALIBRATED"}
    for claim in document.get("claims", []):
        status = claim.get("status")
        if status not in allowed_status:
            return f"TWIN INVALID (Unknown claim status: {status})"
        confidence = claim.get("confidence_pct", 0)
        if not isinstance(confidence, int) or not 0 <= confidence <= 100:
            return f"TWIN INVALID (Claim confidence must be 0-100: {claim.get('key', 'unknown')})"

    reality = document.get("reality_state") or {}
    for dimension in ("structural", "thermal", "material", "safety", "manufacturing"):
        state = reality.get(dimension)
        if state is None:
            return f"TWIN INVALID (Missing reality_state.{dimension})"
        score = getattr(state, "score_pct", None) if not isinstance(state, dict) else state.get("score_pct")
        if score is not None and not 0 <= score <= 100:
            return f"TWIN INVALID (Reality score out of range: {dimension})"

    return True


def validate_bundle(zip_path: str):
    if not os.path.exists(zip_path):
        return f"File not found: {zip_path}"

    try:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            namelist = zf.namelist()
            normalized_namelist = [name.replace('\\', '/') for name in namelist]

            for name in normalized_namelist:
                if '..' in Path(name).parts or name.startswith('/'):
                    return f"PATH_TRAVERSAL_DETECTED: {name}"

            manifest_name = 'twin.json' if 'twin.json' in normalized_namelist else 'manifest.json'
            if manifest_name not in normalized_namelist:
                return "TWIN MANIFEST MISSING (expected twin.json or manifest.json)"

            with zf.open(manifest_name) as f:
                try:
                    manifest = json.load(f)
                except json.JSONDecodeError:
                    return f"{manifest_name.upper()} INVALID (Bad JSON)"

            if manifest_name == 'twin.json':
                validation = validate_twin_document(manifest)
                if validation is not True:
                    return validation
            else:
                required_keys = ['version', 'title', 'summary', 'license', 'assets']
                for key in required_keys:
                    if key not in manifest:
                        return f"MANIFEST INVALID (Missing {key})"
                for asset in manifest.get('assets', []):
                    relative_path = asset.get('relative_path')
                    if relative_path and relative_path not in normalized_namelist:
                        return f"ASSET MISSING: {relative_path}"

            with zf.open(manifest_name) as f:
                hashlib.sha256(f.read()).hexdigest()
            return True

    except zipfile.BadZipFile:
        return "INVALID ZIP FORMAT"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m twinthink.validator <path_to_zip>")
        sys.exit(1)
    success = validate_bundle(sys.argv[1])
    sys.exit(0 if success else 1)
