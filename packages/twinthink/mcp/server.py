"""
TwinThink JSON-RPC 2.0 MCP (Model Context Protocol) Server.
Runs over standard I/O (stdio) to allow agentic assistants (Antigravity, Cursor, Claude Desktop)
to interact directly with canonical Digital Twins via the unified TwinService.
"""

import sys
import json
import logging
import traceback
from typing import Dict, Any, List, Optional
from pathlib import Path

from ..service import TwinService

logger = logging.getLogger("twinthink.mcp")

PROTOCOL_VERSION = "2024-11-05"

TOOL_DEFINITIONS = [
    {
        "name": "twin_create",
        "description": "Create a new canonical Digital Twin with hierarchical BOM, initial revision, and persistent storage.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Title or name of the Twin project."},
                "creator": {"type": "string", "description": "Creator name or DID (defaults to 'AI Assistant')."},
                "bom_csv": {"type": "string", "description": "Raw CSV string representing the Bill of Materials hierarchy."},
                "rights_mode": {
                    "type": "string",
                    "description": "Declared rights policy: 'Open Development', 'Copyleft Hardware', 'Dual Commercial / Non-Commercial', 'Patented', 'Trade Secret', or 'Source-Available Restricted'.",
                    "enum": [
                        "Open Development",
                        "Copyleft Hardware",
                        "Dual Commercial / Non-Commercial",
                        "Patented",
                        "Trade Secret",
                        "Source-Available Restricted"
                    ]
                },
                "owner_token": {"type": "string", "description": "Optional custom owner authorization token."}
            },
            "required": ["title"]
        }
    },
    {
        "name": "twin_inspect",
        "description": "Inspect full canonical metadata, hierarchical BOM summary, revisions, and evidence tests for a Twin.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin (e.g. 'c6b8')."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "twin_edit",
        "description": "Edit title, summary, or declared rights mode for an existing Twin.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "title": {"type": "string", "description": "Updated title."},
                "summary": {"type": "string", "description": "Updated summary / description."},
                "rights_mode": {"type": "string", "description": "Updated declared rights mode."},
                "owner_token": {"type": "string", "description": "Owner authorization token if required."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "twin_sign",
        "description": "Cryptographically sign a revision snapshot of a Twin using an Ed25519 author keypair, locking the canonical graph hash.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "revision_name": {"type": "string", "description": "Optional revision name (e.g. 'R1', 'v1.0-release')."},
                "identity_name": {"type": "string", "description": "Identity keystore name (default: 'default')."},
                "notes": {"type": "string", "description": "Mutation or engineering changelog notes for this commit."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "twin_verify",
        "description": "Perform cryptographic verification on a Twin revision chain or an offline portable .twin bundle archive.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target": {"type": "string", "description": "Twin ID or file path to a .twin bundle archive to verify."}
            },
            "required": ["target"]
        }
    },
    {
        "name": "twin_export",
        "description": "Export a self-contained portable .twin bundle archive containing the signed revision chain and graph.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin to export."},
                "output_path": {"type": "string", "description": "Optional destination path for the .twin file."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "twin_import",
        "description": "Import and verify a portable .twin bundle archive into the local TwinThink repository.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "bundle_path": {"type": "string", "description": "Path to the .twin bundle file to import."},
                "twin_id": {"type": "string", "description": "Optional target Twin ID override."}
            },
            "required": ["bundle_path"]
        }
    },
    {
        "name": "bom_inspect",
        "description": "Inspect the canonical hierarchical BOM tree, part counts, unit/extended cost rollups, and critical lead-time paths.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "max_depth": {"type": "integer", "description": "Optional maximum tree depth to render."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "bom_validate",
        "description": "Validate a Twin BOM graph against structural constraints: detect cycles, orphans, invalid costs, or missing roots.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "access_grant",
        "description": "Issue an Ed25519-signed capability token granting specific permissions (read, bom:read, evidence:attach, etc.) to a subject DID.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "subject": {"type": "string", "description": "Subject DID or identifier to receive access."},
                "permissions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of permission scopes (e.g. ['read', 'bom:read', 'evidence:attach', 'admin'])."
                },
                "expires_hours": {"type": "number", "description": "Validity period in hours (default: 720.0)."}
            },
            "required": ["twin_id", "subject", "permissions"]
        }
    },
    {
        "name": "access_revoke",
        "description": "Cryptographically revoke an issued capability token and record it on the revocation list.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "token_id": {"type": "string", "description": "Capability token ID to revoke."},
                "reason": {"type": "string", "description": "Revocation rationale (e.g. 'Security rotation', 'NDA expiration')."}
            },
            "required": ["token_id"]
        }
    },
    {
        "name": "evidence_attach",
        "description": "Attach empirical evidence (physical test run, simulation calibration, manufacturing QA) to a Twin and optionally to a specific BOM node.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "title": {"type": "string", "description": "Descriptive title of the test or evidence."},
                "evidence_type": {
                    "type": "string",
                    "description": "Type: 'physical_test', 'simulation', 'inspection', or 'certificate'.",
                    "enum": ["physical_test", "simulation", "inspection", "certificate"]
                },
                "operator": {"type": "string", "description": "Operator, tester, or lab name."},
                "notes": {"type": "string", "description": "Test observations and setup parameters."},
                "metrics": {"type": "object", "description": "Key-value metrics dictionary (e.g. {'peak_thrust_n': 120.5})."},
                "target_node_id": {"type": "string", "description": "Optional BOM node ID to attach this evidence to directly."},
                "csv_data": {"type": "string", "description": "Optional CSV timeseries data string."}
            },
            "required": ["twin_id", "title"]
        }
    },
    {
        "name": "provenance_show",
        "description": "Retrieve the complete cryptographic and operational provenance history for a Twin or a specific BOM part.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "node_id": {"type": "string", "description": "Optional node ID to filter provenance records."}
            },
            "required": ["twin_id"]
        }
    },
    {
        "name": "dpp_preview",
        "description": "Generate an EU Digital Product Passport (DPP) compliance preview compliant with EU Battery and Ecodesign Regulations.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "twin_id": {"type": "string", "description": "Unique identifier of the Twin."},
                "public_only": {"type": "boolean", "description": "Filter strictly to public circularity and recyclability attributes."}
            },
            "required": ["twin_id"]
        }
    }
]

