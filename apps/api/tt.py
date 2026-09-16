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
from twinthink.crypto import (
    Keypair,
    IdentityDocument,
    TwinRevisionRecord,
    create_signed_revision,
    verify_revision,
    verify_revision_chain,
    CapabilityToken,
    issue_capability,
    verify_capability,
    RevocationRecord,
    verify_twin_bundle,
    get_or_create_default_identity,
    DEFAULT_KEYSTORE_DIR
)

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

# ==========================================
# M3 CLI COMMAND HANDLERS
# ==========================================

def cmd_identity(args):
    action = args.identity_action
    name = args.name or "default"
    keystore_dir = Path(args.keystore_dir) if getattr(args, "keystore_dir", None) else DEFAULT_KEYSTORE_DIR

    if action == "create":
        kp = Keypair.generate()
        kp.save_to_disk(keystore_dir, name)
        pub_doc = kp.export_identity(name=name)
        print(f"[*] New Ed25519 identity created:")
        print(f"    Name:       {name}")
        print(f"    DID:        {kp.did}")
        print(f"    Public Key: {kp.public_hex}")
        print(f"    Keystore:   {keystore_dir / f'{name}.key'}")

        if httpx:
            try:
                with httpx.Client() as client:
                    client.post(f"{args.api_url}/api/identities", json=pub_doc.model_dump(), timeout=2.0)
            except Exception:
                pass
    elif action == "show":
        try:
            kp = Keypair.load_from_disk(keystore_dir, name)
            print(f"[*] Identity [{name}]:")
            print(f"    DID:        {kp.did}")
            print(f"    Public Key: {kp.public_hex}")
            print(f"    Keystore:   {keystore_dir / f'{name}.key'}")
        except Exception as e:
            print(f"[!] Could not load identity '{name}': {e}")
            sys.exit(1)

def cmd_twin_sign(args):
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id
    keystore_dir = Path(args.keystore_dir) if getattr(args, "keystore_dir", None) else DEFAULT_KEYSTORE_DIR
    id_name = args.identity_name or "default"

    try:
        kp = Keypair.load_from_disk(keystore_dir, id_name)
    except Exception:
        kp = get_or_create_default_identity()

    if httpx is None:
        print("[!] Error: httpx required.")
        sys.exit(1)

    with httpx.Client() as client:
        resp = client.get(f"{api_url}/api/twins/{twin_id}/bom")
        if resp.status_code != 200:
            print(f"[!] Error fetching twin {twin_id}: {resp.text}")
            sys.exit(1)
        bom_data = resp.json()
        bom_nodes = bom_data.get("bom_nodes", [])

        try:
            tree_root = parse_bom_dict(bom_nodes)
            g_hash = BomEngine.compute_hash(tree_root)
        except Exception:
            g_hash = hashlib.sha256(json.dumps(bom_nodes, sort_keys=True).encode()).hexdigest()

        rev_resp = client.get(f"{api_url}/api/twins/{twin_id}/revisions")
        parent_hash = None
        rev_name = args.revision
        if rev_resp.status_code == 200:
            rev_list = rev_resp.json().get("revisions", [])
            if rev_list:
                parent_hash = rev_list[-1].get("commit_hash") or TwinRevisionRecord.model_validate(rev_list[-1]).compute_hash()
                if not rev_name:
                    rev_name = f"R{len(rev_list)}"
            else:
                if not rev_name:
                    rev_name = "R0"
        else:
            if not rev_name:
                rev_name = "R0"

        rec = create_signed_revision(
            twin_id=twin_id,
            revision_name=rev_name,
            graph_hash=g_hash,
            keypair=kp,
            parent_revision_hash=parent_hash,
            mutation_notes=args.notes
        )

        post_resp = client.post(f"{api_url}/api/twins/{twin_id}/revisions", json=rec.model_dump())
        if post_resp.status_code != 200:
            print(f"[!] Error submitting revision: {post_resp.text}")
            sys.exit(1)

    print(f"[*] Revision {rec.revision} signed and submitted for Twin {twin_id}:")
    print(f"    Commit Hash:     {rec.compute_hash()[:16]}...")
    print(f"    Graph Hash:      {rec.graph_hash[:16]}...")
    print(f"    Author DID:      {rec.author_identity}")
    print(f"    Signature:       {rec.signature[:16]}...")

