"""
Main entry point for running the TwinThink MCP server via `python -m twinthink.mcp`.
"""

from .server import run_stdio_server

if __name__ == "__main__":
    run_stdio_server()
