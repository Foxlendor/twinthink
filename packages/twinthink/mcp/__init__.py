"""
TwinThink Model Context Protocol (MCP) Server.
Enables AI coding agents (Antigravity, Claude, etc.) to inspect, validate,
cryptographically sign, and manipulate canonical Digital Twins over stdio.
"""

from .server import McpServer, run_stdio_server

__all__ = ["McpServer", "run_stdio_server"]
