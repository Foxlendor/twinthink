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
* Zero TypeScript errors. All routes prerendered / dynamic.
