#!/usr/bin/env python3
"""
tt - Universal TwinThink CLI & Protocol Interface (Milestone M4)
"Every interface is a client of the same Twin protocol."

Provides the unified command surface:
  tt twin [create|inspect|edit|sign|verify|export|import]
  tt bom [inspect|validate]
  tt access [grant|revoke]
  tt evidence attach
  tt provenance show
  tt dpp preview
  tt mcp
  tt wrap (legacy & ingestion bridge)
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
from typing import List, Dict, Optional, Any, Union

# Ensure packages is in sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent / "packages"))

try:
    import httpx
except ImportError:
    httpx = None

from twinthink.bom import (
    parse_bom_csv,
    parse_bom_dict,
    flatten_bom_tree,
    CyclicBomError,
    OrphanBomNodeError,
    BomEngine
)
from twinthink.crypto import (
    Keypair,
    IdentityDocument,
    TwinRevisionRecord,
    CapabilityToken,
    RevocationRecord,
    verify_twin_bundle,
    get_or_create_default_identity,
    DEFAULT_KEYSTORE_DIR
)
from twinthink.service import TwinService
from twinthink.mcp.server import run_stdio_server

DEFAULT_API_URL = os.getenv("TWINTHINK_API_URL", "http://127.0.0.1:8001")

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def get_service(args: Optional[argparse.Namespace] = None) -> TwinService:
    storage_dir = getattr(args, "storage_dir", None)
    return TwinService(storage_dir=storage_dir)

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

# =============================================================================
# TT TWIN COMMANDS
# =============================================================================

def cmd_twin_create(args):
    service = get_service(args)
    files: Dict[str, bytes] = {}

    if args.bom:
        bom_p = Path(args.bom).resolve()
        if not bom_p.exists():
            print(f"[!] Error: BOM file not found: {bom_p}")
            sys.exit(1)
        files[bom_p.name] = bom_p.read_bytes()
    else:
        # Default minimal BOM
        minimal_csv = (
            "level,part_number,name,type,quantity,unit_cost,supplier,domain,rights_mode\n"
            f"0,SYS-001,{args.title or 'System'},assembly,1,0.0,Internal,system,Open Development\n"
        )
        files["bom.csv"] = minimal_csv.encode("utf-8")

    if args.files:
        for f_arg in args.files:
            fp = Path(f_arg).resolve()
            if fp.exists():
                files[fp.name] = fp.read_bytes()

    res = service.twin_create(
        files=files,
        creator=args.creator or "Engineer",
        title=args.title,
        owner_token=args.owner_token,
        rights_mode=args.rights_mode
    )

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    doc = res.get("document", {})
    manifest = res.get("manifest", {})
    structure = doc.get("structure", {})
    bom_root = structure.get("bom_root")

    print("\n========================================================")
    print(f"  SUCCESSFULLY CREATED TWIN: {res['id']}")
    print("========================================================")
    print(f"  Title:        {res.get('title')}")
    print(f"  Creator:      {res.get('creator')}")
    print(f"  Owner Token:  {res.get('owner_token')}")
    print(f"  Rights Mode:  {manifest.get('declared_rights_mode', 'Open Development')}")
    if bom_root:
        print("\n--- CANONICAL HIERARCHICAL BOM ---")
        print_bom_tree(bom_root)
        tot_cost = bom_root.get("cost", {}).get("extended_cost")
        if tot_cost is not None:
            print(f"\n  Total Rolled-Up Cost: ${tot_cost:.2f} {bom_root.get('cost', {}).get('currency', 'USD')}")
    print("========================================================\n")

def cmd_twin_inspect(args):
    service = get_service(args)
    try:
        insp = service.twin_inspect(args.twin_id)
    except Exception as e:
        print(f"[!] Error inspecting twin {args.twin_id}: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(insp, indent=2))
        return

    doc = insp.get("document", {})
    manifest = insp.get("manifest", {})
    structure = doc.get("structure", {})
    bom_root = structure.get("bom_root")

    print("\n========================================================")
    print(f"  TWIN INSPECT: {insp['id']}")
    print("========================================================")
    print(f"  Title:          {manifest.get('title', 'Digital Twin')}")
    print(f"  Creator:        {insp.get('creator')}")
    print(f"  Created At:     {insp.get('created_at')}")
    print(f"  Rights Mode:    {manifest.get('declared_rights_mode', 'Open Development')}")
    print(f"  Revisions:      {insp.get('revisions_count', 0)}")
    print(f"  BOM Nodes:      {insp.get('bom_nodes_count', 0)}")
    print(f"  Evidence Tests: {insp.get('evidence_tests_count', 0)}")
    if insp.get("rolled_up_unit_cost") is not None:
        print(f"  Total Cost:     ${insp['rolled_up_unit_cost']:.2f}")

    if insp.get("revisions"):
        print("\n--- SIGNED REVISION TIMELINE ---")
        for r in insp["revisions"]:
            rev = r.get("revision")
            g_h = (r.get("graph_hash") or "")[:12]
            auth = (r.get("author_identity") or "")[:20]
            sig = (r.get("signature") or "")[:12]
            print(f"  [{rev}] Graph: {g_h}... | Author: {auth}... | Sig: {sig}...")

    if bom_root:
        print("\n--- HIERARCHICAL BOM TREE ---")
        print_bom_tree(bom_root)
    print("========================================================\n")

def cmd_twin_edit(args):
    service = get_service(args)
    try:
        res = service.twin_edit(
            twin_id=args.twin_id,
            title=args.title,
            summary=args.summary,
            rights_mode=args.rights_mode,
            owner_token=args.owner_token
        )
    except Exception as e:
        print(f"[!] Error editing twin {args.twin_id}: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    print(f"[*] Twin {args.twin_id} updated successfully.")
    if args.title:
        print(f"    Title:       {args.title}")
    if args.rights_mode:
        print(f"    Rights Mode: {args.rights_mode}")

def cmd_twin_sign(args):
    service = get_service(args)
    try:
        res = service.twin_sign(
            twin_id=args.twin_id,
            revision_name=args.revision,
            identity_name=args.identity_name or "default",
            notes=args.notes
        )
    except Exception as e:
        print(f"[!] Error signing twin {args.twin_id}: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    print(f"[*] Revision {res['revision']} signed for Twin {args.twin_id}:")
    print(f"    Commit Hash:     {res['commit_hash'][:16]}...")
    print(f"    Graph Hash:      {res['graph_hash'][:16]}...")
    print(f"    Author Identity: {res['author_identity']}")
    print(f"    Signature:       {res['signature'][:16]}...")

def cmd_twin_verify(args):
    service = get_service(args)
    target = args.target
    try:
        res = service.twin_verify(target)
    except Exception as e:
        print(f"[!] Verification error: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    is_valid = res.get("valid", False)
    checks = res.get("checks", {})

    print("\n==========================================================")
    print("TwinThink Verification")
    print("==========================================================")
    if "identity_valid" in checks:
        print(f"Identity            {'VALID' if checks.get('identity_valid') else 'FAILED'}")
        print(f"Creator signature   {'VALID' if checks.get('revisions_valid') else 'FAILED'}")
        print(f"Revision chain      {'VALID' if checks.get('revision_chain_valid') else 'FAILED'}")
        print(f"Graph hash          {'VALID' if checks.get('graph_hash_valid') else 'FAILED'}")
        print(f"Provenance hashes   {'VALID' if checks.get('provenance_signatures_valid') else 'FAILED'}")
        print(f"Bundle integrity    {'VALID' if checks.get('bundle_structure_valid') else 'FAILED'}")
    else:
        print(f"Revision chain      {'VALID' if checks.get('chain_valid') else 'FAILED'}")
        print(f"Revisions count:    {checks.get('revisions_count', 0)}")
    print("----------------------------------------------------------")
    if is_valid:
        print("Result: VERIFIED")
    else:
        print("Result: FAILED")
        print(f"Reason: {res.get('summary')}")
    print("==========================================================\n")
    if not is_valid:
        sys.exit(1)

def cmd_twin_export(args):
    service = get_service(args)
    try:
        data, out_path = service.twin_export(args.twin_id, output_path=args.output)
    except Exception as e:
        print(f"[!] Error exporting twin {args.twin_id}: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps({"twin_id": args.twin_id, "output": str(out_path), "size_bytes": len(data)}, indent=2))
        return

    print(f"[*] Exported portable .twin bundle to: {out_path.resolve()} ({len(data)} bytes)")

def cmd_twin_import(args):
    service = get_service(args)
    bundle_path = Path(args.bundle_file)
    if not bundle_path.exists():
        print(f"[!] Error: Bundle file not found: {bundle_path}")
        sys.exit(1)

    try:
        res = service.twin_import(bundle_source=bundle_path, target_twin_id=args.twin_id)
    except Exception as e:
        print(f"[!] Error importing bundle: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    print("\n========================================================")
    print(f"  SUCCESSFULLY IMPORTED TWIN: {res['twin_id']}")
    print("========================================================")
    print(f"  Title:           {res.get('title')}")
    print(f"  Creator:         {res.get('creator')}")
    print(f"  Revisions count: {res.get('revisions_count')}")
    print(f"  Verification:    {'VERIFIED' if res.get('verification', {}).get('valid') else 'FAILED'}")
    print("========================================================\n")

# =============================================================================
# TT BOM COMMANDS
# =============================================================================

def cmd_bom_inspect(args):
    service = get_service(args)
    try:
        res = service.bom_inspect(args.target)
    except Exception as e:
        print(f"[!] Error inspecting BOM {args.target}: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    root = res.get("tree_root")
    print(f"\n=== CANONICAL HIERARCHICAL BOM (Target: {args.target}) ===")
    if root:
        print_bom_tree(root)
        cost = res.get("total_rolled_up_cost")
        curr = res.get("currency", "USD")
        if cost is not None:
            print(f"\nTotal Rolled-Up Cost: ${cost:.2f} {curr}")
        else:
            print("\nTotal Rolled-Up Cost: Unknown (Missing supplier pricing preserved honestly)")
    print("=========================================================\n")

def cmd_bom_validate(args):
    service = get_service(args)
    res = service.bom_validate(args.target)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    is_valid = res.get("valid", False)
    print(f"\n[*] Validating BOM for target: {args.target}")
    print(f"Result:             {'VALID' if is_valid else 'FAILED'}")
    print(f"Summary:            {res.get('summary')}")
    if "nodes_count" in res:
        print(f"Nodes count:        {res.get('nodes_count')}")
        print(f"Orphan nodes:       {res.get('orphans_count')}")
        print(f"Cycles detected:    {res.get('cycles_detected')}")
        print(f"Missing quotes:     {res.get('missing_quotes_count')}")
    if not is_valid:
        if res.get("error"):
            print(f"Error:              {res.get('error')}")
        sys.exit(1)

# =============================================================================
# TT ACCESS COMMANDS
# =============================================================================

def cmd_access_grant(args):
    service = get_service(args)
    perms = [p.strip() for p in args.permissions.split(",") if p.strip()]
    try:
        token = service.access_grant(
            twin_id=args.twin_id,
            subject=args.subject,
            permissions=perms,
            expires_hours=args.expires_hours,
            issuer_name=args.identity_name or "default"
        )
    except Exception as e:
        print(f"[!] Error granting access: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(token, indent=2))
        return

    print("\n========================================================")
    print("  CAPABILITY TOKEN ISSUED")
    print("========================================================")
    print(f"  Token ID:    {token['token_id']}")
    print(f"  Subject DID: {token['subject']}")
    print(f"  Twin ID:     {token['twin_id']}")
    print(f"  Permissions: {', '.join(token['permissions'])}")
    print(f"  Issued By:   {token['issued_by']}")
    print(f"  Expires At:  {token.get('expires_at') or 'Never'}")
    print(f"  Signature:   {token['signature'][:16]}...")
    print("========================================================\n")

def cmd_access_revoke(args):
    service = get_service(args)
    try:
        rec = service.access_revoke(
            token_id=args.token_id,
            reason=args.reason or "Revoked via CLI",
            revoker_name=args.identity_name or "default"
        )
    except Exception as e:
        print(f"[!] Error revoking capability: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(rec, indent=2))
        return

    print(f"[*] Capability token {args.token_id} revoked.")
    print(f"    Revoked By: {rec['revoked_by']}")
    print(f"    Reason:     {rec['reason']}")

# =============================================================================
# TT EVIDENCE & PROVENANCE COMMANDS
# =============================================================================

def cmd_evidence_attach(args):
    service = get_service(args)
    csv_bytes = None
    if args.csv:
        csv_p = Path(args.csv).resolve()
        if not csv_p.exists():
            print(f"[!] CSV file not found: {csv_p}")
            sys.exit(1)
        csv_bytes = csv_p.read_bytes()

    metrics_dict = None
    if args.metrics:
        try:
            metrics_dict = json.loads(args.metrics)
        except Exception:
            metrics_dict = {"raw": args.metrics}

    try:
        res = service.evidence_attach(
            twin_id=args.twin_id,
            title=args.title,
            csv_content=csv_bytes,
            evidence_type=args.type or "physical_test",
            operator=args.operator or "@Engineer",
            notes=args.notes or "",
            metrics=metrics_dict,
            target_node_id=args.node
        )
    except Exception as e:
        print(f"[!] Error attaching evidence: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(res, indent=2))
        return

    print("\n========================================================")
    print(f"  EVIDENCE ATTACHED: {res['test_id']}")
    print("========================================================")
    print(f"  Twin ID:     {res['twin_id']}")
    print(f"  Test #{res['test_number']}:     {res['title']}")
    print(f"  Status:      {res['status'].upper()}")
    if res.get("target_node_id"):
        print(f"  Target Node: {res['target_node_id']}")
    if res.get("metrics"):
        print(f"  Metrics:     {res['metrics']}")
    print("========================================================\n")

def cmd_provenance_show(args):
    service = get_service(args)
    try:
        ledger = service.provenance_show(twin_id=args.twin_id, node_id=args.node)
    except Exception as e:
        print(f"[!] Error retrieving provenance: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(ledger, indent=2))
        return

    node_filter_str = f" (Node: {args.node})" if args.node else ""
    print(f"\n=== PROVENANCE LEDGER: Twin {args.twin_id}{node_filter_str} ===")
    if not ledger:
        print("  No provenance entries recorded yet.")
    for p in ledger:
        ts = p.get("timestamp", "unknown")
        node_name = p.get("node_name", p.get("node_id", "Twin"))
        action = p.get("action", "modified")
        actor = p.get("actor", "system")
        details = p.get("change_summary") or p.get("evidence_id") or ""
        print(f"  [{ts}] {node_name} | Action: {action} | Actor: {actor} {f'| {details}' if details else ''}")
    print("============================================================\n")

# =============================================================================
# TT DPP COMMANDS
# =============================================================================

def cmd_dpp_preview(args):
    service = get_service(args)
    tier = "public" if args.public_only else "supply_chain"
    try:
        data = service.dpp_preview(args.twin_id, tier=tier)
    except Exception as e:
        print(f"[!] Error generating DPP preview: {e}")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(data, indent=2))
        return

    print(f"\n=== EU DIGITAL PRODUCT PASSPORT (DPP) - TWIN {args.twin_id} ===")
    print(f"Product:      {data.get('product_name')}")
    print(f"Manufacturer: {data.get('manufacturer')}")
    print(f"DPP Schema:   {data.get('dpp_version')} (EU 2023/1542 / Ecodesign Compliant)")
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

# =============================================================================
# TT MCP COMMAND
# =============================================================================

def cmd_mcp(args):
    service = get_service(args)
    run_stdio_server(service=service)

# =============================================================================
# WRAP & LEGACY COMPATIBILITY
# =============================================================================

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
    watch_dir = Path(args.watch_dir or ".").resolve()
    print(f"[*] tt wrap running command: {' '.join(args.command)}")
    print(f"[*] Monitoring directory: {watch_dir}")

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

    after_files = _scan_files(watch_dir)
    captured_files: Dict[str, bytes] = {}
    for full_path, mtime in after_files.items():
        if full_path not in before_files or mtime > before_files[full_path]:
            p = Path(full_path)
            rel = str(p.relative_to(watch_dir)).replace("\\", "/")
            try:
                captured_files[rel] = p.read_bytes()
            except Exception:
                pass

    if args.bom:
        bom_p = Path(args.bom).resolve()
        if bom_p.exists():
            captured_files[bom_p.name] = bom_p.read_bytes()
    if args.files:
        for f_arg in args.files:
            fp = Path(f_arg).resolve()
            if fp.exists():
                captured_files[fp.name] = fp.read_bytes()

    service = get_service(args)
    res = service.twin_create(
        files=captured_files,
        creator=args.creator or "Engineer",
        title=args.title,
        owner_token=args.owner_token
    )

    doc = res.get("document", {})
    structure = doc.get("structure", {})
    bom_root = structure.get("bom_root")

    print("\n========================================================")
    print(f"  SUCCESSFULLY INGESTED TWIN: {res['id']}")
    print("========================================================")
    print(f"  Title:        {res.get('title')}")
    print(f"  Creator:      {res.get('creator')}")
    print(f"  Owner Token:  {res.get('owner_token')}")
    if bom_root:
        print("\n--- CANONICAL HIERARCHICAL BOM ---")
        print_bom_tree(bom_root)
        tot_cost = bom_root.get("cost", {}).get("extended_cost")
        if tot_cost is not None:
            print(f"\n  Total Rolled-Up Cost: ${tot_cost:.2f} {bom_root.get('cost', {}).get('currency', 'USD')}")
    print("========================================================\n")

def cmd_identity(args):
    action = args.identity_action
    name = args.name or "default"
    keystore_dir = Path(args.keystore_dir) if getattr(args, "keystore_dir", None) else DEFAULT_KEYSTORE_DIR

    if action == "create":
        kp = Keypair.generate()
        kp.save_to_disk(keystore_dir, name)
        print(f"[*] New Ed25519 identity created:")
        print(f"    Name:       {name}")
        print(f"    DID:        {kp.did}")
        print(f"    Public Key: {kp.public_hex}")
        print(f"    Keystore:   {keystore_dir / f'{name}.key'}")
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

# =============================================================================
# CLI PARSER DEFINITION
# =============================================================================

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="tt",
        description="TwinThink CLI - Universal Twin Protocol, BOM & MCP Tooling"
    )
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help=f"TwinThink API URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--storage-dir", default=None, help="Custom TwinThink local storage directory")
    parser.add_argument("--json", action="store_true", help="Format output as machine-readable JSON")

    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # 1. tt twin [create|inspect|edit|sign|verify|export|import]
    p_twin = subparsers.add_parser("twin", help="Manage canonical Digital Twins")
    twin_sub = p_twin.add_subparsers(dest="twin_action", required=True)

    # tt twin create
    p_t_create = twin_sub.add_parser("create", help="Create a new Twin")
    p_t_create.add_argument("--title", default=None, help="Twin title")
    p_t_create.add_argument("--creator", default="Engineer", help="Creator name or DID")
    p_t_create.add_argument("--bom", default=None, help="Path to BOM CSV or JSON")
    p_t_create.add_argument("--rights-mode", default="Open Development", help="Declared rights mode")
    p_t_create.add_argument("--files", nargs="*", help="Additional files to bundle")
    p_t_create.add_argument("--owner-token", default=None, help="Explicit creator owner token")

    # tt twin inspect
    p_t_insp = twin_sub.add_parser("inspect", help="Inspect full state and BOM of a Twin")
    p_t_insp.add_argument("twin_id", help="Twin identifier")

    # tt twin edit
    p_t_edit = twin_sub.add_parser("edit", help="Edit Twin title, summary, or rights mode")
    p_t_edit.add_argument("twin_id", help="Twin identifier")
    p_t_edit.add_argument("--title", default=None, help="Updated title")
    p_t_edit.add_argument("--summary", default=None, help="Updated summary")
    p_t_edit.add_argument("--rights-mode", default=None, help="Updated declared rights mode")
    p_t_edit.add_argument("--owner-token", default=None, help="Owner authorization token")

    # tt twin sign
    p_t_sign = twin_sub.add_parser("sign", help="Sign a revision snapshot with Ed25519")
    p_t_sign.add_argument("twin_id", help="Twin identifier")
    p_t_sign.add_argument("--revision", default=None, help="Revision label (e.g. R1)")
    p_t_sign.add_argument("--notes", default="Signed via tt CLI", help="Revision notes")
    p_t_sign.add_argument("--identity-name", default="default", help="Signing identity name")

    # tt twin verify
    p_t_ver = twin_sub.add_parser("verify", help="Verify Twin revision chain or offline bundle")
    p_t_ver.add_argument("target", help="Twin ID or path to .twin bundle")

    # tt twin export
    p_t_exp = twin_sub.add_parser("export", help="Export portable .twin bundle archive")
    p_t_exp.add_argument("twin_id", help="Twin identifier")
    p_t_exp.add_argument("--output", "-o", default=None, help="Destination path for .twin bundle")

    # tt twin import
    p_t_imp = twin_sub.add_parser("import", help="Import portable .twin bundle archive")
    p_t_imp.add_argument("bundle_file", help="Path to .twin file")
    p_t_imp.add_argument("--twin-id", default=None, help="Target Twin ID override")

    # 2. tt bom [inspect|validate]
    p_bom = subparsers.add_parser("bom", help="Hierarchical Bill of Materials tooling")
    bom_sub = p_bom.add_subparsers(dest="bom_action", required=True)

    p_b_insp = bom_sub.add_parser("inspect", help="Inspect BOM tree and recursive cost rollups")
    p_b_insp.add_argument("target", help="Twin ID or path to local BOM file (CSV/JSON)")

    p_b_val = bom_sub.add_parser("validate", help="Validate BOM for cycles, orphans, and honest costs")
    p_b_val.add_argument("target", help="Twin ID or path to local BOM file (CSV/JSON)")

    # 3. tt access [grant|revoke]
    p_acc = subparsers.add_parser("access", help="Capability-based access delegation")
    acc_sub = p_acc.add_subparsers(dest="access_action", required=True)

    p_a_grant = acc_sub.add_parser("grant", help="Issue signed capability token to subject DID")
    p_a_grant.add_argument("twin_id", help="Twin identifier")
    p_a_grant.add_argument("--subject", required=True, help="Subject DID (did:twin:...)")
    p_a_grant.add_argument("--permissions", required=True, help="Comma-separated permissions (read,bom:read,...)")
    p_a_grant.add_argument("--expires-hours", type=float, default=720.0, help="Validity duration in hours")
    p_a_grant.add_argument("--identity-name", default="default", help="Signing identity name")

    p_a_rev = acc_sub.add_parser("revoke", help="Revoke an issued capability token")
    p_a_rev.add_argument("token_id", help="Token identifier")
    p_a_rev.add_argument("--reason", default="Revoked via CLI", help="Revocation rationale")
    p_a_rev.add_argument("--identity-name", default="default", help="Signing identity name")

    # 4. tt evidence attach
    p_ev = subparsers.add_parser("evidence", help="Attach empirical evidence and test calibrations")
    ev_sub = p_ev.add_subparsers(dest="evidence_action", required=True)

    p_e_att = ev_sub.add_parser("attach", help="Attach test run, simulation, or QA evidence")
    p_e_att.add_argument("twin_id", help="Twin identifier")
    p_e_att.add_argument("--title", required=True, help="Title of evidence")
    p_e_att.add_argument("--type", default="physical_test", help="Type: physical_test, simulation, inspection")
    p_e_att.add_argument("--operator", default="@Engineer", help="Operator or lab")
    p_e_att.add_argument("--notes", default="", help="Notes and setup details")
    p_e_att.add_argument("--node", default=None, help="Optional BOM node ID to link evidence to")
    p_e_att.add_argument("--csv", default=None, help="Path to timeseries CSV data")
    p_e_att.add_argument("--metrics", default=None, help="JSON metrics string")

    # 5. tt provenance show
    p_prov = subparsers.add_parser("provenance", help="Inspect cryptographic and lifecycle provenance")
    prov_sub = p_prov.add_subparsers(dest="provenance_action", required=True)

    p_p_show = prov_sub.add_parser("show", help="Show provenance history")
    p_p_show.add_argument("twin_id", help="Twin identifier")
    p_p_show.add_argument("--node", default=None, help="Optional BOM node ID filter")

    # 6. tt dpp preview
    p_dpp = subparsers.add_parser("dpp", help="EU Digital Product Passport (DPP) compliance")
    dpp_sub = p_dpp.add_subparsers(dest="dpp_action", required=True)

    p_d_prev = dpp_sub.add_parser("preview", help="Preview EU DPP compliance dossier")
    p_d_prev.add_argument("twin_id", help="Twin identifier")
    p_d_prev.add_argument("--public-only", action="store_true", help="Show public circularity data only")

    # 7. tt mcp
    p_mcp = subparsers.add_parser("mcp", help="Run Model Context Protocol (MCP) server over stdio")

    # 8. Backward compatibility aliases
    p_wrap = subparsers.add_parser("wrap", help="Wrap command and ingest artifacts")
    p_wrap.add_argument("--watch-dir", default=".", help="Directory to monitor")
    p_wrap.add_argument("--creator", default="Engineer", help="Creator name")
    p_wrap.add_argument("--title", default=None, help="Twin title")
    p_wrap.add_argument("--bom", default=None, help="Path to BOM file")
    p_wrap.add_argument("--files", nargs="*", help="Files to attach")
    p_wrap.add_argument("--owner-token", default=None, help="Owner token")
    p_wrap.add_argument("--ignore-exit-code", action="store_true", help="Ignore wrapped command failure")
    p_wrap.add_argument("command", nargs=argparse.REMAINDER, help="Command to execute")

    p_inspect_bom = subparsers.add_parser("inspect-bom", help="Alias for `tt bom inspect`")
    p_inspect_bom.add_argument("bom_file", help="Path to BOM file")

    p_fetch_bom = subparsers.add_parser("fetch-bom", help="Alias for `tt bom inspect`")
    p_fetch_bom.add_argument("twin_id", help="Twin ID")

    p_fetch_dpp = subparsers.add_parser("fetch-dpp", help="Alias for `tt dpp preview`")
    p_fetch_dpp.add_argument("twin_id", help="Twin ID")

    p_dl = subparsers.add_parser("download", help="Alias for `tt twin export`")
    p_dl.add_argument("twin_id", help="Twin ID")
    p_dl.add_argument("--output", "-o", default=None, help="Output destination path")

    p_id = subparsers.add_parser("identity", help="Manage cryptographic identities")
    p_id_sub = p_id.add_subparsers(dest="identity_action", required=True)
    p_id_c = p_id_sub.add_parser("create", help="Create identity")
    p_id_c.add_argument("--name", default="default")
    p_id_c.add_argument("--keystore-dir", default=None)
    p_id_s = p_id_sub.add_parser("show", help="Show identity")
    p_id_s.add_argument("--name", default="default")
    p_id_s.add_argument("--keystore-dir", default=None)

    p_exp = subparsers.add_parser("export", help="Alias for `tt twin export`")
    p_exp.add_argument("twin_id", help="Twin ID")
    p_exp.add_argument("--output", "-o", default=None, help="Output destination path")

    p_ver = subparsers.add_parser("verify", help="Alias for `tt twin verify`")
    p_ver.add_argument("bundle_file", help="Path to .twin bundle")

    return parser

def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.subcommand == "twin":
        if args.twin_action == "create":
            cmd_twin_create(args)
        elif args.twin_action == "inspect":
            cmd_twin_inspect(args)
        elif args.twin_action == "edit":
            cmd_twin_edit(args)
        elif args.twin_action == "sign":
            cmd_twin_sign(args)
        elif args.twin_action == "verify":
            cmd_twin_verify(args)
        elif args.twin_action == "export":
            cmd_twin_export(args)
        elif args.twin_action == "import":
            cmd_twin_import(args)

    elif args.subcommand == "bom":
        if args.bom_action == "inspect":
            cmd_bom_inspect(args)
        elif args.bom_action == "validate":
            cmd_bom_validate(args)

    elif args.subcommand == "access":
        if args.access_action == "grant":
            cmd_access_grant(args)
        elif args.access_action == "revoke":
            cmd_access_revoke(args)

    elif args.subcommand == "evidence":
        if args.evidence_action == "attach":
            cmd_evidence_attach(args)

    elif args.subcommand == "provenance":
        if args.provenance_action == "show":
            cmd_provenance_show(args)

    elif args.subcommand == "dpp":
        if args.dpp_action == "preview":
            cmd_dpp_preview(args)

    elif args.subcommand == "mcp":
        cmd_mcp(args)

    # Legacy & Aliases
    elif args.subcommand == "wrap":
        if hasattr(args, "command") and args.command and args.command[0] == "--":
            args.command = args.command[1:]
        if not args.command:
            print("[!] Error: No command specified for `tt wrap`.")
            sys.exit(1)
        cmd_wrap(args)

    elif args.subcommand == "inspect-bom":
        args.target = args.bom_file
        cmd_bom_inspect(args)

    elif args.subcommand == "fetch-bom":
        args.target = args.twin_id
        cmd_bom_inspect(args)

    elif args.subcommand == "fetch-dpp":
        args.public_only = False
        cmd_dpp_preview(args)

    elif args.subcommand == "download":
        cmd_twin_export(args)

    elif args.subcommand == "identity":
        cmd_identity(args)

    elif args.subcommand == "export":
        cmd_twin_export(args)

    elif args.subcommand == "verify":
        args.target = args.bundle_file
        cmd_twin_verify(args)

if __name__ == "__main__":
    main()
