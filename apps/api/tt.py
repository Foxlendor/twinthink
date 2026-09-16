#!/usr/bin/env python3
"""
tt - Universal TwinThink CLI & Ingestion Bridge (Milestone M2)
Wraps arbitrary tool execution, captures engineering artifacts, detects BOMs,
computes hierarchical cost rollups, and writes into the canonical TwinThink record model.
"""

import os
import sys
import time
import json
import argparse
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Optional, Any

# Ensure packages is in path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent / "packages"))

try:
    import httpx
except ImportError:
    import urllib.request
    import urllib.error
    import urllib.parse
    httpx = None

from twinthink.bom import (
    parse_bom_csv,
    parse_bom_dict,
    flatten_bom_tree,
    CyclicBomError,
    OrphanBomNodeError,
    BomEngine
)
from twinthink.factory import TwinFactoryEngine
from twinthink.schema import TwinDocument

DEFAULT_API_URL = os.getenv("TWINTHINK_API_URL", "http://127.0.0.1:8001")

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def print_bom_tree(node: Any, depth: int = 0):
    """Renders a visually clear hierarchical BOM tree."""
    indent = "  " * depth
    marker = "+-- " if depth > 0 else "Twin: "
    cost_info = ""
    if hasattr(node, "cost") and node.cost:
        u_c = f"${node.cost.unit_cost:.2f}" if node.cost.unit_cost is not None else "unknown"
        e_c = f"${node.cost.extended_cost:.2f}" if node.cost.extended_cost is not None else "unknown"
        cost_info = f" | unit: {u_c}, ext: {e_c}"
    elif isinstance(node, dict) and "cost" in node and node["cost"]:
        u_c = f"${node['cost'].get('unit_cost', 0):.2f}" if node['cost'].get('unit_cost') is not None else "unknown"
        e_c = f"${node['cost'].get('extended_cost', 0):.2f}" if node['cost'].get('extended_cost') is not None else "unknown"
        cost_info = f" | unit: {u_c}, ext: {e_c}"

    name = getattr(node, "name", "") if hasattr(node, "name") else node.get("name", "Node")
    qty = getattr(node, "quantity", 1) if hasattr(node, "quantity") else node.get("quantity", 1)
    unit = getattr(node, "unit", "ea") if hasattr(node, "unit") else node.get("unit", "ea")
    pn = getattr(node, "part_number", "") if hasattr(node, "part_number") else node.get("part_number", "")
    ntype = getattr(node, "node_type", "") if hasattr(node, "node_type") else node.get("node_type", "")

    pn_str = f" [{pn}]" if pn else ""
    type_str = f" <{ntype}>" if ntype else ""

    print(f"{indent}{marker}{name}{pn_str}{type_str} (x{qty} {unit}){cost_info}")

    children = getattr(node, "children", []) if hasattr(node, "children") else node.get("children", [])
    for child in children:
        print_bom_tree(child, depth + 1)

IGNORE_DIRS = {".git", ".gemini", "node_modules", ".next", "dist", "build", "__pycache__", "storage", ".pytest_cache", "venv", ".venv"}

def _scan_files(base_dir: Path) -> Dict[str, float]:
    result = {}
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".")]
        for f in files:
            p = Path(root) / f
            try:
                result[str(p.resolve())] = p.stat().st_mtime
            except OSError:
                pass
    return result

