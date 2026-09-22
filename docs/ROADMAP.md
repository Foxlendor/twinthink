# TwinThink Product & Engineering Roadmap

## Milestone Status Overview

| Milestone | Title | Status | Primary Focus |
|---|---|---|---|
| **M0** | **Environment & Startup Repair** | ✅ **Completed** | Fixed missing typing imports, resolved `twinthink.reality` package collisions, added automatic SQLite schema setup. |
| **M1** | **Foundation & Creator Storage** | ✅ **Completed** | Persistent local SQLite + bundle storage, unique IDs, owner-token authorization, de-RESIP ingestion, genuine calibration & error metrics, export & re-import roundtrip, restart persistence. |
| **M2** | **Canonical Hierarchical Product Graph** | ✅ **Completed** | Structural BOM tree backbone with attached engineering domains (material, manufacturing, recursive cost rollups, provenance history, declared rights intent, and role-filtered DPP projection previews). Passed 14/14 acceptance criteria. |
| **M3** | **Identity, Private Access & Cryptographic Rights** | ✅ **Completed** | Asymmetric keypairs (Ed25519), did:twin identities, signed revision chains, capability tokens, AES-256-GCM envelope encryption, rights inheritance, and 100% offline portable .twin verification. Passed 20/20 acceptance criteria. |
| **M4** | **Universal TwinThink Tooling & Integrations** | ✅ **Completed** | Unified `TwinService` canonical protocol layer, complete `tt` CLI surface (`twin`, `bom`, `access`, `evidence`, `provenance`, `dpp`), zero-dependency JSON-RPC stdio MCP server (`tt mcp` / `python -m twinthink.mcp`), and verified multi-client state equivalence across CLI, MCP, and Web/API. |
| **M5** | **P2P NDA & Cryptographic IP Paywalls** | ✅ **Completed** | Blind catalog profile views, no-search direct-link access, dynamic P2P NDA signing, zero-dollar AVS card authorization, encrypted vault decryption. |
| **M6** | **2027 EU Digital Product Passport (DPP) Compliance Exports** | ✅ **Completed** | EU Ecodesign / ESPR compliant JSON-LD dossier exports, role-filtered previews (Public, Recycler, Authority). |
| **M7** | **Crowdfunding & Honest IP Royalty Distribution** | ✅ **Completed** | Albuquerque physical prototype tooling campaigns ("Think Twice" POS roundup), direct-to-inventor 85% royalty split guarantee, and automated commercial production licensing covenants. |

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

### ✅ M5: P2P NDA & Cryptographic IP Paywalls (Completed)
- Blind catalog discovery links (`/pitch`, `?pitch=TOKEN`) allowing private investor sharing without public search index leakage.
- Cryptographic P2P Mutual Non-Disclosure Agreement execution with downloadable signed covenants (.txt).
- Zero-Dollar Stripe AVS card verification with instant sandbox token fallback for seamless local/dev verification.
- Encrypted engineering vault holding parametric .STEP solids, tooling G-code, and granular supplier pricing.

### ✅ M6: 2027 EU Digital Product Passport (DPP) Compliance Exports (Completed)
- Implementation of EU Regulation 2023/1542 and Ecodesign (ESPR) digital product passport schemas.
- Interactive multi-tier role-filtered projections (Public, Recycler, Authority) with strict non-certified preview safeguards.
- 1-Click export of W3C / GS1 compatible `application/ld+json` compliance dossiers with cryptographic acyclic structural verification.

### ✅ M7: Crowdfunding & Honest IP Royalty Distribution (Completed)
- **The Three Pillars of Invention Funding on TwinThink**:
  1. *Direct Crowdsource & Tooling Pre-Orders*: Direct-to-inventor micro-patronage and the Goldilocks Zone retail dividend kickbacks.
  2. *Corporate R&D Bounties & Think Tanks* (`/bounties`): The Indeed-style job board for hard engineering bottlenecks (Intel, Dyson, 3M, Tesla) where multidisciplinary inventor think tanks submit digital twin solutions to win escrowed funding ($30k–$100k).
  3. *POS Roundups & Monthly Inventor Grant Lottery Pool* (`/roundup`): Point-of-sale micro-change rounded up from countertop stands, awarding lottery tickets per 50¢ and releasing the monthly treasury to an active hardware inventor.
- **The Dual-Sided Google Review Countertop Stand Hustle**: Free countertop stands provided to restaurants and cafes ($50 retail value saved for venue). Side A captures 5-star Google reviews in 2 seconds; Side B captures Apple Pay / QR tap-to-roundup micro-donations into the monthly inventor treasury.
- **The IP Kiosk & Patron Royalty Piggy Bank**: Physical counter display and online kiosk (`/roundup`) allowing citizens to allocate their tax/patronage dollars into specific inventions rather than government black boxes.
- **The Goldilocks Zone (Money In = Money Out or More)**: Prototype tooling backers enter the pro-rata retail dividend pool; early sales cash flows return capital back to patron wallets before protocol profits.
- **Open to View, Community-Backed to Build**: 100% free public inspection without discovery paywalls; payments are strictly for physical tooling backing and commercial licensing.
- **The Community Forking Guarantee**: If an inventor creates a digital twin and development goes inactive for > 12 months, any community member retains the guaranteed right to FORK the twin, inherit the tooling/CAD files, and manufacture it.
- **Physical Prototype Tooling Campaign Bars** (`CampaignBar.tsx`) embedded directly into twins (Redrink, TWIIZZLock, Specimen 0001) tracking real batch tooling funding goals, backer provenance, and royalty kickback tiers.
- **Commercial Production & Hardware Royalty Licensing Engine** (`AccessModal.tsx` Tier 4) with 85% creator profit guarantee (`did:twin:johne.boi`), 10% prototype pool, 5% protocol escrow, and instant signed legal covenants.
- **Interactive 2015-2026 Inventor Laboratory Notebook Easter Egg** (`InventorNotebookModal.tsx`) with authentic lore, quotes, and interactive witness ink stamp.