def cmd_twin_verify(args):
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id

    if httpx is None:
        print("[!] Error: httpx required.")
        sys.exit(1)

    with httpx.Client() as client:
        resp = client.get(f"{api_url}/api/twins/{twin_id}/revisions")
        if resp.status_code != 200:
            print(f"[!] Error fetching revisions: {resp.text}")
            sys.exit(1)
        data = resp.json()

    revs = data.get("revisions", [])
    chain_valid = data.get("chain_valid", False)
    print(f"\nTwin {twin_id} Revisions ({len(revs)} total):")
    for r in revs:
        print(f"  - [{r.get('revision')}] Author: {r.get('author_identity')[:25]}... Parent: {str(r.get('parent_revision'))[:12]}...")
    print(f"Chain Status: {'VERIFIED' if chain_valid else 'INVALID: ' + str(data.get('chain_error'))}\n")

def cmd_access_grant(args):
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id
    subject = args.subject
    perms = [p.strip() for p in args.permissions.split(",") if p.strip()]

    kp = get_or_create_default_identity()
    token = issue_capability(
        issuer_keypair=kp,
        subject_did=subject,
        twin_id=twin_id,
        permissions=perms,
        expires_in_seconds=args.expires_in_seconds
    )

    if httpx:
        try:
            with httpx.Client() as client:
                client.post(f"{api_url}/api/twins/{twin_id}/capabilities", json=token.model_dump())
        except Exception:
            pass

    print(f"[*] Capability Token Issued:")
    print(f"    Token ID:    {token.token_id}")
    print(f"    Subject:     {token.subject}")
    print(f"    Permissions: {token.permissions}")
    print(f"    Expires At:  {token.expires_at or 'Never'}")
    print(f"    Signature:   {token.signature[:16]}...")

def cmd_access_revoke(args):
    api_url = args.api_url or DEFAULT_API_URL
    token_id = args.token_id
    kp = get_or_create_default_identity()
    rev = RevocationRecord(
        token_id=token_id,
        revoked_by=kp.did,
        reason=args.reason or "Revoked via CLI"
    )

    if httpx:
        with httpx.Client() as client:
            resp = client.post(f"{api_url}/api/twins/any/capabilities/revoke", json=rev.model_dump())
            if resp.status_code == 200:
                print(f"[*] Token {token_id} revoked successfully.")
                return
    print(f"[*] Token {token_id} marked revoked.")

def cmd_export(args):
    api_url = args.api_url or DEFAULT_API_URL
    twin_id = args.twin_id
    out_file = Path(args.output or f"{twin_id}.twin")

    if httpx is None:
        print("[!] Error: httpx required.")
        sys.exit(1)

    with httpx.Client() as client:
        resp = client.get(f"{api_url}/api/twins/{twin_id}/bundle")
        if resp.status_code != 200:
            print(f"[!] Failed to export bundle: {resp.text}")
            sys.exit(1)
        out_file.write_bytes(resp.content)

    print(f"[*] Exported portable .twin bundle to: {out_file.resolve()} ({len(resp.content)} bytes)")

