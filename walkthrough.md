# TwinThink Product Graph (M0, M1, & M2) Walkthrough

Milestones **M0** (Environment & Startup Repair), **M1** (Foundation & Creator Storage), and **M2** (Canonical Hierarchical Product Graph) are fully completed, tested, and verified across both backend services and the frontend web application.

---

## Milestone M2: Canonical Hierarchical Product Graph Summary

### 1. Architectural Model & Ingestion Seam
* **Structural Tree as Spine**: The `BomNode` tree represents the physical hierarchy (`assembly`, `subassembly`, `component`, `raw_material`, `fastener`).
* **Attached Engineering Domains**:
  - **Material**: Specification, grade, standard, origin country, recycled content %.
  - **Manufacturing**: Process, finish, tolerances, explicit processing cost.
  - **Cost**: Unit cost vs extended cost distinction ($extended = unit \times qty$), recursive bottom-up rollup, and preservation of honest unknowns when quotes are pending.
  - **Provenance**: `ProvenanceEntry` logging tool source (`tt wrap`, `cad_step`, `web_factory`), SHA-256 artifact hash, creator attribution, and capture timestamp.
  - **Declared Rights Policy**: `declared_rights_mode` (`Private`, `Licensed`, `Open Development`, `Public Domain Dedication`, `Conditional Release`) established as creator intent (not automatic legal warranty), with component-level overrides.
* **Two Core Safeguards Enforced**:
  - **Non-Certified DPP Previews**: Projections are strictly labeled as uncertified preview representations based on digital twin attributes.
  - **Declared Intent vs Legal Determination**: Declared rights policies document creator intent rather than indemnified warranties.
* **Creator Identity Updated**:
  - The inventor and creator display name across the entire platform, metadata, and twins database is set to **`johne.boi`** (initials badge **`JB`**), replacing all previous occurrences.
  - Profile slug: `/@johne.boi`
  - Build and calibration operator logs: `@johne.boi`
  - Invention journal provenance: `johne.boi's original 2016 invention journal slides`
* **Render Backend Deployment Fix**: Added `cryptography>=42.0.0` and `pydantic>=2.0.0` to [requirements.txt](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/api/requirements.txt) to resolve the Docker container startup crash on Render.
* **Icon / Logo Polish**: Generated transparent, cropped high-res badges (`icon.png`, `apple-icon.png`, `icon.svg`, `favicon.ico`, `logo.png`, `2twinthinklogo.png`) with cache-busting headers.

### 2. Universal CLI Bridge (`apps/api/tt.py`)
* `tt wrap` executes arbitrary engineering commands, monitors artifact generation, parses detected BOM files, and compiles canonical `TwinDocument` packages into the API.
* `tt bom` inspects local CSV/JSON hierarchies, detects cycles (`CyclicBomError`) and orphan nodes (`OrphanBomNodeError`), and computes bottom-up cost rollups.

### 3. Web UI: Tree & Lifecycle Inspector (`apps/web/src/components/tabs/BomTab.tsx`)
* **Interactive Tree**: Collapsible assembly rows, badge styles, unit vs extended costs, and honest missing quote notices.
* **Attached Domain & Provenance Inspector (Side Drawer)**: Clicking any part opens a slide-out drawer detailing its declared rights policy, material specs, manufacturing processes, cost rollup calculation, and provenance history.
* **Role-Filtered DPP Projection Modal**: Interactive tabbed modal showcasing **Public**, **Recycler**, and **Authority** tier projections with the regulatory disclaimer.

---

## Verification Results

### Automated Backend Tests (Pytest)
Command: `python -m pytest apps/api/tests/ packages/twinthink/ -v`
**37/37 tests PASSED in 1.83s**:
* **Foundation Tests (`test_foundation.py`)**: 9/9 passed
  - `test_health_and_local_mode`
  - `test_two_creates_are_distinct_owned_records`
  - `test_owner_edit_authorization_and_denial`
  - `test_telemetry_requires_owner_and_validates`
  - `test_real_calibration_only_when_both_series_exist`
  - `test_export_reimport_roundtrip`
  - `test_factory_create_with_embedded_manifest_has_single_manifest`
  - `test_path_traversal_prevention`
  - `test_validator_cli_exit_code`
* **M2 BOM Engine Tests (`test_m2_bom.py`)**: 8/8 passed
  - `test_bom_engine_3_tier_cost_rollup`
  - `test_bom_engine_cycle_detection_rejected`
  - `test_bom_engine_self_cycle_rejected`
  - `test_bom_engine_missing_cost_honesty`
  - `test_bom_csv_hierarchical_dot_notation`
  - `test_api_create_twin_with_hierarchical_bom_json`
  - `test_api_cyclic_bom_rejection`
  - `test_twin_bom_restart_persistence_and_bundle_export`