def cmd_wrap(args):
    """
    Runs arbitrary command line, captures artifacts, parses BOM,
    and submits canonical TwinDocument to TwinThink.
    """
    watch_dir = Path(args.watch_dir or ".").resolve()
    print(f"[*] tt wrap running command: {' '.join(args.command)}")
    print(f"[*] Monitoring directory: {watch_dir}")

    # Record snapshot of existing files before execution
    before_files = _scan_files(watch_dir)

    start_time = time.time()
    proc = subprocess.run(args.command, shell=True, capture_output=True, text=True)
    duration = time.time() - start_time

    print(f"[*] Command completed in {duration:.2f}s (exit code: {proc.returncode})")
    if proc.returncode != 0 and not args.ignore_exit_code:
        print(f"[!] Error: Wrapped command failed with code {proc.returncode}")
        if proc.stderr:
            print(f"--- STDERR ---\n{proc.stderr}\n--------------")
        sys.exit(proc.returncode)

    # Detect new or modified files
    after_files = _scan_files(watch_dir)
    captured_files: Dict[str, Path] = {}
    for full_path, mtime in after_files.items():
        if full_path not in before_files or mtime > before_files[full_path]:
            p = Path(full_path)
            rel = str(p.relative_to(watch_dir)).replace("\\", "/")
            captured_files[rel] = p

    # Include explicit files passed via --file or --bom
    if args.bom:
        bom_p = Path(args.bom).resolve()
        if bom_p.exists():
            captured_files[bom_p.name] = bom_p
    if args.files:
        for f_arg in args.files:
            fp = Path(f_arg).resolve()
            if fp.exists():
                captured_files[fp.name] = fp

    if not captured_files:
        print("[!] Warning: No new artifacts detected. Creating minimal run record.")
        run_log = f"Command: {' '.join(args.command)}\nExit: {proc.returncode}\nDuration: {duration:.2f}s\n"
        temp_log = watch_dir / "run_execution.log"
        temp_log.write_text(run_log, encoding="utf-8")
        captured_files["run_execution.log"] = temp_log

    print(f"[*] Captured {len(captured_files)} artifacts:")
    for rel_name in captured_files:
        print(f"    - {rel_name}")

    # Send to TwinThink API
    api_url = args.api_url or DEFAULT_API_URL
    creator = args.creator or os.getenv("USER", "Engineer")

    # Prepare multipart files
    files_payload = []
    file_handles = []
    try:
        for rel_name, path in captured_files.items():
            fh = open(path, "rb")
            file_handles.append(fh)
            files_payload.append(("files", (rel_name, fh)))

        data_payload = {
            "creator": creator,
        }
        if args.owner_token:
            data_payload["owner_token"] = args.owner_token

        print(f"[*] Submitting canonical TwinDocument to {api_url}/api/twins/create...")
        
        if httpx is not None:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(f"{api_url}/api/twins/create", data=data_payload, files=files_payload)
                if resp.status_code == 400:
                    try:
                        err_det = resp.json().get("detail", resp.text)
                    except Exception:
                        err_det = resp.text
                    print(f"[!] Error from TwinThink API (HTTP 400): {err_det}")
                    sys.exit(1)
                resp.raise_for_status()
                res_data = resp.json()
        else:
            # Fallback offline engine if httpx not installed
            byte_map = {rel: p.read_bytes() for rel, p in captured_files.items()}
            doc = TwinFactoryEngine.process_bundle(byte_map, creator=creator)
            res_data = {"status": "success", "id": "offline", "twin": doc.model_dump()}

        twin_id = res_data.get("id")
        owner_tok = res_data.get("owner_token")
        twin_data = res_data.get("twin", {})
        structure = twin_data.get("structure", {})

        print("\n========================================================")
        print(f"  SUCCESSFULLY INGESTED TWIN: {twin_id}")
        print("========================================================")
        print(f"  Title:        {twin_data.get('identity', {}).get('title')}")
        print(f"  Creator:      {creator}")
        print(f"  Owner Token:  {owner_tok}")
        print(f"  Reality Score:{twin_data.get('reality_state', {}).get('overall_score_pct', 0)}%")
        
        bom_root = structure.get("bom_root")
        if bom_root:
            print("\n--- CANONICAL HIERARCHICAL BOM ---")
            print_bom_tree(bom_root)
            tot_cost = bom_root.get("cost", {}).get("extended_cost")
            if tot_cost is not None:
                print(f"\n  Total Rolled-Up Cost: ${tot_cost:.2f} {bom_root.get('cost', {}).get('currency', 'USD')}")
            else:
                print("\n  Total Rolled-Up Cost: Pending/Unknown (Honest Missing Data)")
        else:
            print(f"\n  Components count: {len(structure.get('components', []))}")
        print("========================================================\n")

    finally:
        for fh in file_handles:
            fh.close()

