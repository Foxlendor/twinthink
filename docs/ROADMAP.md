# TwinThink Product & Engineering Roadmap

## Milestone Status Overview

| Milestone | Title | Status | Primary Focus |
|---|---|---|---|
| **M0** | **Environment & Startup Repair** | ✅ **Completed** | Fixed missing typing imports, resolved `twinthink.reality` package collisions, added automatic SQLite schema setup. |
| **M1** | **Foundation & Creator Storage** | ✅ **Completed** | Persistent local SQLite + bundle storage, unique IDs, owner-token authorization, de-RESIP ingestion, genuine calibration & error metrics, export & re-import roundtrip, restart persistence. |
| **M2** | **Canonical Hierarchical Product Graph** | ✅ **Completed** | Structural BOM tree backbone with attached engineering domains (material, manufacturing, recursive cost rollups, provenance history, declared rights intent, and role-filtered DPP projection previews). Passed 14/14 acceptance criteria. |
| **M3** | **Identity, Private Access & Cryptographic Rights** | ✅ **Completed** | Asymmetric keypairs (Ed25519), did:twin identities, signed revision chains, capability tokens, AES-256-GCM envelope encryption, rights inheritance, and 100% offline portable .twin verification. Passed 20/20 acceptance criteria. |
| **M4** | **Universal TwinThink Tooling & Integrations** | ✅ **Completed** | Unified `TwinService` canonical protocol layer, complete `tt` CLI surface (`twin`, `bom`, `access`, `evidence`, `provenance`, `dpp`), zero-dependency JSON-RPC stdio MCP server (`tt mcp` / `python -m twinthink.mcp`), and verified multi-client state equivalence across CLI, MCP, and Web/API. |
| **M5** | **P2P NDA & Cryptographic IP Paywalls** | 📋 Scheduled | Blind catalog profile views, no-search direct-link access, dynamic P2P NDA signing, escrow payment integration (Stripe/Simulated). |
| **M6** | **2027 EU Digital Product Passport (DPP) Compliance Exports** | 📋 Scheduled | Formal EU Regulation 2023/1542 battery passport compliance dossier integration, third-party conformity assessment bridge, open JSON-LD / GS1 interoperability. |
| **M7** | **Crowdfunding & Data Royalty Rewards Pilots** | 📋 Scheduled | Point-of-sale micro-roundup treasury, browser extension privacy wrapper, data revenue dividend payouts. |

---

## Detailed Milestone Breakdown

### ✅ M0: Environment & Startup Repair (Completed)
- **Typing & Module Resolution**: Added missing typing imports (`List`, `Dict`, `Optional`, `Any`) in `apps/api/main.py`.
- **Reality Package Structure**: Resolved module shadowing where `packages/twinthink/reality.py` conflicted with the `packages/twinthink/reality/` directory. Moved legacy code to `legacy_scoring.py` and provided `packages/twinthink/reality/__init__.py`.
- **CLI Validator Exit Code**: Corrected exit code logic in `packages/twinthink/validator.py` so missing or corrupted bundles return code 1 instead of 0.
- **Calibration Precision**: Fixed `r_squared` calculation in `packages/twinthink/simulation/calibration.py` to prevent incorrect constant predictions from receiving a perfect R² of 1.0.

### ✅ M1: Foundation & Creator Storage (Completed)
- **Default Local Storage**: Configured persistent storage at `apps/api/storage/` (`twinthink.db`, `bundles/`, `extracted/`) with environment override `TT_STORAGE_DIR`.
- **Distinct Creator Records**: Factory creation `/api/twins/create` generates non-colliding unique IDs and saves records directly to SQLite and disk.
- **De-RESIP Ingestion**: Removed hardcoded RESIP™ drink straw dimensions (`16x16x220mm`, `45g`), SAT salt phase-change claims, and invented `1.60` RMSE values. Replaced with objective evaluation based strictly on uploaded artifacts.
- **Ownership & Access Control**: Issued `owner_token` upon creation. Protected `PATCH /api/twins/{id}` and telemetry upload `POST /api/twins/{id}/tests` with owner token verification (returns 403 when unauthorized).
- **Bundle Export & Re-import**: Verified `/api/twins/{id}/download` produces a complete zip with derived `manifest.json`, which can be re-imported via `/api/twins/upload` as a distinct record.
- **Restart Persistence**: Proved that all records, edits, and authorization privileges persist across server restarts via automated two-phase live verifier (`scripts/verify_foundation.py`).
- **Web UI Integration**: Updated `CreateTwinModal.tsx` to support creator identity, store ownership tokens in `localStorage`, and navigate directly to `/twins/${createdTwinId}`. Updated Next.js `/api/twins/[id]` proxy to serve backend twins seamlessly.

### ✅ M2: Canonical Hierarchical Product Graph (Completed)
- **Structural Tree Backbone**: Established `BomNode` hierarchy as the canonical physical spine (`assembly`, `subassembly`, `component`, `raw_material`, `fastener`).
- **Attached Engineering Domains**: Typed records attached directly to structural nodes:
  - Material domain: `MaterialSpec` (grade, standard, origin country, recycled content %).
  - Manufacturing domain: `ManufacturingSpec` (process, finish, tolerances, processing cost).
  - Cost domain: `CostSpec` ($extended = unit \times qty$, bottom-up recursive rollups, honest missing quote preservation).
