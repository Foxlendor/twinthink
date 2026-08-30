import sys
import zipfile
import json
import os
import hashlib
from pathlib import Path
from typing import Any


def validate_twin_document(document: dict[str, Any]) -> str | bool:
    """Conservative validation for canonical and draft Twin documents."""
    required = {
        "identity", "object", "structure", "behavior", "evidence",
        "history", "lineage", "claims", "reality_state", "unknowns_and_assumptions"
    }
    missing = sorted(required - set(document.keys()))
    if missing:
        # The directory-ingestion draft predates the Pydantic representation and
        # uses `unknowns` plus a derived_dimensions reality map. Keep it valid.
        legacy_required = {"identity", "object", "structure", "behavior", "evidence", "history", "lineage", "claims", "reality_state", "unknowns"}
        if not legacy_required.issubset(document.keys()):
            return f"TWIN INVALID (Missing sections: {', '.join(missing)})"

    identity = document.get("identity") or {}
    for key in ("title", "summary", "version"):
        if not identity.get(key):
            return f"TWIN INVALID (identity.{key} is required)"

    allowed_status = {"VERIFIED", "EXPERIMENTAL", "ESTIMATED", "ASSUMED", "UNKNOWN", "LITERATURE", "MEASURED", "CALIBRATED"}
    for claim in document.get("claims", []):
        status = claim.get("status", claim.get("epistemic_status"))
        if status is not None and status not in allowed_status:
            return f"TWIN INVALID (Unknown claim status: {status})"
        confidence = claim.get("confidence_pct", claim.get("confidence"))
        if confidence is not None and not 0 <= confidence <= 100:
            return f"TWIN INVALID (Claim confidence out of range: {claim.get('key', claim.get('id', 'unknown'))})"

    reality = document.get("reality_state") or {}
    if "derived_dimensions" in reality:
        dimensions = reality["derived_dimensions"]
        if not isinstance(dimensions, dict):
            return "TWIN INVALID (reality_state.derived_dimensions must be an object)"
        for name, state in dimensions.items():
            confidence = state.get("confidence") if isinstance(state, dict) else None
            if confidence is not None and not 0 <= confidence <= 1:
                return f"TWIN INVALID (Reality confidence out of range: {name})"
    else:
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
            names = [name.replace('\\', '/') for name in zf.namelist()]
            for name in names:
                if '..' in Path(name).parts or name.startswith('/'):
                    return f"PATH_TRAVERSAL_DETECTED: {name}"

            manifest_name = 'twin.json' if 'twin.json' in names else 'manifest.json'
            if manifest_name not in names:
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
                for key in ('version', 'title', 'summary', 'license', 'assets'):
                    if key not in manifest:
                        return f"MANIFEST INVALID (Missing {key})"
                for asset in manifest.get('assets', []):
                    path = asset.get('relative_path')
                    if path and path not in names:
                        return f"ASSET MISSING: {path}"

            hashlib.sha256(zf.read(manifest_name)).hexdigest()
            return True
    except zipfile.BadZipFile:
        return "INVALID ZIP FORMAT"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m twinthink.validator <path_to_zip>")
        sys.exit(1)
    sys.exit(0 if validate_bundle(sys.argv[1]) is True else 1)
