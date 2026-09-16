"""
TwinThink Automatic Reality State Calculator
Derives epistemic completeness across 5 dimensions from evidence and claims.
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
    # 1. Structural Reality
    has_glb = any(f.lower().endswith('.glb') for f in files)
    if has_step_cad and has_glb:
        struct_status = "Verified"
        struct_score = 100
        struct_desc = "Parametric 3D solid geometry (STEP) and web render mesh present."
    elif has_step_cad or has_glb:
        struct_status = "Partial"
        struct_score = 70
        struct_desc = "Partial 3D geometry available (STEP or render mesh)."
    else:
        struct_status = "Concept"
        struct_score = 25
        struct_desc = "Concept drawings or specifications only. Dimensional solid CAD not yet established."

    # 2. Thermal / Physical Dynamics
    if has_simulation_ode and has_test_telemetry and rmse_error is not None and rmse_error < 2.5:
        therm_status = "Verified"
        therm_score = 92
        therm_desc = f"Physics simulation validated against empirical sensor logs (RMSE = {rmse_error:.2f})."
    elif has_simulation_ode and has_test_telemetry:
        therm_status = "Experimental"
        therm_score = 80
        therm_desc = "Physics solver present with empirical sensor logs."
    elif has_simulation_ode:
        therm_status = "Experimental"
        therm_score = 65
        therm_desc = "Theoretical simulation model present. Awaiting empirical validation."
    else:
        therm_status = "Unvalidated"
        therm_score = 20
        therm_desc = "Dynamic physics behavior not modeled with differential equations."

    # 3. Material Provenance
    material_claims = [c for c in claims if any(k in c.key.lower() for k in ['material', 'alloy', 'polymer', 'metal', 'composite'])]
    verified_mats = [c for c in material_claims if c.status in ["VERIFIED", "MEASURED"]]
    
    if len(verified_mats) >= 2:
        mat_status = "Verified"
        mat_score = 90
        mat_desc = "Core component materials verified with supplier specifications."
    elif len(material_claims) >= 1:
        mat_status = "Partial"
        mat_score = 65
        mat_desc = "Component materials identified from engineering specification."
    else:
        mat_status = "Concept"
        mat_score = 30
        mat_desc = "Generic material designations specified. Grade verification pending."

    # 4. Safety & Regulatory
    safety_claims = [c for c in claims if any(k in c.key.lower() for k in ['safety', 'regulatory', 'compliance', 'standard'])]
    if any(c.status in ["VERIFIED", "MEASURED"] for c in safety_claims):
        safe_status = "Verified"
        safe_score = 85
        safe_desc = "Safety envelope and compliance standards verified."
    elif safety_claims:
        safe_status = "Unvalidated"
        safe_score = 35
        safe_desc = "Safety requirements documented; certification and testing pending."
    else:
        safe_status = "Unknown"
        safe_score = 15
        safe_desc = "Safety and regulatory envelope not yet formally documented."

    # 5. Manufacturing Readiness
    bom_claims = [c for c in claims if any(k in c.key.lower() for k in ['bom', 'cost', 'cogs', 'tooling', 'supplier'])]
    if any(c.status in ["VERIFIED", "MEASURED"] for c in bom_claims):
        mfg_status = "Partial"
        mfg_score = 60
        mfg_desc = "Structured bill of materials with identified component sources."
    elif bom_claims:
        mfg_status = "Concept"
        mfg_score = 35
        mfg_desc = "Concept BOM estimates without binding production quotes."
    else:
        mfg_status = "Concept"
        mfg_score = 20
        mfg_desc = "Manufacturing readiness and production tooling not yet established."

    overall = int((struct_score * 0.25) + (therm_score * 0.3) + (mat_score * 0.2) + (safe_score * 0.15) + (mfg_score * 0.1))

    return RealityState(
        structural=RealityDimensionState(status=struct_status, score_pct=struct_score, evidence_count=len([f for f in files if f.lower().endswith(('.step', '.stp', '.glb', '.stl'))]), rationale=struct_desc),
        thermal=RealityDimensionState(status=therm_status, score_pct=therm_score, evidence_count=len([f for f in files if any(k in f.lower() for k in ['sim', 'test', 'results', 'model'])]), rationale=therm_desc),
        material=RealityDimensionState(status=mat_status, score_pct=mat_score, evidence_count=len(material_claims), rationale=mat_desc),
        safety=RealityDimensionState(status=safe_status, score_pct=safe_score, evidence_count=len(safety_claims), rationale=safe_desc),
        manufacturing=RealityDimensionState(status=mfg_status, score_pct=mfg_score, evidence_count=len(bom_claims), rationale=mfg_desc),
        overall_score_pct=overall
    )