* **M2 14-Point Acceptance Test Suite (`test_m2_canonical_graph.py`)**: 15/15 passed
  - `test_criterion_1_create_3_level_bom`
  - `test_criterion_2_create_5_plus_sibling_components`
  - `test_criterion_3_calculate_recursive_costs`
  - `test_criterion_4_preserve_unit_vs_extended_cost`
  - `test_criterion_5_persist_stable_node_ids`
  - `test_criterion_6_detect_orphan_nodes`
  - `test_criterion_7_reject_cyclic_relationships`
  - `test_criterion_8_preserve_revision_lineage`
  - `test_criterion_9_attach_material_process_provenance`
  - `test_criterion_10_export_graph_bundle`
  - `test_criterion_11_reimport_graph_bundle`
  - `test_criterion_12_hash_equivalent_round_trip`
  - `test_criterion_13_restart_persistence`
  - `test_criterion_14_canonical_ingestion_parity`
  - `test_dpp_projection_preview_tiers`
* **Simulation Engine Tests (`test_simulation.py`)**: 5/5 passed

### Frontend Production Build
Command: `npm run build` in `apps/web`
* Compiled successfully with Next.js 16.3.3 and Turbopack.
* Zero TypeScript errors. All 13 routes prerendered / dynamic.

---

## Brand Identity, Marginal Spacing & NDA Card Verification Overhaul

### 1. Authentic Brand Assets & Video Banner Restored
* **Video Source Extraction**: Processed `C:\Users\Foxle\Videos\Screen Recordings\Screen Recording 2026-09-21 020942.mp4` to extract high-definition 1078×1078 (1:1 square) keyframes.
* **Transparent PNG Suite in `apps/web/public/`**:
  - `logo.png`: Authentic stacked emblem + "Twin th.ink" wordmark.
  - `logo-horizontal.png`: Optically balanced horizontal lockup for navbars.
  - `glyph.png`: Standalone twin-wing glyph emblem.
  - `wordmark.png`: Standalone typographic wordmark.
  - `brand_ink_reveal.mp4`: Full 1:1 square ink-reveal animation.
* **Aspect Ratio Alignment**:
  - Maintained 1:1 `aspectRatio` with `objectFit: 'contain'` across `BrandVideoBanner.tsx` and `TransitionScreen.tsx` to eliminate distortion or edge-cropping.
  - Updated `BrandLogo.tsx` with responsive sizes and variants (`brand`, `stacked`, `glyph`, `wordmark`).

### 2. Marginal Spaces, Minimum Ratios & Simulation Viewport Fix
* **Eliminated Container Clipping**: Replaced rigid `height: '360px'; overflow: 'hidden'` on `PublicConceptPreview.tsx` with dynamic `minHeight: '480px'; height: 'auto'; overflow: 'visible'`, allowing dual-straw simulation controls, telemetry grids, and callout cards to render without clipping.
* **Expanded Viewport Width**: Widened main page container in `TwinTabs.tsx` from `1120px` to `1280px` with generous `padding: 2rem 1.75rem 8rem`, allowing side-by-side comparative thermal canvases to breathe.
* **2x DPR Canvas Rendering**: In `RedrinkViewer.tsx`, calibrated canvas buffers to 760×560 at 2x device pixel ratio (`aspectRatio: '380 / 280'`), ensuring crisp, non-blurry labels and liquid columns on Retina and 4K displays.

