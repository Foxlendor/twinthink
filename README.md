# TwinThink

TwinThink is an open platform for compiling, validating, and sharing living digital twins of physical inventions, CAD designs, bills of materials (BOM), and physical sensor telemetry.

---

## Quick Start (Tested Launch Commands)

### 1. Launch Both API & Web Concurrently
On Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-stack.ps1
```
On Linux / macOS (Bash):
```bash
./scripts/dev-stack.sh
```

- **API**: [http://127.0.0.1:8001](http://127.0.0.1:8001) (API Docs: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs))
- **Web UI**: [http://localhost:3000](http://localhost:3000)

---

## Running Individually

### API Server
```powershell
# Default storage at apps/api/storage/ (or set TT_STORAGE_DIR)
python apps/api/main.py
```
- Operates in **local mode** using SQLite (`twinthink.db`) and local disk storage for bundles and extracted assets.
- No cloud credentials (S3/Postgres) required for local development.

### Web Application
```powershell
cd apps/web
npm install
npm run dev
```

---

## Testing & Verification

### Run Automated Unit & Integration Tests
```powershell
# Run the 9 foundation tests covering M0 & M1
python -m pytest apps/api/tests/test_foundation.py -v

# Run physics simulation tests
python -m pytest packages/twinthink/simulation/test_simulation.py -v
```

### Run Live End-to-End Persistence Verifier
```powershell
# Phase 1: Creates two distinct creator-owned twins, edits one, tests 403 access control, exports and re-imports
python scripts/verify_foundation.py --api http://127.0.0.1:8001

# (Kill and restart your API server process)

# Phase 2: Verifies that twins, creator records, edited titles, and ownership permissions persist across server restarts
python scripts/verify_foundation.py --api http://127.0.0.1:8001 --phase2
```

---

## Architecture & Milestones

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the complete milestone schedule:
- **M0 & M1**: Foundation, Startup Repair, Local SQLite Storage, Creator Ownership, De-RESIP Ingestion (**Completed**)
- **M2**: Granular Hierarchical BOM & Cost Engine
- **M3**: Account-Based Private Access & Key Management
- **M4**: Universal CLI Wrapper (`tt-wrap`) & Antigravity MCP Integration
- **M5**: P2P NDA & Cryptographic IP Paywalls
- **M6**: 2027 EU Digital Product Passport (DPP) Compliance Exports
- **M7**: Crowdfunding & Data Royalty Rewards Pilots
