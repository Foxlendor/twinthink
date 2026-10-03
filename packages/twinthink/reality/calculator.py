"""
TwinThink Automatic Reality State Derivation Engine
Evaluates evidence artifacts, claims, and telemetry to compute dimensional epistemic states.
"""

from typing import List, Dict, Any, Optional
from ..schema import RealityState, RealityDimension, Claim

def derive_reality_state_v01(
    files: List[str],
    claims: List[Claim],
    has_step_cad: bool = False,
    has_glb: bool = False,
    has_bom: bool = False,
    has_tolerances: bool = False,
    has_simulation_ode: bool = False,
    test_runs_count: int = 0,
    min_rmse: Optional[float] = None,
    has_safety_cert: bool = False
) -> RealityState:
    """
    Evaluates evidence artifacts and computes dimensional confidence and status according to the v0.1 spec.
    """
    # 1. Structure Dimension
    struct_score = 0.0
    struct_reasons = []
    if has_step_cad or has_glb:
        struct_score += 0.40
        struct_reasons.append("Complete CAD geometry (STEP/GLB)")
    if has_bom:
        struct_score += 0.40
        struct_reasons.append("sourced BOM with vendor pricing")
    if has_tolerances:
        struct_score += 0.20
        struct_reasons.append("fits & critical tolerances defined")
        
    struct_score = round(min(1.0, struct_score), 2)
    if struct_score >= 0.85:
        struct_status = "ESTABLISHED"
    elif struct_score >= 0.50:
        struct_status = "PARTIALLY_ESTABLISHED"
    else:
        struct_status = "CONCEPTUAL"
        
    struct_reason = " + ".join(struct_reasons) if struct_reasons else "Dimensional solid geometry not yet established."

    # 2. Thermal Dimension
    therm_score = 0.0
    therm_reasons = []
    if has_simulation_ode:
        therm_score += 0.30
        therm_reasons.append("4-node ODE solver")
    if test_runs_count > 0:
        therm_score += 0.30
        therm_reasons.append(f"{test_runs_count} physical test runs")
    if min_rmse is not None and min_rmse < 4.0:
        therm_score += 0.40
        therm_reasons.append(f"calibrated residual (RMSE: {min_rmse:.1f}°C)")
        
    therm_score = round(min(1.0, therm_score), 2)
    if therm_score >= 0.85:
        therm_status = "VERIFIED"
    elif therm_score >= 0.50:
        therm_status = "EXPERIMENTAL"
    else:
        therm_status = "UNKNOWN"
        
    therm_reason = " ".join(therm_reasons) if therm_reasons else "Thermal behavior unmodeled."

    # 3. Materials Dimension
    mat_score = 0.50  # Literature validated
    mat_reason = "Food-grade 316L and SAT literature validated; silicone high-temp leach test pending."
    mat_status = "PARTIALLY_ESTABLISHED"

    # 4. Safety Dimension
    if has_safety_cert:
        safe_score = 0.85
        safe_status = "VERIFIED"
        safe_reason = "Certified food-contact and pressure testing complete."
    else:
        safe_score = 0.20
        safe_status = "UNKNOWN"
        safe_reason = "No certified drop/rupture test or thermal skin-contact safety assay on record."

    # 5. Manufacturing Dimension
    mfg_score = 0.35
    mfg_status = "CONCEPTUAL"
    mfg_reason = "Bench assembly proven; automated snap-disc sealing tool unvalidated."

    composite = round(
        (struct_score * 0.25) +
        (therm_score * 0.30) +
        (mat_score * 0.20) +
        (safe_score * 0.15) +
        (mfg_score * 0.10),
        2
    )

    return RealityState(
        composite_score=composite,
        derived_dimensions={
            "structure": RealityDimension(status=struct_status, confidence=struct_score, reason=struct_reason),
            "thermal": RealityDimension(status=therm_status, confidence=therm_score, reason=therm_reason),
            "materials": RealityDimension(status=mat_status, confidence=mat_score, reason=mat_reason),
            "safety": RealityDimension(status=safe_status, confidence=safe_score, reason=safe_reason),
            "manufacturing": RealityDimension(status=mfg_status, confidence=mfg_score, reason=mfg_reason)
        }
    )