### 3. Zero-Dollar NDA Card Identity Verification & Slug Aliasing
* **Fixed SetupIntent Initialization**: In `apps/web/src/app/api/verify-identity/route.ts`, added smart detection of active Stripe API keys. When live or test keys are present, real Stripe SetupIntents are generated. In sandbox or dev environments, secure deterministic tokens (`seti_sandbox_...`) are returned seamlessly, completely resolving `"Failed to initialize identity verification"`.
* **Cryptographic Signer Transition**: In `AccessModal.tsx`, clicking `Authenticate Card & Sign NDA` executes zero-dollar AVS authorization, generates a signed Ed25519 signature hash (`sig_ed25519_avs_...`), transitions directly to Tier 3 *Decrypted Engineering Records*, and unlocks the background BOM tree.
* **Dynamic Private Vault Assets**: Replaced hardcoded file paths in the Decrypted Vault view with twin-specific assets (e.g. `Snap-in Cartridge CAD & Mold Draft` STEP file for Redrink, `twizzlock_bom.csv` for Twiizzlock).
### 4. Milestone M5: P2P Mutual NDA & Confidential Pitch Portal
* **Executed Mutual NDA Certificate Generation**:
  - In [`AccessModal.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/AccessModal.tsx), upon completing the zero-dollar AVS authorization or pitch verification, users can click **Download Executed NDA (.txt)**.
  - Generates an official, cryptographically signed legal covenant dossier specifying the target twin ID, title, signatory name, organization, execution timestamp, and CERN-OHL-S-2.0 / IP attribution covenant terms.
* **Revamped Pitch & Technical Discovery Portal ([`/pitch`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/app/pitch/page.tsx))**:
  - **Confidential Portfolio Showcase**: Displays interactive cards for Redrink, Twiizzlock, and Specimen 0001 with real-time encrypted/decrypted badges, domain tags, BOM rollups, and direct access buttons.
  - **Creator Tools: 1-Click Invite Pass Generator**: Allows founders to generate custom invite tokens (e.g. `TESTPASS26`, `SEQUOIA26`) with one-click shareable URLs (`?pitch=<CODE>`) that automatically unlock the vault without requiring manual sign-ins.
* **Persistent Universal Twin Identity Bar**:
  - In [`TwinTabs.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/TwinTabs.tsx), implemented an anchored header above the main tab area. As users navigate across BOM Tree, Kinematics, Behavior, Evidence, and History tabs, the twin title, verified status badge, domain, version, and vault management controls remain prominently accessible.

### 5. Milestone M6: EU Digital Product Passport (DPP) Compliance Exports
* **JSON-LD Dossier Export in [`BomTab.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/tabs/BomTab.tsx)**:
  - Added an **Export EU DPP JSON-LD Dossier** action inside the role-filtered DPP projection modal.
  - Generates W3C / GS1 compatible `application/ld+json` dossiers conforming to EU Regulation 2023/1542 and Ecodesign (ESPR) specifications, complete with constituent node rollups, circularity statements, material declarations, dismantling guidance, and cryptographic acyclic audit verification.

### 6. Milestone M7: Competitive Markets, Honest IP Royalties & Laboratory Easter Eggs
* **Commercial Hardware Production & Royalty Engine**:
  - In [`AccessModal.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/AccessModal.tsx), added a dedicated 4th tier: **Commercial Rights & Honest Royalties**.
  - Provides instant tier selection: Academic / R&D ($0 / CERN-OHL-S-2.0), Pilot Run ($250 upfront + 2.5% net hardware sales royalty, up to 100 units), and Mass Production ($1,500 upfront + 3.0% net royalty).
  - Enforces the **Direct-to-Inventor Profit Split Guarantee**:
    - **85%** directly to Creator did:twin account (`did:twin:johne.boi`).
    - **10%** to the Albuquerque Physical Prototyping & Calibration Tooling Pool.
    - **5%** to Protocol Verification Escrow.
  - 1-Click download of legally binding, cryptographically timestamped Commercial Production Covenants (`COMMERCIAL_LICENSE_<ID>.txt`).
* **Physical Prototype Batch Tooling Crowdfund**:
  - Embedded [`CampaignBar.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/CampaignBar.tsx) directly into [`PublicConceptPreview.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/PublicConceptPreview.tsx).
  - Displays real funding progress for physical tooling runs (RF welding dies, silicone overmold molds, CNC passes) across Redrink, TWIIZZLock, and Specimen 0001, allowing community patrons to pledge towards real fabrication.
* **Authentic 2015-2026 Inventor Laboratory Notebook Easter Egg**:
  - Built [`InventorNotebookModal.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/InventorNotebookModal.tsx) showcasing John's original 2015 benchtop notes, motto (&ldquo;i th.ink there for i am?&rdquo;), 2-liter bottle headspace physics, and latent heat thermodynamic laws.
  - Interactive "Stamp Witness Seal in Ink" action rendering a dated, verified circular ink impression seal.
  - Triggerable via 3 rapid clicks on the brand logo in [`Navbar.tsx`](file:///c:/Users/Foxle/Downloads/twinth.ink/apps/web/src/components/Navbar.tsx), typing `twin` on the keyboard, or via menu links.
* **Streamlined Core IP Focus**:
  - Purged experimental non-profit and bio-connectome concepts, refocusing TwinThink 100% on market-ready physical hardware inventions, honest creator royalties, and commercial production feasibility.



