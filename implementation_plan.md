# TwinThink Foundation (M0 & M1) Implementation Plan

Complete milestones M0 and M1 for TwinThink: repair startup and configuration, establish persistent local storage, make Create Twin save and reopen a distinct creator-owned record, eliminate invented measurements and RESIP-specific assumptions from general ingestion, add meaningful validation and ownership checks, verify persistence and access control across restarts, and wire the working web interface.

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions:**
> 1. **Local Persistent Mode as Default**: The API will operate without requiring cloud credentials (Postgres/S3). It will store SQLite data at `apps/api/storage/twinthink.db` (overrideable via `TT_STORAGE_DIR`) and assets in `bundles/` and `extracted/`.
> 2. **Package Collision Resolution**: `packages/twinthink/reality.py` currently conflicts with the `packages/twinthink/reality/` folder, causing Python to fail to import `twinthink.reality.calculator`. We will move `reality.py` to `packages/twinthink/reality/legacy_scoring.py` and create `packages/twinthink/reality/__init__.py`.
> 3. **Ownership Model**: When a twin is created via the factory `/api/twins/create` or `/api/twins/upload`, the response includes a distinct `id` and a unique `owner_token`. Editing twin metadata (`PATCH /api/twins/{id}`) or uploading telemetry (`POST /api/twins/{id}/tests`) requires this token (via `X-Twin-Owner-Token` header or `owner_token` form/body field). Unauthorized attempts receive HTTP 403.
> 4. **No Real Money / No Deployment**: All tests and execution will strictly use local fixtures and local simulated storage.

## Proposed Changes

### Core Python Packages (`packages/twinthink/`)

#### [MODIFY] [packages/twinthink/reality/](file:///C:/Users/Foxle/Downloads/twinth.ink/packages/twinthink/reality)
- Move `packages/twinthink/reality.py` -> `packages/twinthink/reality/legacy_scoring.py`.
- Add `packages/twinthink/reality/__init__.py` exporting `derive_reality_state`.
- Update `packages/twinthink/reality/calculator.py` to remove hardcoded RESIP assumptions (no references to SAT salt, 316L, FDA/LFGB, or $4.50 prices); calculate reality state objectively from uploaded CAD, ODE, telemetry, claims, and BOM data.

#### [MODIFY] [packages/twinthink/factory/engine.py](file:///C:/Users/Foxle/Downloads/twinth.ink/packages/twinthink/factory/engine.py)
- Remove all invented RESIP measurements (e.g. bounding box `[16, 16, 220]`, mass `45g`, SAT activation temperature, latent heat capacity, hardcoded sensor channels, and invented `calibration_rmse=1.60`).
- If real simulation results and measured telemetry are present in the bundle, calculate real error metrics (RMSE, MAE, R²) using `calculate_error_metrics`.
- If physical testing or simulation is absent, mark calibration as `None` and label missing fields as unknown or conceptual.
- Accept custom creator name, licensing, and version.

#### [MODIFY] [packages/twinthink/validator.py](file:///C:/Users/Foxle/Downloads/twinth.ink/packages/twinthink/validator.py)
- Fix CLI exit code bug in `__main__`: check `success is True` so non-existent files or validation error strings correctly return non-zero exit code (1), rather than treating truthy error strings as success.
- Enforce strict zip traversal checks (`..` and leading `/` sanitization).

#### [MODIFY] [packages/twinthink/simulation/calibration.py](file:///C:/Users/Foxle/Downloads/twinth.ink/packages/twinthink/simulation/calibration.py)
- Fix R² calculation when total sum of squares (`ss_tot`) is zero (e.g. constant measured value): return 1.0 only if residual error is also 0, otherwise 0.0 (preventing incorrect constant predictions from receiving perfect R²).

---

### Backend API (`apps/api/`)

#### [MODIFY] [apps/api/main.py](file:///C:/Users/Foxle/Downloads/twinth.ink/apps/api/main.py)
- Add missing typing imports (`List`, `Dict`, `Optional`, `Any`).
- Initialize persistent SQLite schema on startup (`twins`, `twin_files`, `twin_tests`) inside `STORAGE_DIR`.
- Replace `count + 1` ID generation with unique IDs (e.g., 4-character hex or collision-free sequential IDs).
- Store `creator` and cryptographic hash of `owner_token` in `twins` table.
- In `/api/twins/create`:
  - Run bundle through `TwinFactoryEngine.process_bundle`.
  - Derive a valid `manifest.json` from the resulting `TwinDocument`.
  - Save the zip bundle to `bundles/{id}.zip` and extract to `extracted/{id}/`.
  - Store metadata and document in SQLite.
  - Return `id`, `owner_token`, `discovery`, and `twin`.
