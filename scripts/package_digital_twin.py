import os
import json
import csv
import zipfile
import shutil
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from packages.twinthink.simulation.thermal import ThermalStrawSimulator
from packages.twinthink.simulation.flow import FlowTimeline

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE_DIR = os.path.join(ROOT_DIR, 'fixtures', 'valid', 'straw_v1')
ZIP_OUT = os.path.join(ROOT_DIR, 'fixtures', 'valid', 'straw_v1.zip')

# Copy modular simulation files into bundle
sim_src = os.path.join(ROOT_DIR, 'packages', 'twinthink', 'simulation')
sim_dst = os.path.join(BUNDLE_DIR, 'simulation')
os.makedirs(sim_dst, exist_ok=True)

for py_file in ['pcm.py', 'thermal.py', 'flow.py', 'calibration.py', 'metrics.py', 'model.py']:
    src_p = os.path.join(sim_src, py_file)
    if os.path.exists(src_p):
        shutil.copy2(src_p, os.path.join(sim_dst, py_file))

# Run baseline simulation
sim = ThermalStrawSimulator()
timeline = FlowTimeline.generate_periodic(total_duration_s=300, sip_interval_s=30, sip_duration_s=3, flow_rate_ml_s=8.0)
sim_res = sim.simulate(timeline, duration_s=300)

with open(os.path.join(BUNDLE_DIR, 'simulation', 'simulation_results.json'), 'w', encoding='utf-8') as f:
    json.dump(sim_res, f, indent=2)

# Generate assets array for manifest
assets = [
    { "relative_path": "README.md", "media_type": "text/markdown", "is_entrypoint": 1, "entrypoint_name": "readme" },
    { "relative_path": "spec.md", "media_type": "text/markdown", "is_entrypoint": 1, "entrypoint_name": "spec" },
    { "relative_path": "bom.csv", "media_type": "text/csv", "is_entrypoint": 1, "entrypoint_name": "bom" },
    { "relative_path": "cad/preview.glb", "media_type": "model/gltf-binary", "is_entrypoint": 1, "entrypoint_name": "cad_preview" },
    { "relative_path": "cad/primary.step", "media_type": "application/step", "is_entrypoint": 1, "entrypoint_name": "cad_step" },
    { "relative_path": "simulation/thermal.py", "media_type": "text/x-python", "is_entrypoint": 1, "entrypoint_name": "sim_engine" },
    { "relative_path": "simulation/pcm.py", "media_type": "text/x-python", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "simulation/flow.py", "media_type": "text/x-python", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "simulation/calibration.py", "media_type": "text/x-python", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "simulation/metrics.py", "media_type": "text/x-python", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "simulation/parameters.json", "media_type": "application/json", "is_entrypoint": 1, "entrypoint_name": "sim_params" },
    { "relative_path": "simulation/simulation_results.json", "media_type": "application/json", "is_entrypoint": 1, "entrypoint_name": "sim_results" },
    { "relative_path": "simulation/scenarios/baseline.json", "media_type": "application/json", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "simulation/scenarios/rapid_sip.json", "media_type": "application/json", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "simulation/scenarios/slow_sip.json", "media_type": "application/json", "is_entrypoint": 0, "entrypoint_name": "" },
    { "relative_path": "testing/test-results.csv", "media_type": "text/csv", "is_entrypoint": 1, "entrypoint_name": "test_data" },
    { "relative_path": "testing/calibration.json", "media_type": "application/json", "is_entrypoint": 0, "entrypoint_name": "" }
]

manifest = {
    "version": "1.0.0",
    "title": "Sodium Acetate Heat-Releasing Drink Straw",
    "summary": "Phase-change thermal straw incorporating a supersaturated sodium acetate crystallization jacket, reproducible sip scenario experiments, and multi-node thermal simulation.",
    "license": "CERN-OHL-S-2.0",
    "ontology_class": "PhysicalObject",
    "properties": [
        { "key": "estimated_bom_usd", "value": 4.50, "type": "number", "unit": "USD", "label": "Estimated BOM" },
        { "key": "weight_grams", "value": 45, "type": "number", "unit": "g", "label": "Weight" },
        { "key": "difficulty", "value": "intermediate", "type": "string", "label": "Difficulty" },
        { "key": "pcm_core_mass", "value": 50, "type": "number", "unit": "g", "label": "PCM Core Mass" },
        { "key": "latent_heat_release", "value": 12.05, "type": "number", "unit": "kJ", "label": "Latent Heat Capacity" },
        { "key": "peak_core_temp", "value": 54.0, "type": "number", "unit": "°C", "label": "Peak Core Temp" }
    ],
    "simulation": {
        "engine": "twinthink.simulation.thermal",
        "entrypoint": "simulation/thermal.py",
        "parameters": "simulation/parameters.json",
        "results": "simulation/simulation_results.json",
        "scenarios_dir": "simulation/scenarios"
    },
    "relationships": [],
    "assets": assets
}

with open(os.path.join(BUNDLE_DIR, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

# Write clean ZIP with normalized paths
with zipfile.ZipFile(ZIP_OUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(BUNDLE_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, BUNDLE_DIR).replace('\\', '/')
            zf.write(full_path, rel_path)

print("Modular Digital Twin Bundle packaged successfully!")
