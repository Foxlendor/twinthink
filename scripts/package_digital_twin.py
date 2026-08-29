import os
import json
import csv
import zipfile
import sys

# Ensure simulation module can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '../packages'))
from twinthink.simulation.model import run_thermal_simulation

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE_DIR = os.path.join(ROOT_DIR, 'fixtures', 'valid', 'straw_v1')
ZIP_OUT = os.path.join(ROOT_DIR, 'fixtures', 'valid', 'straw_v1.zip')

os.makedirs(os.path.join(BUNDLE_DIR, 'cad'), exist_ok=True)
os.makedirs(os.path.join(BUNDLE_DIR, 'simulation'), exist_ok=True)
os.makedirs(os.path.join(BUNDLE_DIR, 'testing'), exist_ok=True)

# 1. Generate simulation model file in bundle
with open(os.path.join(ROOT_DIR, 'packages', 'twinthink', 'simulation', 'model.py'), 'r', encoding='utf-8') as src:
    model_code = src.read()

with open(os.path.join(BUNDLE_DIR, 'simulation', 'model.py'), 'w', encoding='utf-8') as dst:
    dst.write(model_code)

# 2. Run simulation and save outputs
sim_data = run_thermal_simulation()

with open(os.path.join(BUNDLE_DIR, 'simulation', 'parameters.json'), 'w', encoding='utf-8') as f:
    json.dump(sim_data['parameters'], f, indent=2)

with open(os.path.join(BUNDLE_DIR, 'simulation', 'simulation_results.json'), 'w', encoding='utf-8') as f:
    json.dump(sim_data['results'], f, indent=2)

# 3. Generate testing CSV
results = sim_data['results']
csv_path = os.path.join(BUNDLE_DIR, 'testing', 'test-results.csv')
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['time_seconds', 'T_sodium_acetate_C', 'T_beverage_chamber_C', 'is_sipping_active', 'cumulative_joules_transferred'])
    for i in range(len(results['time_seconds'])):
        writer.writerow([
            results['time_seconds'][i],
            results['T_sodium_acetate_C'][i],
            results['T_beverage_chamber_C'][i],
            1 if results['is_sipping'][i] else 0,
            results['cumulative_joules'][i]
        ])

# 4. Calibration metadata
calibration = {
    "calibration_status": "Lumped Model Baseline",
    "calibrated_against": "Water Flow Bench Rig v0.1",
    "r_squared_fit": 0.942,
    "primary_limiting_factor": "Inner wall thermal boundary layer resistance during fast sips"
}
with open(os.path.join(BUNDLE_DIR, 'testing', 'calibration.json'), 'w', encoding='utf-8') as f:
    json.dump(calibration, f, indent=2)

# 5. STEP CAD placeholder
step_path = os.path.join(BUNDLE_DIR, 'cad', 'primary.step')
if not os.path.exists(step_path):
    with open(step_path, 'w', encoding='utf-8') as f:
        f.write("ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Sodium Acetate Drink Straw CAD Primary'),'2;1');\nFILE_NAME('primary.step','2026-08-29',('TwinThink'),'','','','');\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;\n")

# 6. Detailed spec.md
spec_content = """# Specification: Sodium Acetate Thermal Straw (Resip)
Version: 1.0.0
Status: Prototype / Digital Twin Baseline

## 1. Operating Principle
The thermal straw utilizes the liquid-to-solid exothermic phase change of supersaturated sodium acetate trihydrate ($CH_3COONa \\cdot 3H_2O$) contained within an isolated annular outer jacket. Upon triggering nucleation, the latent heat of crystallization ($~264\\text{ J/g}$) is released at a stable phase-change temperature of $54^\\circ\\text{C}$ ($130^\\circ\\text{F}$).

## 2. Thermal & Physical Characteristics
- **Phase Change Core**: 50 grams of Sodium Acetate Trihydrate.
- **Liquid Path Volume**: 20 mL internal heat exchanger chamber.
- **Inner Wall Thermal Resistance ($R_{wall}$)**: $0.45\\text{ K/W}$ (Food-grade 316 Stainless / Conductive Elastomer).
- **Outer Wall Thermal Resistance ($R_{env}$)**: $2.2\\text{ K/W}$ (Insulated silicone outer jacket).
- **Target Discharge Profile**: 20–25 intermittent sips at $18^\\circ\\text{C}$ to $22^\\circ\\text{C}$ above ambient drink inlet temperature.

## 3. Disclaimers & Safety Verification
- **FOOD-CONTACT STATUS**: Prototype Stage. Food-grade contact certification pending.
- **PRESSURE RATING**: Non-pressurized ambient liquid flow.
- **REUSABILITY**: Reset core by submerging straw body in boiling water for 10 minutes until crystal matrix fully liquefies.
"""
with open(os.path.join(BUNDLE_DIR, 'spec.md'), 'w', encoding='utf-8') as f:
    f.write(spec_content)

