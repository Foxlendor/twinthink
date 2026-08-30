from __future__ import annotations

import csv
import hashlib
import json
import mimetypes
import re
from pathlib import Path
from typing import Any

from .reality import derive_reality_state
from .validator import validate_twin_document


SUPPORTED_CATEGORIES = {
    ".step": "cad", ".stp": "cad", ".stl": "cad", ".glb": "cad", ".gltf": "cad",
    ".csv": "data", ".json": "data", ".txt": "notes", ".md": "notes",
    ".pdf": "document", ".png": "image", ".jpg": "image", ".jpeg": "image",
    ".webp": "image", ".py": "simulation", ".ipynb": "simulation",
}


def _slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return value or "untitled-twin"


def _classify(path: Path) -> str:
    return SUPPORTED_CATEGORIES.get(path.suffix.lower(), "asset")


def _read_text(path: Path, limit: int = 100_000) -> str | None:
    try:
        return path.read_text(encoding="utf-8", errors="replace")[:limit]
    except (OSError, UnicodeDecodeError):
        return None


def _csv_summary(path: Path) -> dict[str, Any] | None:
    try:
        with path.open("r", encoding="utf-8", errors="replace", newline="") as handle:
            reader = csv.DictReader(handle)
            rows = list(reader)
            return {"columns": reader.fieldnames or [], "row_count": len(rows)}
    except (OSError, csv.Error):
        return None


def _asset_record(path: Path, root: Path) -> dict[str, Any]:
    relative = path.relative_to(root).as_posix()
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return {
        "path": relative,
        "category": _classify(path),
        "media_type": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
        "size_bytes": path.stat().st_size,
        "sha256": digest,
    }


def ingest_directory(source_dir: str | Path, *, title: str | None = None, author: str = "Unknown") -> dict[str, Any]:
    """Build a deterministic first-draft Twin from a directory of source material.

    This is intentionally evidence-preserving: it inventories files and simple
    machine-readable metadata but does not invent technical claims from images
    or documents. AI/OCR can be layered on later as a proposal stage.
    """
    root = Path(source_dir).resolve()
    if not root.is_dir():
        raise ValueError(f"Source directory not found: {source_dir}")

    files = sorted(p for p in root.rglob("*") if p.is_file())
    assets = [_asset_record(p, root) for p in files]
    stem = title or root.name
    slug = _slugify(stem)

    cad = [a["path"] for a in assets if a["category"] == "cad"]
    data = [a["path"] for a in assets if a["category"] == "data"]
    simulation = [a["path"] for a in assets if a["category"] == "simulation"]
    images = [a["path"] for a in assets if a["category"] == "image"]

    csv_summaries = {}
    for asset in assets:
        if asset["path"].lower().endswith(".csv"):
            summary = _csv_summary(root / asset["path"])
            if summary:
                csv_summaries[asset["path"]] = summary

    text_sources = []
    for asset in assets:
        path = root / asset["path"]
        if path.suffix.lower() in {".txt", ".md", ".json", ".py"}:
            text = _read_text(path)
            if text:
                text_sources.append({"path": asset["path"], "preview": text[:2000]})

    twin: dict[str, Any] = {
        "$schema": "https://twinth.ink/schemas/twin.v0.1.json",
        "identity": {
            "twin_id": "twin_draft",
            "slug": slug,
            "title": stem,
            "version": "0.1.0",
            "author": {"name": author},
            "license": "UNSPECIFIED",
            "status": "DRAFT",
        },
        "reality_state": {"composite_score": 0, "derived_dimensions": {}},
        "claims": [],
        "object": {
            "primary_3d": next((p for p in cad if p.lower().endswith(".glb")), None),
            "cad_source": next((p for p in cad if p.lower().endswith((".step", ".stp"))), None),
            "layers": [],
        },
        "structure": {"components": []},
        "behavior": {"solver": None, "governing_equations": [], "parameters": {}},
        "evidence": {"test_runs": []},
        "history": {"established_nodes": []},
        "lineage": {"parent": None, "forks_count": 0, "mutations": []},
        "unknowns": [{
            "id": "unk_ingestion_01",
            "category": "Ingestion",
            "issue": "No human-reviewed technical claims have been established by the ingestion pass.",
        }],
        "_ingestion": {
            "asset_count": len(assets),
            "assets": assets,
            "csv_summaries": csv_summaries,
            "text_sources": text_sources,
            "detected": {"cad": cad, "data": data, "simulation": simulation, "images": images},
        },
    }

    twin["reality_state"] = derive_reality_state(twin)
    # Internal ingestion metadata is deliberately removed before schema validation.
    document = {k: v for k, v in twin.items() if k != "_ingestion"}
    validation = validate_twin_document(document)
    if validation is not True:
        raise ValueError(validation)
    return twin