- **Provenance History**: `ProvenanceEntry` records logging capture tool (`tt`, `cad_step`, `web_factory`), SHA-256 artifact hash, creator attribution, and timestamp.
- **Declared Rights Policy**: `declared_rights_mode` (`Private`, `Licensed`, `Open Development`, `Public Domain Dedication`, `Conditional Release`) established as creator intent (not automatic legal warranty), with component-level overrides.
- **14/14 Acceptance Criteria Verified**:
  1. 3-level BOM tree creation
  2. 5+ sibling components under single assembly
  3. Recursive cost rollup calculation ($extended = unit \times qty + assembly\ costs$)
  4. Unit vs extended cost preservation
  5. Stable node IDs across operations
  6. Orphan node detection (`OrphanBomNodeError`)
  7. Cycle rejection (`CyclicBomError`)
  8. Revision lineage preservation (`R0` $\to$ `R1` $\to$ `R2`)
  9. Material/process/cost/provenance attachments
  10. Graph bundle export (.zip)
  11. Graph bundle re-import
  12. Hash-equivalent round-trip structure (`compute_bom_structural_hash`)
  13. Restart persistence
  14. Ingestion parity across CSV, JSON, and `tt wrap`
- **Role-Filtered DPP Projection Previews**: Implemented `project_dpp` supporting Public, Recycler, and Authority tiers with mandatory uncertified preview disclaimer.
- **Web UI Lifecycle Inspector & DPP Modal**: Built interactive node drawer and multi-tier DPP projection modal into `apps/web/src/components/tabs/BomTab.tsx`.

### ✅ M3: Identity, Private Access & Cryptographic Rights (Completed)
- **Asymmetric Cryptographic Identity**: Ed25519 keypairs with canonical `did:twin:<hex_pubkey>` identifiers. Public Identity Documents are exportable and registerable; private keys remain strictly client-side.
- **Signed Revision Chains**: Mutations form cryptographically signed revision records (R0 -> R1 -> R2), binding canonical product graph hashes, author identities, and commit hash lineage.
- **Capability-Based Access Control**: Granular segment-level capability tokens (`read:design`, `read:bom`, `read:manufacturing`, `read:evidence`, etc.) signed by issuers with instant revocation checks.
- **AES-256-GCM Envelope Encryption**: Sensitive graph segments (design, CAD, financials, evidence) are encrypted with symmetric keys and wrapped for authorized recipient X25519 keys via ephemeral ECDH + HKDF.
- **Declared Rights Inheritance**: Modeled five declared distribution modes (`Private`, `Licensed`, `Open Development`, `Public Domain Dedication`, `Conditional Release`) with recursive inheritance down the BOM and component-level overrides.
- **Standardized `.twin` Bundle Format**: Standardized directory structure (`manifest.json`, `identity/`, `graph/`, `revisions/`, `signatures/`, `rights/`, `provenance/`, `public/`, `encrypted/`).
- **100% Offline Bundle Verification**: `tt verify bundle.twin` validates identity documents, creator signatures, revision chain continuity, graph hash matching, and provenance entries completely offline without network access.
- **Passed 20/20 Acceptance Criteria**: Verified across unit tests, API integration tests, and CLI workflows.

### ✅ M4: Universal TwinThink Tooling & Integrations (Completed)
- **Canonical `TwinService` Layer**: Established the single source of truth (`packages/twinthink/service.py`) executing all twin lifecycle mutations, BOM evaluations, cryptographic signatures, capability governance, and portable bundles.
- **Unified `tt` CLI Surface**: Complete taxonomy implemented in `apps/api/tt.py`:
  - `tt twin [create|inspect|edit|sign|verify|export|import]`
  - `tt bom [inspect|validate]`
  - `tt access [grant|revoke]`
  - `tt evidence attach`
  - `tt provenance show`
  - `tt dpp preview`
  - `tt mcp`
- **Zero-Dependency JSON-RPC 2.0 MCP Server**: Pure stdio protocol server (`packages/twinthink/mcp/`) exposing 14 tools (`twin_create`, `twin_inspect`, `twin_edit`, `twin_sign`, `twin_verify`, `twin_export`, `twin_import`, `bom_inspect`, `bom_validate`, `access_grant`, `access_revoke`, `evidence_attach`, `provenance_show`, `dpp_preview`). Directly launchable via `tt mcp` or `python -m twinthink.mcp`.
- **Multi-Client State Equivalence**: Automated tests prove that twins created via CLI, signed via MCP, and queried via API/Web operate on the exact same graph hashes, signature chains, and rolled-up BOM structures.
- **Full Test Suite & Web Build Verified**: 71/71 tests passing across M0-M4 with 0 errors on production Next.js build.

### 📋 M5: P2P NDA & Cryptographic IP Paywalls
- Blind catalog discovery links (direct creator links without global search).
- Cryptographic P2P Non-Disclosure Agreements with digital signatures before decryption key release.
- Escrow payment gate (one-time unlocks and creator vault subscriptions).

### 📋 M6: 2027 EU Digital Product Passport (DPP) Compliance Exports
- Implementation of EU Regulation 2023/1542 battery passport data structures.
- Export interoperable JSON-LD and GS1 compliant QR data carriers for material recycling, repairability, and carbon footprints.

### 📋 M7: Crowdfunding & Data Royalty Rewards Pilots
- POS micro-roundup treasury pool ("Think Twice").
- Browser extension privacy wrapper to negotiate data dividends from AI search and training loops.