def cmd_inspect_bom(args):
    """Parses and validates a local BOM file (CSV or JSON)."""
    bom_path = Path(args.bom_file).resolve()
    if not bom_path.exists():
        print(f"[!] Error: File not found: {bom_path}")
        sys.exit(1)

    print(f"[*] Inspecting BOM: {bom_path.name}")
    try:
        if bom_path.name.lower().endswith(".json"):
            data = json.loads(bom_path.read_text(encoding="utf-8"))
            root = parse_bom_dict(data)
        else:
            csv_text = bom_path.read_text(encoding="utf-8")
            root = parse_bom_csv(csv_text)
    except CyclicBomError as e:
        print(f"\n[!] CYCLIC BOM REJECTED: {str(e)}")
        sys.exit(1)
    except OrphanBomNodeError as e:
        print(f"\n[!] ORPHAN BOM NODE REJECTED: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[!] Error parsing BOM: {str(e)}")
        sys.exit(1)

    print("\n--- CANONICAL HIERARCHICAL BOM (Validated Acyclic) ---")
    print_bom_tree(root)
    if root.cost and root.cost.extended_cost is not None:
        print(f"\nTotal Rolled-Up Assembly Cost: ${root.cost.extended_cost:.2f} {root.cost.currency}")
    else:
        print("\nTotal Rolled-Up Assembly Cost: Unknown (Missing supplier pricing preserved honestly)")
    print("------------------------------------------------------\n")

def cmd_fetch_bom(args):
    """Fetches hierarchical BOM from a live TwinThink instance."""
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id
    url = f"{api_url}/api/twins/{twin_id}/bom"

    if httpx is None:
        print("[!] Error: httpx required for API commands.")
        sys.exit(1)

    with httpx.Client() as client:
        resp = client.get(url)
        if resp.status_code == 404:
            print(f"[!] Twin {twin_id} not found.")
            sys.exit(1)
        resp.raise_for_status()
        data = resp.json()

    print(f"\n=== TWIN {twin_id} HIERARCHICAL BOM ===")
    root = data.get("bom_root")
    if root:
        print_bom_tree(root)
        print(f"\nTotal Rolled-Up Cost: {data.get('total_cost')} {data.get('currency', 'USD')}")
    else:
        print("No hierarchical BOM root found. Flat components count:", data.get("leaf_components_count"))
    print("=======================================\n")

def cmd_fetch_dpp(args):
    """Fetches EU Digital Product Passport (DPP) compliance data for a twin."""
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id
    url = f"{api_url}/api/twins/{twin_id}/bom/dpp"

    if httpx is None:
        print("[!] Error: httpx required for API commands.")
        sys.exit(1)

    with httpx.Client() as client:
        resp = client.get(url)
        if resp.status_code == 404:
            print(f"[!] Twin {twin_id} not found.")
            sys.exit(1)
        resp.raise_for_status()
        data = resp.json()

    print(f"\n=== EU DIGITAL PRODUCT PASSPORT (DPP) - TWIN {twin_id} ===")
    print(f"Product:      {data.get('product_name')}")
    print(f"Manufacturer: {data.get('manufacturer')}")
    print(f"DPP Schema:   {data.get('dpp_version')}")
    print(f"License:      {data.get('license')}")
    print("\nTraceable Components:")
    for c in data.get("components", []):
        mat_str = c.get('material') or 'Unspecified'
        if c.get('material_grade'):
            mat_str += f" ({c.get('material_grade')})"
        supp = f" | Supplier: {c.get('supplier')}" if c.get('supplier') else ""
        proc = f" | Process: {c.get('manufacturing_process')}" if c.get('manufacturing_process') else ""
        dpp = f" [DPP-ID: {c.get('dpp_id')}]" if c.get('dpp_id') else ""
        print(f"  - [{c.get('node_type')}] {c.get('name')} (PN: {c.get('part_number')}, x{c.get('quantity')} {c.get('unit')}){dpp}")
        print(f"      Material: {mat_str}{supp}{proc}")
    print("==========================================================\n")

