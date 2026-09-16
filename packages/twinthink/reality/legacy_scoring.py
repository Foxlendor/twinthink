from __future__ import annotations

from dataclasses import dataclass
from typing import Any


EPISTEMIC_WEIGHT = {
    "VERIFIED": 1.0,
    "EXPERIMENTAL": 0.75,
    "ESTIMATED": 0.5,
    "ASSUMED": 0.25,
    "UNKNOWN": 0.0,
}


def _status(score: float) -> str:
    if score >= 0.90:
        return "ESTABLISHED"
    if score >= 0.65:
        return "EXPERIMENTAL"
    if score >= 0.35:
        return "PARTIALLY_ESTABLISHED"
    if score > 0:
        return "CONCEPTUAL"
    return "UNKNOWN"


def derive_reality_state(twin: dict[str, Any]) -> dict[str, Any]:
    """Derive Reality State from observable artifacts and claim evidence.

    The rules are deliberately deterministic and inspectable. AI may propose
    claims, but it does not directly assign a reality score.
    """
    object_data = twin.get("object", {})
    structure = twin.get("structure", {})
    behavior = twin.get("behavior", {})
    evidence = twin.get("evidence", {})
    claims = twin.get("claims", [])
    unknowns = twin.get("unknowns", [])

    structure_score = 0.0
    structure_reasons: list[str] = []
    if object_data.get("primary_3d") or object_data.get("cad_source"):
        structure_score += 0.40
        structure_reasons.append("CAD/3D geometry is present")
    if structure.get("bom_file") or structure.get("components"):
        structure_score += 0.40
        structure_reasons.append("A bill of materials/component record is present")
    if any(c.get("tolerances") or c.get("critical_dimensions") for c in structure.get("components", [])):
        structure_score += 0.20
        structure_reasons.append("Component tolerances are recorded")

    thermal_score = 0.0
    thermal_reasons: list[str] = []
    if behavior.get("solver") or behavior.get("governing_equations"):
        thermal_score += 0.30
        thermal_reasons.append("A governing model is present")
    tests = evidence.get("test_runs", [])
    if tests:
        thermal_score += 0.30
        thermal_reasons.append(f"{len(tests)} telemetry/test run(s) are present")
    rmses = [t.get("rmse") for t in tests if isinstance(t.get("rmse"), (int, float))]
    if rmses and min(rmses) < 4.0:
        thermal_score += 0.40
        thermal_reasons.append(f"Best recorded RMSE is {min(rmses):.2f}°C")

    materials_score = 0.0
    materials_reasons: list[str] = []
    materials = [c.get("material") for c in structure.get("components", []) if c.get("material")]
    literature_claims = [c for c in claims if c.get("source", {}).get("type") == "LITERATURE"]
    if materials or literature_claims:
        materials_score += 0.50
        materials_reasons.append("Material identities or literature sources are recorded")
    if any(c.get("target_node", "").lower().startswith("material") and c.get("epistemic_status") == "VERIFIED" for c in claims):
        materials_score += 0.50
        materials_reasons.append("At least one material claim is verified")

    safety_score = 0.0
    safety_reasons = ["No safety evidence has been established"]
    safety_claims = [c for c in claims if "safety" in c.get("target_node", "").lower()]
    if safety_claims:
        safety_score = min(1.0, max(EPISTEMIC_WEIGHT.get(c.get("epistemic_status"), 0) for c in safety_claims))
        safety_reasons = ["Safety claims exist and are traceable to evidence"]

    manufacturing_score = 0.0
    manufacturing_reasons = ["Manufacturing process evidence is not established"]
    if structure.get("components"):
        manufacturing_score += 0.20
        manufacturing_reasons = ["Component-level manufacturing information exists"]
    if any(c.get("target_node", "").lower().startswith("manufacturing") for c in claims):
        manufacturing_score += 0.30
        manufacturing_reasons.append("Manufacturing claims are recorded")
    if any("manufactur" in u.get("category", "").lower() for u in unknowns):
        manufacturing_reasons.append("Manufacturing unknowns remain")

    dimensions = {
        "structure": (structure_score, structure_reasons),
        "thermal": (thermal_score, thermal_reasons),
        "materials": (materials_score, materials_reasons),
        "safety": (safety_score, safety_reasons),
        "manufacturing": (manufacturing_score, manufacturing_reasons),
    }

    derived = {}
    for name, (score, reasons) in dimensions.items():
        derived[name] = {
            "status": _status(score),
            "confidence": round(min(score, 1.0), 3),
            "reason": "; ".join(reasons) if reasons else "No supporting artifacts found",
        }

    composite = round(sum(score for score, _ in dimensions.values()) / len(dimensions), 3)
    return {"composite_score": composite, "derived_dimensions": derived}