# 7. Comprehensive manifest.json
manifest = {
    "version": "1.0.0",
    "title": "Sodium Acetate Heat-Releasing Drink Straw",
    "summary": "Phase-change thermal straw incorporating a supersaturated sodium acetate crystallization jacket and dynamic lumped capacitance simulation model.",
    "license": "CERN-OHL-S-2.0",
    "ontology_class": "PhysicalObject",
    "properties": [
        { "key": "estimated_bom_usd", "value": 4.50, "type": "number", "unit": "USD", "label": "Estimated BOM" },
        { "key": "weight_grams", "value": 45, "type": "number", "unit": "g", "label": "Weight" },
        { "key": "difficulty", "value": "intermediate", "type": "string", "label": "Difficulty" },
        { "key": "pcm_core_mass", "value": 50, "type": "number", "unit": "g", "label": "PCM Core Mass" },
        { "key": "latent_heat_release", "value": 13.2, "type": "number", "unit": "kJ", "label": "Latent Heat Capacity" },
        { "key": "peak_core_temp", "value": 54.0, "type": "number", "unit": "°C", "label": "Peak Core Temp" }
    ],
    "simulation": {
        "engine": "lumped_euler_v1",
        "entrypoint": "simulation/model.py",
        "parameters": "simulation/parameters.json",
        "results": "simulation/simulation_results.json"
    },
    "relationships": [],
    "assets": [
        { "relative_path": "README.md", "media_type": "text/markdown", "is_entrypoint": 1, "entrypoint_name": "readme" },
        { "relative_path": "spec.md", "media_type": "text/markdown", "is_entrypoint": 1, "entrypoint_name": "spec" },
        { "relative_path": "bom.csv", "media_type": "text/csv", "is_entrypoint": 1, "entrypoint_name": "bom" },
        { "relative_path": "cad/preview.glb", "media_type": "model/gltf-binary", "is_entrypoint": 1, "entrypoint_name": "cad_preview" },
        { "relative_path": "cad/primary.step", "media_type": "application/step", "is_entrypoint": 1, "entrypoint_name": "cad_step" },
        { "relative_path": "simulation/model.py", "media_type": "text/x-python", "is_entrypoint": 1, "entrypoint_name": "sim_model" },
        { "relative_path": "simulation/parameters.json", "media_type": "application/json", "is_entrypoint": 1, "entrypoint_name": "sim_params" },
        { "relative_path": "simulation/simulation_results.json", "media_type": "application/json", "is_entrypoint": 1, "entrypoint_name": "sim_results" },
        { "relative_path": "testing/test-results.csv", "media_type": "text/csv", "is_entrypoint": 1, "entrypoint_name": "test_data" },
        { "relative_path": "testing/calibration.json", "media_type": "application/json", "is_entrypoint": 0, "entrypoint_name": "" }
    ]
}
with open(os.path.join(BUNDLE_DIR, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

# 8. Create clean ZIP with normalized forward slashes
with zipfile.ZipFile(ZIP_OUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(BUNDLE_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, BUNDLE_DIR).replace('\\', '/')
            zf.write(full_path, rel_path)

print("Packaged Digital Twin Bundle successfully to:", ZIP_OUT)
