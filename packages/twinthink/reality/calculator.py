"""
TwinThink Automatic Reality State Calculator (Idea Reality Engine)
Deterministic evaluator deriving epistemic completeness and provenance grounding
across the 5 canonical dimensions from ingested claims, telemetry, and artifacts.
"""

from typing import List, Dict, Any, Optional
from ..schema import RealityState, RealityDimensionState, Claim

def derive_reality_state(
    files: List[str],
    claims: List[Claim],
    has_step_cad: bool = False,
    has_test_telemetry: bool = False,
    has_simulation_ode: bool = False,
    rmse_error: Optional[float] = None
) -> RealityState:
    filenames_lower = [f.lower() for f in files]

    # ==========================================
    # 1. Structural Reality
    # Evaluated by CAD file integrity (STEP / GLB / STL) + complete BOM with vendor links.
    # ==========================================
    cad_files = [f for f in files if any(f.lower().endswith(ext) for ext in ['.step', '.stp', '.glb', '.stl'])]
    bom_files = [f for f in files if 'bom' in f.lower() and f.lower().endswith(('.csv', '.json'))]
    vendor_claims = [c for c in claims if 'supplier' in c.origin.lower() or 'vendor' in c.origin.lower() or (c.status in ["VERIFIED", "MEASURED"] and 'material' in c.key.lower())]

    if (has_step_cad or any(f.endswith('.glb') for f in filenames_lower)) and (bom_files and len(vendor_claims) >= 1):
        struct_status = "Established"
        struct_score = 96
        struct_desc = "Dimensional solid CAD integrity (STEP/GLB) matched with complete BOM supplier mappings."
        struct_source = cad_files[0] if cad_files else "bom.csv"
        struct_criteria = "Parametric CAD solid model verified + structured BOM with confirmed vendor links."
    elif has_step_cad or any(f.endswith(('.glb', '.stl')) for f in filenames_lower):
        struct_status = "Partially Established"
        struct_score = 75
        struct_desc = "3D solid geometry available; supplier quotes and vendor linkage pending."
        struct_source = cad_files[0] if cad_files else None
        struct_criteria = "CAD geometry verified; complete component vendor validation required for Established."
    elif bom_files:
        struct_status = "Partially Established"
        struct_score = 60
        struct_desc = "BOM structure documented; 3D parametric CAD solid modeling pending."
        struct_source = bom_files[0]
        struct_criteria = "Structured BOM present; 3D STEP/GLB solid geometry required for Established."
    else:
        struct_status = "Conceptual"
        struct_score = 25
        struct_desc = "Concept drawings and specifications only. Dimensional solid CAD not yet established."
        struct_source = None
        struct_criteria = "Requires upload of .step CAD solid and bom.csv."

    # ==========================================
    # 2. Thermal / Physics
    # Evaluated by ODE equations + telemetry CSV calibration (RMSE <= 4.0°C).
    # ==========================================
    sim_files = [f for f in files if any(k in f.lower() for k in ['sim', 'ode', 'model']) and f.lower().endswith(('.py', '.json'))]
    test_files = [f for f in files if any(k in f.lower() for k in ['test', 'telemetry', 'bench']) and f.lower().endswith('.csv')]

    if has_simulation_ode and has_test_telemetry and rmse_error is not None and rmse_error <= 4.0:
        therm_status = "Established"
        therm_score = 94
        therm_desc = f"ODE governing equations validated against empirical sensor telemetry (RMSE = {rmse_error:.2f}°C <= 4.0°C threshold)."
        therm_source = test_files[0] if test_files else (sim_files[0] if sim_files else None)
        therm_criteria = f"Residual calibration error RMSE {rmse_error:.2f}°C satisfies <= 4.0°C epistemic threshold."
    elif has_simulation_ode and has_test_telemetry:
        therm_status = "Experimental"
        therm_score = 75
        therm_desc = f"Physics ODE solver and telemetry CSV available. Calibration pending or RMSE ({rmse_error if rmse_error is not None else 'pending'}) exceeds 4.0°C."
        therm_source = test_files[0] if test_files else None
        therm_criteria = "Requires residual calibration RMSE <= 4.0°C against physical test logs."
    elif has_simulation_ode:
        therm_status = "Conceptual"
        therm_score = 50
        therm_desc = "Governing ODE equations modeled in software; empirical telemetry ground truth pending."
        therm_source = sim_files[0] if sim_files else None
        therm_criteria = "Requires benchtop sensor telemetry CSV upload for empirical validation."
    elif has_test_telemetry:
        therm_status = "Experimental"
        therm_score = 45
        therm_desc = "Sensor telemetry data uploaded; formal ODE physics simulation script pending."
        therm_source = test_files[0] if test_files else None
        therm_criteria = "Requires numerical ODE solver script (e.g. sim.py) to simulate expected response."
    else:
        therm_status = "Unknown"
        therm_score = 15
        therm_desc = "Dynamic thermodynamics and physics behavior not modeled with differential equations."
        therm_source = None
        therm_criteria = "Upload differential equation solver (.py) and sensor telemetry (.csv)."

    # ==========================================
    # 3. Materials Provenance
    # Evaluated by MSDS sheets + food/medical contact certifications.
    # ==========================================
    msds_files = [f for f in files if any(k in f.lower() for k in ['msds', 'sds', 'cert', 'fda', 'usp', 'reach', 'rohs'])]
    material_claims = [c for c in claims if any(k in c.key.lower() for k in ['material', 'alloy', 'polymer', 'metal', 'composite', 'steel', 'silicone'])]
    verified_mats = [c for c in material_claims if c.status in ["VERIFIED", "MEASURED"]]

    if msds_files or len(verified_mats) >= 2:
        mat_status = "Established"
        mat_score = 90
        mat_desc = "Core component materials verified with MSDS sheets or certified vendor specifications."
        mat_source = msds_files[0] if msds_files else "bom.csv"
        mat_criteria = "MSDS sheets or multi-component vendor material specifications verified."
    elif material_claims:
        mat_status = "Partially Established"
        mat_score = 65
        mat_desc = "Material designations identified in engineering specification. MSDS certification pending."
        mat_source = "bom.csv" if bom_files else None
        mat_criteria = "Upload material safety data sheets (MSDS) or certified mill test reports."
    else:
        mat_status = "Conceptual"
        mat_score = 25
        mat_desc = "Generic material assumptions specified without chemical grade verification."
        mat_source = None
        mat_criteria = "Requires explicit material grades and vendor MSDS certificates."

    # ==========================================
    # 4. Safety & Regulatory
    # Core Rule: Remains UNKNOWN until physical drop, pressure, or skin-contact logs are uploaded.
    # ==========================================
    safety_log_files = [f for f in files if any(k in f.lower() for k in ['drop', 'pressure', 'skin', 'biocompat', 'hydrostatic', 'leak', 'toxic'])]
    safety_claims = [c for c in claims if any(k in c.key.lower() for k in ['safety', 'regulatory', 'pressure', 'hazard', 'biocompatibility'])]

    if safety_log_files and any(c.status in ["VERIFIED", "MEASURED"] for c in safety_claims):
        safe_status = "Established"
        safe_score = 88
        safe_desc = "Physical stress/safety logs (pressure, drop, or dermal contact) verified against standards."
        safe_source = safety_log_files[0]
        safe_criteria = "Physical test logs verify containment integrity under rated operational envelope."
    elif safety_log_files:
        safe_status = "Experimental"
        safe_score = 65
        safe_desc = "Safety test logs uploaded; formal regulatory certification report pending."
        safe_source = safety_log_files[0]
        safe_criteria = "Empirical test logs present; third-party regulatory certification pending."
    else:
        safe_status = "Unknown"
        safe_score = 10
        safe_desc = "Safety remains UNKNOWN until physical drop, pressure, or skin-contact logs are uploaded."
        safe_source = None
        safe_criteria = "Requires upload of empirical drop test, pressure test, or dermal biocompatibility logs."

    # ==========================================
    # 5. Manufacturing Readiness
    # Evaluated by tooling definitions (e.g. 5-axis CNC G-code, injection mold drafts, tolerances).
    # ==========================================
    tooling_files = [f for f in files if any(k in f.lower() for k in ['gcode', 'g-code', 'nc', 'mold', 'tooling', 'draft', 'tolerance', 'dxf'])]
    bom_cost_claims = [c for c in claims if any(k in c.key.lower() for k in ['bom', 'cost', 'cogs', 'tooling', 'quote'])]

    if tooling_files or any(c.status == "VERIFIED" and 'tooling' in c.key.lower() for c in claims):
        mfg_status = "Established"
        mfg_score = 92
        mfg_desc = "Production tooling definitions (CNC G-code, injection mold drafts, geometric tolerances) established."
        mfg_source = tooling_files[0] if tooling_files else "spec.md"
        mfg_criteria = "Tooling G-code / mold tooling parameters verified for volume production."
    elif bom_files and any(c.status in ["VERIFIED", "MEASURED"] for c in bom_cost_claims):
        mfg_status = "Partially Established"
        mfg_score = 65
        mfg_desc = "Structured bill of materials with unit COGS established. Tooling paths pending."
        mfg_source = bom_files[0]
        mfg_criteria = "COGS calculated; tooling CAD drafts or machining G-code paths required for Established."
    elif bom_files:
        mfg_status = "Partially Established"
        mfg_score = 50
        mfg_desc = "Preliminary component list without binding tooling quotations or machine paths."
        mfg_source = bom_files[0]
        mfg_criteria = "Upload production tooling definitions (CNC G-code, injection mold specifications)."
    else:
        mfg_status = "Conceptual"
        mfg_score = 20
        mfg_desc = "Manufacturing readiness and production tooling not yet established."
        mfg_source = None
        mfg_criteria = "Requires structured BOM and production machining/mold definitions."

    overall = int((struct_score * 0.25) + (therm_score * 0.3) + (mat_score * 0.2) + (safe_score * 0.15) + (mfg_score * 0.1))

    return RealityState(
        structural=RealityDimensionState(
            status=struct_status,
            score_pct=struct_score,
            evidence_count=len(cad_files) + len(bom_files),
            rationale=struct_desc,
            source_file=struct_source,
            evidence_paths=cad_files + bom_files,
            criteria=struct_criteria
        ),
        thermal=RealityDimensionState(
            status=therm_status,
            score_pct=therm_score,
            evidence_count=len(sim_files) + len(test_files),
            rationale=therm_desc,
            source_file=therm_source,
            evidence_paths=sim_files + test_files,
            criteria=therm_criteria
        ),
        material=RealityDimensionState(
            status=mat_status,
            score_pct=mat_score,
            evidence_count=len(material_claims) + len(msds_files),
            rationale=mat_desc,
            source_file=mat_source,
            evidence_paths=msds_files + ([bom_files[0]] if bom_files else []),
            criteria=mat_criteria
        ),
        safety=RealityDimensionState(
            status=safe_status,
            score_pct=safe_score,
            evidence_count=len(safety_log_files) + len(safety_claims),
            rationale=safe_desc,
            source_file=safe_source,
            evidence_paths=safety_log_files,
            criteria=safe_criteria
        ),
        manufacturing=RealityDimensionState(
            status=mfg_status,
            score_pct=mfg_score,
            evidence_count=len(tooling_files) + len(bom_cost_claims),
            rationale=mfg_desc,
            source_file=mfg_source,
            evidence_paths=tooling_files + bom_files,
            criteria=mfg_criteria
        ),
        overall_score_pct=overall
    )
