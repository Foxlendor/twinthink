"""
TwinThink Factory Ingestion & Compilation Engine
Transforms raw files (CAD, Markdown, CSVs, Images) into structured living digital twins.
"""

import os
import io
import csv
import json
import re
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path

from ..schema import (
    TwinDocument,
    TwinIdentity,
    TwinObjectGeometry,
    TwinStructure,
    TwinBehavior,
    TwinEvidence,
    TwinHistoryEntry,
    TwinLineage,
    Claim,
    ComponentItem,
    BomNode,
    ProvenanceEntry
)
from ..reality.calculator import derive_reality_state
from ..simulation.calibration import calculate_error_metrics
from ..bom import (
    parse_bom_csv,
    parse_bom_dict,
    flatten_bom_tree,
    convert_leaves_to_component_items,
    CyclicBomError,
    OrphanBomNodeError
)

class TwinFactoryEngine:
    @staticmethod
    def process_bundle(file_map: Dict[str, bytes], twin_id: str = "0001", creator: str = "Anonymous") -> TwinDocument:
        """
        Parses a dictionary of {relative_path: raw_bytes} and compiles a complete TwinDocument.
        """
        filenames = list(file_map.keys())
        
        # 1. Check for existing manifest.json
        manifest_data = {}
        for name, data in file_map.items():
            if name.lower() == "manifest.json" or name.lower().endswith("/manifest.json"):
                try:
                    manifest_data = json.loads(data.decode("utf-8", errors="ignore"))
                except Exception:
                    pass
                break

        # 2. Identity & Overview extraction
        title = manifest_data.get("title") or "Untitled Physical Invention"
        summary = manifest_data.get("summary") or "Living digital twin compiled from engineering files."
        classification = manifest_data.get("ontology_class") or manifest_data.get("classification") or "PhysicalObject"
        license_type = manifest_data.get("license") or "CERN-OHL-S-2.0"
        version_str = manifest_data.get("version") or manifest_data.get("semver") or "1.0.0"
        
        readme_content = ""
        spec_content = ""
        
        for name, data in file_map.items():
            if name.lower().endswith("readme.md"):
                try:
                    readme_content = data.decode("utf-8", errors="ignore")
                    lines = [l.strip() for l in readme_content.splitlines() if l.strip()]
                    if lines and lines[0].startswith("#") and title == "Untitled Physical Invention":
                        title = lines[0].lstrip("#").strip()
                    if len(lines) > 1 and summary == "Living digital twin compiled from engineering files.":
                        summary = lines[1].lstrip(">").strip()
                except Exception:
                    pass
            elif name.lower().endswith("spec.md"):
                try:
                    spec_content = data.decode("utf-8", errors="ignore")
                except Exception:
                    pass

        # 3. Extract Hierarchical BOM
        bom_root: Optional[BomNode] = None
        bom_nodes: List[BomNode] = []
        components: List[ComponentItem] = []
        estimated_bom: Optional[float] = None
        
        # Check for bom.json first, then bom.csv
        bom_json_key = next((k for k in file_map if k.lower().endswith("bom.json")), None)
        if bom_json_key:
            try:
                bom_dict = json.loads(file_map[bom_json_key].decode("utf-8", errors="ignore"))
                bom_root = parse_bom_dict(bom_dict, root_title=title)
                bom_nodes = flatten_bom_tree(bom_root)
                components = convert_leaves_to_component_items(bom_root)
                if bom_root.cost and bom_root.cost.unit_cost is not None:
                    estimated_bom = bom_root.cost.unit_cost
            except (CyclicBomError, OrphanBomNodeError):
                raise
            except Exception:
                pass

        if not bom_root:
            bom_csv_key = next((k for k in file_map if k.lower().endswith("bom.csv")), None)
            if bom_csv_key:
                try:
                    csv_text = file_map[bom_csv_key].decode("utf-8", errors="ignore")
                    bom_root = parse_bom_csv(csv_text, root_title=title)
                    bom_nodes = flatten_bom_tree(bom_root)
                    components = convert_leaves_to_component_items(bom_root)
                    if bom_root.cost and bom_root.cost.unit_cost is not None:
                        estimated_bom = bom_root.cost.unit_cost
                except (CyclicBomError, OrphanBomNodeError):
                    raise
                except Exception:
                    pass

        # 4. CAD & Solid Geometry (.step, .stl, .glb)
        step_path = next((f for f in filenames if f.lower().endswith(('.step', '.stp', '.stl'))), None)
        glb_path = next((f for f in filenames if f.lower().endswith('.glb')), None)
        has_step = step_path is not None
        
        # Extract geometry metrics only if present in manifest properties
        bounding_box = None
        mass_val = None
        for prop in manifest_data.get("properties", []):
            k = prop.get("key", "").lower()
            if "bounding_box" in k and isinstance(prop.get("value"), list):
                bounding_box = prop.get("value")
            elif "mass" in k or "weight" in k:
                try:
                    mass_val = float(prop.get("value"))
                except (ValueError, TypeError):
                    pass

        obj_geom = TwinObjectGeometry(
            cad_step_path=step_path,
            cad_preview_glb_path=glb_path,
            bounding_box_mm=bounding_box,
            mass_grams=mass_val
        )

        # 5. Behavior & Simulation
        sim_script = next((f for f in filenames if f.lower().endswith(('.py')) and ('sim' in f.lower() or 'model' in f.lower())), None)
        params_path = next((f for f in filenames if 'param' in f.lower() and f.lower().endswith('.json')), None)
        sim_results_path = next((f for f in filenames if ('result' in f.lower() or 'sim' in f.lower()) and f.lower().endswith('.json')), None)

        behavior = TwinBehavior(
            engine_name="simulation" if sim_script else None,
            entrypoint_script=sim_script,
            parameters_path=params_path,
            simulation_results_path=sim_results_path,
            operating_envelope={}
        )

        # 6. Physical Evidence & Calibration Calculation
        test_files = [f for f in filenames if any(k in f.lower() for k in ['test', 'telemetry', 'bench']) and f.lower().endswith('.csv')]
        has_tests = len(test_files) > 0
        sensor_channels: List[str] = []
        calibration_rmse: Optional[float] = None
        
        # Read sensor channels and series from test CSV if available
        test_series: List[float] = []
        if has_tests:
            try:
                test_csv_data = file_map[test_files[0]].decode("utf-8", errors="ignore")
                csv_reader = csv.DictReader(io.StringIO(test_csv_data))
                if csv_reader.fieldnames:
                    sensor_channels = [c for c in csv_reader.fieldnames if c not in ['time_seconds', 'timestamp_s', 'time', 'timestamp_ms', 'index']]
                    # Attempt to extract numeric series from the first non-time sensor column
                    col_to_use = next((c for c in ['T_beverage_chamber_C', 'outlet_C', 'measured', 'temp', 'temperature'] if c in csv_reader.fieldnames), None)
                    if not col_to_use and sensor_channels:
                        col_to_use = sensor_channels[0]
                    if col_to_use:
                        for r in csv_reader:
                            try:
                                test_series.append(float(r[col_to_use]))
                            except (ValueError, TypeError):
                                pass
            except Exception:
                pass

        # Try to read simulation series if simulation results JSON is available
        sim_series: List[float] = []
        if sim_results_path and sim_results_path in file_map:
            try:
                sim_json = json.loads(file_map[sim_results_path].decode("utf-8", errors="ignore"))
                # Look for array of floats
                for key in ['beverage_temp_C', 'outlet_C', 'simulated', 'values', 'output', 'temperature']:
                    if key in sim_json and isinstance(sim_json[key], list) and len(sim_json[key]) > 0:
                        sim_series = [float(v) for v in sim_json[key] if isinstance(v, (int, float))]
                        break
            except Exception:
                pass

        # If both series exist, compute real error metrics
        if sim_series and test_series:
            metrics = calculate_error_metrics(sim_series, test_series)
            calibration_rmse = metrics.get("rmse_C")

        evidence_files = [f for f in filenames if f.lower().endswith(('.csv', '.step', '.stp', '.glb', '.py', '.json', '.md'))]

        evidence = TwinEvidence(
            test_runs_count=len(test_files),
            calibration_rmse=calibration_rmse,
            sensor_channels=sensor_channels,
            verified_files=evidence_files
        )

        # 7. Extract Claims (Honest, derived from source files)
        claims: List[Claim] = []
        if estimated_bom is not None:
            claims.append(Claim(
                key="estimated_bom_usd",
                name="Unit BOM (COGS)",
                value=f"${estimated_bom:.2f} USD",
                unit="USD",
                status="MEASURED",
                confidence_pct=85,
                origin="Calculated from component BOM entries.",
                source_file="bom.csv",
                evidence_paths=[f for f in filenames if 'bom' in f.lower()]
            ))

        for c in components:
            if c.material and c.material != "Standard":
                claims.append(Claim(
                    key=f"material_{re.sub(r'[^a-zA-Z0-9_]', '_', c.name.lower())}",
                    name=f"Material: {c.name}",
                    value=c.material,
                    status="VERIFIED" if c.supplier else "ESTIMATED",
                    confidence_pct=90 if c.supplier else 60,
                    origin=f"Specified in BOM for {c.name}" + (f" (Supplier: {c.supplier})" if c.supplier else ""),
                    source_file="bom.csv",
                    relationships=[f"component:{c.name}"]
                ))

        if step_path:
            claims.append(Claim(
                key="cad_solid_geometry",
                name="Solid CAD Model",
                value=step_path,
                status="VERIFIED",
                confidence_pct=95,
                origin="Parametric solid geometry detected.",
                source_file=step_path,
                evidence_paths=[step_path],
                relationships=[c.name for c in components]
            ))

        if sim_script:
            claims.append(Claim(
                key="behavior_simulation_model",
                name="Physics Governing Solver",
                value=sim_script,
                status="CALIBRATED" if calibration_rmse is not None else "EXPERIMENTAL",
                confidence_pct=90 if calibration_rmse is not None else 65,
                origin="ODE governing equations and thermodynamic simulation.",
                source_file=sim_script,
                evidence_paths=[sim_script],
                relationships=["structure:assembly"]
            ))

        if calibration_rmse is not None:
            claims.append(Claim(
                key="calibration_error_residual",
                name="Empirical Sensor Calibration",
                value=f"RMSE = {calibration_rmse:.2f}°C",
                unit="°C",
                status="VERIFIED" if calibration_rmse <= 4.0 else "EXPERIMENTAL",
                confidence_pct=95 if calibration_rmse <= 4.0 else 70,
                origin="Residual error calculated against physical thermocouple telemetry.",
                source_file=test_files[0] if test_files else "telemetry.csv",
                evidence_paths=test_files,
                relationships=["behavior:simulation"]
            ))

        # 8. Reality State Calculation
        reality_state = derive_reality_state(
            files=filenames,
            claims=claims,
            has_step_cad=has_step,
            has_test_telemetry=has_tests,
            has_simulation_ode=bool(behavior.entrypoint_script),
            rmse_error=evidence.calibration_rmse
        )

        # 9. Build Unknowns and Assumptions
        unknowns = []
        if not obj_geom.cad_step_path:
            unknowns.append("Dimensional CAD solid model (STEP) not provided.")
        if not components:
            unknowns.append("Structured bill of materials (BOM) pending specification.")
        if not has_tests:
            unknowns.append("Physical bench testing and experimental telemetry pending.")
        elif calibration_rmse is None:
            unknowns.append("Simulation model calibration against physical test data pending.")
        if obj_geom.bounding_box_mm is None:
            unknowns.append("Physical dimensions and geometric envelope unverified.")

        # 10. Compile Final Document
        doc = TwinDocument(
            identity=TwinIdentity(
                title=title,
                summary=summary,
                classification=classification,
                creator=creator,
                license=license_type,
                version=version_str
            ),
            object=obj_geom,
            structure=TwinStructure(
                bom_root=bom_root,
                bom_nodes=bom_nodes,
                components=components,
                materials=list(set(c.material for c in components if c.material)),
                estimated_bom_usd=estimated_bom,
                target_msrp_usd=None
            ),
            behavior=behavior,
            evidence=evidence,
            history=[],
            lineage=TwinLineage(parent_twin_id=manifest_data.get("parent_twin")),
            claims=claims,
            reality_state=reality_state,
            unknowns_and_assumptions=unknowns
        )
        return doc
