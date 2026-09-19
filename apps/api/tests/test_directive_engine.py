"""
Tests for TwinThink Idea Reality Engine Directive:
1. Automated Reality State Engine (Structure, Thermal RMSE <= 4.0, Materials MSDS, Safety Unknown default, Tooling)
2. Minimal Ingestion Factory Parser (CAD, BOM, ODE, Telemetry)
3. Epistemic Provenance Grounding & "WHY?" Drawer data
4. Specimen #0001 History Isolation
"""

import json
import pytest
from packages.twinthink.reality.calculator import derive_reality_state
from packages.twinthink.factory.engine import TwinFactoryEngine
from packages.twinthink.schema import Claim

def test_reality_state_thermal_rmse_threshold():
    """Verify ODE + Telemetry calibration satisfies Established status when RMSE <= 4.0 C."""
    files = ["sim.py", "telemetry.csv", "bom.csv", "assembly.step"]
    claims = [
        Claim(key="material_tube", name="Tube Material", value="316L Stainless Steel", status="VERIFIED", origin="Supplier: Acme")
    ]
    
    # RMSE 1.60 C <= 4.0 C threshold -> Established
    state_pass = derive_reality_state(
        files=files,
        claims=claims,
        has_step_cad=True,
        has_test_telemetry=True,
        has_simulation_ode=True,
        rmse_error=1.60
    )
    assert state_pass.thermal.status == "Established"
    assert state_pass.thermal.score_pct >= 90
    assert "1.60" in state_pass.thermal.rationale
    assert state_pass.thermal.source_file is not None

    # RMSE 4.80 C > 4.0 C threshold -> Experimental
    state_fail = derive_reality_state(
        files=files,
        claims=claims,
        has_step_cad=True,
        has_test_telemetry=True,
        has_simulation_ode=True,
        rmse_error=4.80
    )
    assert state_fail.thermal.status == "Experimental"

def test_reality_state_safety_unknown_default():
    """Verify Safety strictly defaults to UNKNOWN until drop, burst pressure, or dermal logs exist."""
    files = ["assembly.step", "bom.csv", "sim.py"]
    claims = [Claim(key="mass", name="Weight", value="45g", status="MEASURED")]

    state = derive_reality_state(
        files=files,
        claims=claims,
        has_step_cad=True
    )
    assert state.safety.status == "Unknown"
    assert "UNKNOWN until physical drop, pressure, or skin-contact" in state.safety.rationale
    assert state.safety.source_file is None

    # When drop/pressure logs exist
    files_with_safety = ["assembly.step", "bom.csv", "hydrostatic_pressure_test.csv"]
    safety_claims = [Claim(key="safety_containment", name="Hydrostatic Pressure", value="2.5 bar", status="VERIFIED")]
    state_safe = derive_reality_state(
        files=files_with_safety,
        claims=safety_claims,
        has_step_cad=True
    )
    assert state_safe.safety.status == "Established"
    assert state_safe.safety.source_file == "hydrostatic_pressure_test.csv"

def test_reality_state_structural_and_tooling_evaluator():
    """Verify CAD solid model integrity + BOM vendor links establish structure and tooling establishes manufacturing."""
    files = ["resip.step", "resip.glb", "bom.csv", "milling_tooling.gcode"]
    claims = [
        Claim(key="material_316l", name="Conduit Tube", value="316L Stainless Steel", status="VERIFIED", origin="Supplier: Outokumpu Stainless"),
        Claim(key="tooling_cnc", name="Tooling Path", value="5-axis G-code", status="VERIFIED", origin="Tooling definition")
    ]

    state = derive_reality_state(
        files=files,
        claims=claims,
        has_step_cad=True
    )
    assert state.structural.status == "Established"
    assert state.structural.score_pct >= 90
    assert state.manufacturing.status == "Established"
    assert state.manufacturing.source_file == "milling_tooling.gcode"

def test_factory_engine_parser_extracts_cad_bom_sim_telemetry():
    """Verify TwinFactoryEngine extracts geometry (.step/.stl), BOM, behavior, and sensor residuals."""
    sample_bom_csv = """level,part_number,name,qty,unit,unit_cost,material,supplier
0,ASSY-001,Thermal Beverage Straw,1,ea,,Assembly,
1,PRT-001,Passivated Inner Conduit,1,ea,1.38,316L Stainless,Outokumpu
1,PRT-002,Silicone Insulation Sleeve,1,ea,0.85,Silicone Shore 40A,Dow Corning
"""
    sample_sim_py = """# Simulation ODE
def ode_solve():
    pass
"""
    sample_telemetry_csv = """time_seconds,T_beverage_chamber_C
0.0,20.0
1.0,42.5
2.0,54.0
"""
    sample_results_json = json.dumps({
        "beverage_temp_C": [20.0, 41.8, 53.9]
    })

    bundle = {
        "assembly.step": b"STEP-21 solid geometry mock",
        "bom.csv": sample_bom_csv.encode("utf-8"),
        "sim_model.py": sample_sim_py.encode("utf-8"),
        "telemetry_bench.csv": sample_telemetry_csv.encode("utf-8"),
        "sim_results.json": sample_results_json.encode("utf-8")
    }

    doc = TwinFactoryEngine.process_bundle(bundle, twin_id="test_001", creator="test_creator")

    assert doc.object.cad_step_path == "assembly.step"
    assert len(doc.structure.components) == 2
    assert doc.structure.estimated_bom_usd is not None
    assert doc.behavior.entrypoint_script == "sim_model.py"
    assert doc.evidence.calibration_rmse is not None
    # RMSE should be small between [20, 42.5, 54] and [20, 41.8, 53.9]
    assert doc.evidence.calibration_rmse < 1.0
    assert doc.reality_state.thermal.status == "Established"
    assert doc.reality_state.structural.status == "Established"
    assert len(doc.claims) >= 3

def test_specimen_0001_provenance_isolation_rule():
    """Verify that Specimen #0001 verified provenance is strictly limited to 020, 021, 022, 003-1."""
    verified_prefixes = ('020-', '021-', '022-', '003-1-')
    
    # Read public journal manifest
    with open("apps/web/public/journal_manifest.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)
    
    all_entries = manifest.get("entries", [])
    assert len(all_entries) == 27
    
    verified_entries = [e for e in all_entries if e["filename"].startswith(verified_prefixes)]
    assert len(verified_entries) == 4
    
    unlinked_entries = [e for e in all_entries if not e["filename"].startswith(verified_prefixes)]
    assert len(unlinked_entries) == 23
    for entry in unlinked_entries:
        assert entry.get("resip_relationship") == "not_established"