def cmd_verify_bundle(args):
    bundle_path = Path(args.bundle_file)
    if not bundle_path.exists():
        print(f"[!] Error: Bundle file not found: {bundle_path}")
        sys.exit(1)

    result = verify_twin_bundle(bundle_path)

    print("\n==========================================================")
    print("TwinThink Verification")
    print("==========================================================")
    print(f"Identity            {'VALID' if result.checks.get('identity_valid') else 'FAILED'}")
    print(f"Creator signature   {'VALID' if result.checks.get('revisions_valid') else 'FAILED'}")
    print(f"Revision chain      {'VALID' if result.checks.get('revision_chain_valid') else 'FAILED'}")
    print(f"Graph hash          {'VALID' if result.checks.get('graph_hash_valid') else 'FAILED'}")
    print(f"Provenance hashes   {'VALID' if result.checks.get('provenance_signatures_valid') else 'FAILED'}")
    print(f"Bundle integrity    {'VALID' if result.checks.get('bundle_structure_valid') else 'FAILED'}")
    print("----------------------------------------------------------")
    if result.valid:
        print("Result: VERIFIED")
    else:
        print("Result: FAILED")
        print(f"Reason: {result.summary}")
    print("==========================================================\n")
    if not result.valid:
        sys.exit(1)

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

    # identity
    p_id = subparsers.add_parser("identity", help="Manage cryptographic identities")
    p_id_sub = p_id.add_subparsers(dest="identity_action", required=True)
    p_id_create = p_id_sub.add_parser("create", help="Create new Ed25519 creator identity")
    p_id_create.add_argument("--name", default="default", help="Identity key name")
    p_id_create.add_argument("--keystore-dir", default=None, help="Custom keystore path")
    p_id_show = p_id_sub.add_parser("show", help="Show public identity")
    p_id_show.add_argument("--name", default="default", help="Identity key name")
    p_id_show.add_argument("--keystore-dir", default=None, help="Custom keystore path")

    # twin
    p_twin = subparsers.add_parser("twin", help="Manage signed twin revisions")
    p_twin_sub = p_twin.add_subparsers(dest="twin_action", required=True)
    p_twin_sign = p_twin_sub.add_parser("sign", help="Sign a twin revision")
    p_twin_sign.add_argument("twin_id", help="Twin ID")
    p_twin_sign.add_argument("--revision", default=None, help="Revision label (e.g. R1)")
    p_twin_sign.add_argument("--notes", default="Signed via tt CLI", help="Revision notes")
    p_twin_sign.add_argument("--identity-name", default="default", help="Identity key to sign with")
    p_twin_sign.add_argument("--keystore-dir", default=None, help="Custom keystore path")
    p_twin_verify = p_twin_sub.add_parser("verify", help="Verify twin revision chain")
    p_twin_verify.add_argument("twin_id", help="Twin ID")

    # access
    p_acc = subparsers.add_parser("access", help="Capability-based access delegation")
    p_acc_sub = p_acc.add_subparsers(dest="access_action", required=True)
    p_acc_grant = p_acc_sub.add_parser("grant", help="Grant capability to subject DID")
    p_acc_grant.add_argument("twin_id", help="Twin ID")
    p_acc_grant.add_argument("--subject", required=True, help="Subject DID (did:twin:...)")
    p_acc_grant.add_argument("--permissions", required=True, help="Comma-separated permissions (read:design,read:bom,...)")
    p_acc_grant.add_argument("--expires-in-seconds", type=int, default=None, help="Expiration in seconds")
    p_acc_grant.add_argument("--identity-name", default="default", help="Signing identity")
    p_acc_revoke = p_acc_sub.add_parser("revoke", help="Revoke a capability token")
    p_acc_revoke.add_argument("token_id", help="Token ID to revoke")
    p_acc_revoke.add_argument("--reason", default="Revoked via CLI", help="Revocation reason")

    # export
    p_exp = subparsers.add_parser("export", help="Export a portable .twin bundle")
    p_exp.add_argument("twin_id", help="Twin ID")
    p_exp.add_argument("--output", "-o", default=None, help="Output destination path (.twin)")

    # verify
    p_ver = subparsers.add_parser("verify", help="Verify a portable .twin bundle offline")
    p_ver.add_argument("bundle_file", help="Path to .twin bundle")

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
    elif args.subcommand == "identity":
        cmd_identity(args)
    elif args.subcommand == "twin":
        if args.twin_action == "sign":
            cmd_twin_sign(args)
        elif args.twin_action == "verify":
            cmd_twin_verify(args)
    elif args.subcommand == "access":
        if args.access_action == "grant":
            cmd_access_grant(args)
        elif args.access_action == "revoke":
            cmd_access_revoke(args)
    elif args.subcommand == "export":
        cmd_export(args)
    elif args.subcommand == "verify":
        cmd_verify_bundle(args)

if __name__ == "__main__":
    main()