class McpServer:
    """Implements the Model Context Protocol (MCP) server over TwinService."""

    def __init__(self, service: Optional[TwinService] = None):
        self.service = service or TwinService()

    def handle_request(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if not method:
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32600, "message": "Invalid Request: missing method"}}

        try:
            if method == "initialize":
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": PROTOCOL_VERSION,
                        "capabilities": {
                            "tools": {"listChanged": False}
                        },
                        "serverInfo": {
                            "name": "twinthink-mcp",
                            "version": "0.4.0"
                        }
                    }
                }

            elif method == "notifications/initialized":
                # Notifications do not return a response
                return None

            elif method == "ping":
                return {"jsonrpc": "2.0", "id": req_id, "result": {}}

            elif method == "tools/list":
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "tools": TOOL_DEFINITIONS
                    }
                }

            elif method == "tools/call":
                tool_name = params.get("name")
                args = params.get("arguments", {})
                res_content, is_error = self.execute_tool(tool_name, args)
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(res_content, indent=2) if isinstance(res_content, (dict, list)) else str(res_content)
                            }
                        ],
                        "isError": is_error
                    }
                }

            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Method not found: {method}"}
                }

        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32603,
                    "message": str(e),
                    "data": traceback.format_exc()
                }
            }

    def execute_tool(self, tool_name: str, args: Dict[str, Any]) -> tuple[Any, bool]:
        try:
            if tool_name == "twin_create":
                files: Dict[str, bytes] = {}
                if "bom_csv" in args and args["bom_csv"]:
                    files["bom.csv"] = args["bom_csv"].encode("utf-8")
                else:
                    # Minimal default BOM if none provided
                    minimal_bom = (
                        "level,part_number,name,type,quantity,unit_cost,supplier,domain,rights_mode\n"
                        f"0,SYS-001,{args.get('title', 'System')},assembly,1,0.0,Internal,system,Open Development\n"
                    )
                    files["bom.csv"] = minimal_bom.encode("utf-8")

                res = self.service.twin_create(
                    files=files,
                    creator=args.get("creator", "AI Assistant"),
                    title=args.get("title"),
                    owner_token=args.get("owner_token"),
                    rights_mode=args.get("rights_mode")
                )
                return res, False

            elif tool_name == "twin_inspect":
                res = self.service.twin_inspect(args["twin_id"])
                return res, False

            elif tool_name == "twin_edit":
                res = self.service.twin_edit(
                    twin_id=args["twin_id"],
                    title=args.get("title"),
                    summary=args.get("summary"),
                    rights_mode=args.get("rights_mode"),
                    owner_token=args.get("owner_token")
                )
                return res, False

            elif tool_name == "twin_sign":
                res = self.service.twin_sign(
                    twin_id=args["twin_id"],
                    revision_name=args.get("revision_name"),
                    identity_name=args.get("identity_name", "default"),
                    notes=args.get("notes")
                )
                return res, False

            elif tool_name == "twin_verify":
                res = self.service.twin_verify(args["target"])
                return res, False

            elif tool_name == "twin_export":
                bundle_bytes, out_path = self.service.twin_export(
                    twin_id=args["twin_id"],
                    output_path=args.get("output_path")
                )
                return {
                    "status": "exported",
                    "twin_id": args["twin_id"],
                    "output_path": str(out_path),
                    "size_bytes": len(bundle_bytes)
                }, False

            elif tool_name == "twin_import":
                res = self.service.twin_import(
                    bundle_source=args["bundle_path"],
                    target_twin_id=args.get("twin_id")
                )
                return res, False

            elif tool_name == "bom_inspect":
                res = self.service.bom_inspect(
                    twin_id=args["twin_id"],
                    max_depth=args.get("max_depth")
                )
                return res, False

            elif tool_name == "bom_validate":
                res = self.service.bom_validate(args["twin_id"])
                return res, False

            elif tool_name == "access_grant":
                res = self.service.access_grant(
                    twin_id=args["twin_id"],
                    subject=args["subject"],
                    permissions=args["permissions"],
                    expires_hours=args.get("expires_hours", 720.0)
                )
                return res, False

            elif tool_name == "access_revoke":
                res = self.service.access_revoke(
                    token_id=args["token_id"],
                    reason=args.get("reason", "Revoked via MCP")
                )
                return res, False

            elif tool_name == "evidence_attach":
                res = self.service.evidence_attach(
                    twin_id=args["twin_id"],
                    title=args["title"],
                    evidence_type=args.get("evidence_type", "physical_test"),
                    operator=args.get("operator", "AI Agent"),
                    notes=args.get("notes", ""),
                    metrics=args.get("metrics"),
                    target_node_id=args.get("target_node_id"),
                    csv_data=args.get("csv_data")
                )
                return res, False

            elif tool_name == "provenance_show":
                res = self.service.provenance_show(
                    twin_id=args["twin_id"],
                    node_id=args.get("node_id")
                )
                return res, False

            elif tool_name == "dpp_preview":
                res = self.service.dpp_preview(
                    twin_id=args["twin_id"],
                    public_only=args.get("public_only", False)
                )
                return res, False

            else:
                return f"Unknown tool: {tool_name}", True

        except Exception as err:
            return {"error": str(err), "details": traceback.format_exc()}, True

def run_stdio_server(service: Optional[TwinService] = None):
    """Runs the MCP server loop over standard input and output."""
    server = McpServer(service=service)
    # Ensure stdout is unbuffered or flushed after each response
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            response = server.handle_request(req)
            if response is not None:
                sys.stdout.write(json.dumps(response) + "\n")
                sys.stdout.flush()
        except json.JSONDecodeError:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "Parse error: invalid JSON"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": str(e)}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()