def cmd_download(args):
    """Downloads a .twin bundle zip."""
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id
    out_file = Path(args.output or f"twin_{twin_id}.zip")

    if httpx is None:
        print("[!] Error: httpx required for API commands.")
        sys.exit(1)

    with httpx.Client() as client:
        resp = client.get(f"{api_url}/api/twins/{twin_id}/download")
        if resp.status_code == 404:
            print(f"[!] Twin {twin_id} bundle not found.")
            sys.exit(1)
        resp.raise_for_status()
        out_file.write_bytes(resp.content)

    print(f"[*] Bundle downloaded successfully to: {out_file.resolve()} ({len(resp.content)} bytes)")

def main():
    parser = argparse.ArgumentParser(
        prog="tt",
        description="TwinThink CLI - Universal Ingestion, Hierarchical BOM, and Digital Twin Engine"
    )
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help=f"TwinThink API URL (default: {DEFAULT_API_URL})")

    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # wrap
    p_wrap = subparsers.add_parser("wrap", help="Wrap an arbitrary command and ingest generated artifacts into a TwinDocument")
    p_wrap.add_argument("--watch-dir", default=".", help="Directory to monitor for generated artifacts")
    p_wrap.add_argument("--creator", default="Engineer", help="Twin creator/author name")
    p_wrap.add_argument("--title", default=None, help="Twin title")
    p_wrap.add_argument("--bom", default=None, help="Explicit path to BOM CSV or JSON file")
    p_wrap.add_argument("--files", nargs="*", help="Additional explicit files to attach")
    p_wrap.add_argument("--owner-token", default=None, help="Explicit creator owner token")
    p_wrap.add_argument("--ignore-exit-code", action="store_true", help="Ingest artifacts even if wrapped command fails")
    p_wrap.add_argument("command", nargs=argparse.REMAINDER, help="The command to execute (e.g. -- python compiler.py)")

    # inspect-bom
    p_inspect = subparsers.add_parser("inspect-bom", help="Inspect and validate a local BOM CSV or JSON file")
    p_inspect.add_argument("bom_file", help="Path to BOM file")

    # fetch-bom
    p_bom = subparsers.add_parser("fetch-bom", help="Fetch and display hierarchical BOM for a twin")
    p_bom.add_argument("twin_id", help="Twin ID")

    # fetch-dpp
    p_dpp = subparsers.add_parser("fetch-dpp", help="Fetch EU DPP compliance report for a twin")
    p_dpp.add_argument("twin_id", help="Twin ID")

    # download
    p_dl = subparsers.add_parser("download", help="Download a .twin bundle zip")
    p_dl.add_argument("twin_id", help="Twin ID")
    p_dl.add_argument("--output", "-o", default=None, help="Output destination path")

    args = parser.parse_args()

    # Clean up command argument if leading '--' was passed
    if hasattr(args, "command") and args.command and args.command[0] == "--":
        args.command = args.command[1:]

    if args.subcommand == "wrap":
        if not args.command:
            print("[!] Error: No command specified for `tt wrap`. Example: tt wrap -- python build.py")
            sys.exit(1)
        cmd_wrap(args)
    elif args.subcommand == "inspect-bom":
        cmd_inspect_bom(args)
    elif args.subcommand == "fetch-bom":
        cmd_fetch_bom(args)
    elif args.subcommand == "fetch-dpp":
        cmd_fetch_dpp(args)
    elif args.subcommand == "download":
        cmd_download(args)

if __name__ == "__main__":
    main()
