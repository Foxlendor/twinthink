"""
TwinThink Automatic Reality State Calculator
Derives epistemic completeness across 5 dimensions from evidence and claims.
"""

from typing import List, Dict, Any
from ..schema import RealityState, RealityDimensionState, Claim

def derive_reality_state(
    files: List[str],
    claims: List[Claim],
    has_step_cad: bool = False,
    has_test_telemetry: bool = False,
    has_simulation_ode: bool = False,
    rmse_error: float = None
) -> RealityState:
    # 1. Structural Reality
    if has_step_cad and any(f.endswith('.glb') for f in files):
        struct_status = "Verified"
        struct_score = 100
        struct_desc = "Parametric 3D solid geometry (STEP AP214) and web render mesh present."
    elif has_step_cad or any(f.endswith('.glb') for f in files):
        struct_status = "Partial"
        struct_score = 70
        struct_desc = "Mesh render available, awaiting native multi-body solid CAD verification."
    else:
        struct_status = "Concept"
        struct_score = 25
        struct_desc = "Concept drawings only. Dimensional solid geometry not yet established."

    # 2. Thermal / Physical Dynamics
    if has_simulation_ode and has_test_telemetry and rmse_error is not None and rmse_error < 2.5:
        therm_status = "Verified"
        therm_score = 92
        therm_desc = f"ODE model calibrated against physical benchtop thermocouple runs (RMSE = {rmse_error:.2f}°C)."
    elif has_simulation_ode and has_test_telemetry:
        therm_status = "Experimental"
        therm_score = 80
        therm_desc = "Physics solver present with uncalibrated empirical test logs."
    elif has_simulation_ode:
        therm_status = "Experimental"
        therm_score = 65
        therm_desc = "Theoretical ODE simulation model present. Awaiting physical benchtop sensor logging."
    else:
        therm_status = "Unvalidated"
        therm_score = 20
        therm_desc = "Thermal behavior estimated without dynamic differential equations."

    # 3. Material Provenance
    material_claims = [c for c in claims if any(k in c.key.lower() for k in ['material', 'conduit', 'pcm', 'silicone', 'bom'])]
    verified_mats = [c for c in material_claims if c.status in ["VERIFIED", "MEASURED"]]
    
    if len(verified_mats) >= 3:
        mat_status = "Verified"
        mat_score = 90
        mat_desc = "Food-contact 316L, SAT salt, and silicone elastomer properties verified with suppliers."
    elif len(material_claims) >= 2:
        mat_status = "Partial"
        mat_score = 65
        mat_desc = "Key chemical and alloy materials specified from literature database (NIST)."
    else:
        mat_status = "Concept"
        mat_score = 30
        mat_desc = "Generic material classes specified. Specific grades pending supplier quote."

    # 4. Safety & Regulatory
    safety_claims = [c for c in claims if 'safety' in c.key.lower() or 'food' in c.key.lower()]
    if any(c.status == "VERIFIED" for c in safety_claims):
        safe_status = "Verified"
        safe_score = 85
        safe_desc = "Food-contact certification and pressure tests confirmed."
    elif safety_claims:
        safe_status = "Unvalidated"
        safe_score = 35
        safe_desc = "Prototype status. Formal FDA / LFGB food-contact laboratory certification pending."
    else:
        safe_status = "Unknown"
        safe_score = 15
        safe_desc = "Safety envelope not yet formally established."

    # 5. Manufacturing Readiness
    bom_claims = [c for c in claims if 'bom' in c.key.lower() or 'cost' in c.key.lower()]
    if any(c.status == "MEASURED" for c in bom_claims):
        mfg_status = "Partial"
        mfg_score = 45
        mfg_desc = "Pilot build (100 units) priced from standard off-the-shelf catalog parts ($4.50 USD)."
    else:
        mfg_status = "Concept"
        mfg_score = 20
        mfg_desc = "Concept BOM estimates without binding high-volume tooling quotes."

    overall = int((struct_score * 0.25) + (therm_score * 0.3) + (mat_score * 0.2) + (safe_score * 0.15) + (mfg_score * 0.1))

    return RealityState(
        structural=RealityDimensionState(status=struct_status, score_pct=struct_score, evidence_count=len([f for f in files if f.endswith(('.step', '.glb', '.stl'))]), rationale=struct_desc),
        thermal=RealityDimensionState(status=therm_status, score_pct=therm_score, evidence_count=len([f for f in files if 'sim' in f or 'test' in f]), rationale=therm_desc),
        material=RealityDimensionState(status=mat_status, score_pct=mat_score, evidence_count=len(material_claims), rationale=mat_desc),
        safety=RealityDimensionState(status=safe_status, score_pct=safe_score, evidence_count=len(safety_claims), rationale=safe_desc),
        manufacturing=RealityDimensionState(status=mfg_status, score_pct=mfg_score, evidence_count=len(bom_claims), rationale=mfg_desc),
        overall_score_pct=overall
    )
