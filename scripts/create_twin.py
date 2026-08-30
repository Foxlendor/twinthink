#!/usr/bin/env python3
"""Create a first-draft twin.json from a directory of source material."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages"))

from twinthink.ingestion import ingest_directory  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a TwinThink draft Twin")
    parser.add_argument("source", type=Path, help="Directory containing invention source material")
    parser.add_argument("--title", help="Human-readable Twin title")
    parser.add_argument("--author", default="Unknown", help="Author name")
    parser.add_argument("--output", type=Path, default=Path("twin.json"), help="Output JSON path")
    args = parser.parse_args()

    try:
        twin = ingest_directory(args.source, title=args.title, author=args.author)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))

    args.output.write_text(json.dumps(twin, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Created draft Twin: {args.output}")
    print(f"Assets indexed: {twin['_ingestion']['asset_count']}")
    print(f"Reality state: {twin['reality_state']['composite_score']:.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
