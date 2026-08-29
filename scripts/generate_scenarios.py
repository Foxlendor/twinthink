import os
import sys
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from packages.twinthink.simulation.thermal import ThermalStrawSimulator
from packages.twinthink.simulation.flow import FlowTimeline

SCENARIOS_DIR = os.path.join(os.path.dirname(__file__), '../fixtures/valid/straw_v1/simulation/scenarios')
RESULTS_DIR = os.path.join(os.path.dirname(__file__), '../fixtures/valid/straw_v1/simulation/results')

os.makedirs(SCENARIOS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

scenarios = {
    "baseline.json": {
        "name": "Standard Human Sip Cycle",
        "description": "Standard drinking pace: 3-second sip every 30 seconds at 8 mL/s flow.",
        "initial_beverage_temperature_C": 5.0,
        "ambient_temperature_C": 21.0,
        "flow_rate_ml_s": 8.0,
        "sip_duration_s": 3,
        "sip_interval_s": 30,
        "simulation_duration_s": 300
    },
    "rapid_sip.json": {
        "name": "Continuous Rapid Draw",
        "description": "Fast draw pace: 4-second sip every 15 seconds at 10 mL/s flow.",
        "initial_beverage_temperature_C": 5.0,
        "ambient_temperature_C": 21.0,
        "flow_rate_ml_s": 10.0,
        "sip_duration_s": 4,
        "sip_interval_s": 15,
        "simulation_duration_s": 300
    },
    "slow_sip.json": {
        "name": "Extended Thermal Soak",
        "description": "Leisurely pace: 2-second sip every 45 seconds at 5 mL/s flow.",
        "initial_beverage_temperature_C": 5.0,
        "ambient_temperature_C": 21.0,
        "flow_rate_ml_s": 5.0,
        "sip_duration_s": 2,
        "sip_interval_s": 45,
        "simulation_duration_s": 300
    }
}

sim = ThermalStrawSimulator()

for fname, sc in scenarios.items():
    with open(os.path.join(SCENARIOS_DIR, fname), 'w', encoding='utf-8') as f:
        json.dump(sc, f, indent=2)

    timeline = FlowTimeline.generate_periodic(
        total_duration_s=sc["simulation_duration_s"],
        sip_interval_s=sc["sip_interval_s"],
        sip_duration_s=sc["sip_duration_s"],
        flow_rate_ml_s=sc["flow_rate_ml_s"],
        initial_delay_s=15
    )

    res = sim.simulate(timeline, duration_s=sc["simulation_duration_s"])
    res_payload = {
        "scenario": sc,
        "summary": res["summary"],
        "beverage_temp_C": res["beverage_temp_C"],
        "pcm_temp_C": res["pcm_temp_C"],
        "wall_temp_C": res["wall_temp_C"],
        "solid_fraction": res["solid_fraction"]
    }

    with open(os.path.join(RESULTS_DIR, fname), 'w', encoding='utf-8') as f:
        json.dump(res_payload, f, indent=2)

print("Generated and simulated all reproducible scenarios!")