- In `/api/twins/{id}/download`:
  - Ensure exported bundle includes the derived `manifest.json` and all extracted assets, ensuring exported bundles can be re-imported via `/api/twins/upload`.
- Add `PATCH /api/twins/{id}` to allow creators to edit title, summary, or metadata with `owner_token` verification (403 if missing or wrong token, 404 if not found).
- Protect `POST /api/twins/{id}/tests` with `owner_token` verification.

---

### Frontend Web App (`apps/web/`)

#### [MODIFY] [apps/web/src/components/CreateTwinModal.tsx](file:///C:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/CreateTwinModal.tsx)
- Add creator field or support passing creator identity.
- On successful creation, capture returned `id` and `owner_token` (store in `localStorage` for ownership tracking).
- Update "Review Twin" action button to navigate to `/twins/${createdTwinId}` instead of hardcoded `/twins/0001`.
- Display real error messages if creation fails instead of swallowing errors and presenting a mock RESIP report.

#### [MODIFY] [apps/web/src/app/api/twins/[id]/route.ts](file:///C:/Users/Foxle/Downloads/twinth.ink/apps/web/src/app/api/twins/[id]/route.ts)
- Proxy `GET /api/twins/{id}` to the backend API first (`http://127.0.0.1:8001/api/twins/{id}`).
- Fall back to static mock twins (0002/0003) only if the backend returns 404 or is offline.

---

### Tests and Verification Tools (`apps/api/tests/`, `scripts/`, `docs/`)

#### [NEW] [apps/api/tests/test_foundation.py](file:///C:/Users/Foxle/Downloads/twinth.ink/apps/api/tests/test_foundation.py)
- Comprehensive test suite covering:
  - Startup without cloud credentials.
  - Two independent twin creations produce distinct IDs, distinct owners, and distinct files.
  - Creator edits with valid token succeed; invalid/missing tokens receive 403; unknown twin receives 404.
  - Real calibration only computed when both simulation and test series exist; missing data is honest `None`.
  - Exported factory twin downloads valid zip that re-imports cleanly through `/api/twins/upload`.
  - Zip-Slip / path traversal attempts are rejected.
  - Validator CLI returns code 1 on missing bundle.

#### [NEW] [scripts/verify_foundation.py](file:///C:/Users/Foxle/Downloads/twinth.ink/scripts/verify_foundation.py)
- Standalone Python verification script for two-phase live verification:
  - Phase 1: Create Twin 1 (Alice), Create Twin 2 (Bob), verify independent records, edit Twin 1, test 403 denial with Bob's token and invalid tokens, export Twin 1, re-import as Twin 3. Save state to `verify_state.json`.
  - Phase 2 (after server restart): Reconnect, verify Twin 1 and Twin 2 are still present with edited values, verify ownership check still enforces edit rights.

#### [NEW] [scripts/dev-stack.ps1](file:///C:/Users/Foxle/Downloads/twinth.ink/scripts/dev-stack.ps1) & [scripts/dev-stack.sh](file:///C:/Users/Foxle/Downloads/twinth.ink/scripts/dev-stack.sh)
- One-command launcher for both API (port 8001) and Web UI (port 3000) for development.

#### [NEW] [docs/ROADMAP.md](file:///C:/Users/Foxle/Downloads/twinth.ink/docs/ROADMAP.md)
- Roadmap documenting Foundation (M0 & M1) completed, and tracking later milestones:
  - M2: Granular Hierarchical BOM & Cost Engine
  - M3: Account-Based Private Access & Key Management
  - M4: Universal CLI Wrapper (`tt-wrap`) & Antigravity MCP Integration
  - M5: P2P NDA & Cryptographic IP Licensing Paywalls
  - M6: 2027 EU Digital Product Passport (DPP) Compliance Exports
  - M7: Crowdfunding & Data Royalty Rewards Pilots

## Verification Plan

### Automated Tests
- Run full pytest test suite:
  ```powershell
  python -m pytest apps/api/tests/test_foundation.py -v
  ```

### Live End-to-End Verification
1. Launch API server locally in background.
2. Run `scripts/verify_foundation.py` (Phase 1).
3. Kill API server process.
4. Restart API server process.
5. Run `scripts/verify_foundation.py --phase2` to confirm complete restart-persistence.
6. Verify Web interface proxy responds to created twin ID.
