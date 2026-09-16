#!/usr/bin/env bash
# TwinThink Local Development Launcher (Bash)
# Starts the FastAPI backend (:8001) and Next.js frontend (:3000)

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo ">>> Starting TwinThink API on http://127.0.0.1:8001..."
python3 apps/api/main.py &
API_PID=$!

sleep 2

echo ">>> Starting TwinThink Web on http://localhost:3000..."
(cd apps/web && npm run dev) &
WEB_PID=$!

cleanup() {
    echo "Stopping TwinThink stack..."
    kill "$WEB_PID" "$API_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "=================================================="
echo " TwinThink Stack Running:"
echo "   API: http://127.0.0.1:8001 (Docs: /docs, Health: /health)"
echo "   Web: http://localhost:3000"
echo " Press Ctrl+C to stop both processes."
echo "=================================================="

wait
