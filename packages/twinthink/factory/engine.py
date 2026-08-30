"""Twin Factory: evidence-preserving compilation of source material into a Twin."""

from __future__ import annotations

import csv
import io
import json
import re
from pathlib import PurePosixPath
from typing import Dict, Any

from ..schema import (
    TwinDocument,
    TwinIdentity,
    TwinObjectGeometry,
    TwinStructure,
    TwinBehavior,
    TwinEvidence,
    TwinHistoryEntry,
    TwinLineage,
    ComponentItem,
)
from ..reality.calculator import derive_reality_state


class TwinFactoryEngine:
    """Compile raw invention material without fabricating technical facts.

    The factory performs deterministic extraction only. Claims that require
    interpretation are left empty for a later proposal/review stage.
    """

    @staticmethod
    def _text(file_map: Dict[str, bytes], suffixes: tuple[str, ...]) -> str:
        for name, data in file_map.items():
            if name.lower().endswith(suffixes):
                return data.decode("utf-8", errors="replace")
        return ""

    @staticmethod
    def _title_and_summary(file_map: Dict[str, bytes], fallback: str) -> tuple[str, str]:
        readme = TwinFactoryEngine._text(file_map, ("readme.md", "readme.txt"))
        spec = TwinFactoryEngine._text(file_map, ("spec.md", "specification.md"))
        source = readme or spec
        lines = [line.strip() for line in source.splitlines() if line.strip()]
        title = fallback
        summary = "Living digital twin compiled from supplied source material."
        for line in lines:
            if line.startswith("#"):
                title = line.lstrip("#").strip() or fallback
                break
        for line in lines:
            cleaned = line.lstrip(">-*").strip()
            if cleaned and not cleaned.startswith("#"):
                summary = cleaned[:500]
                break
        return title, summary

    @staticmethod
    def _safe_name(name: str) -> str:
        # Normalize zip paths for deterministic output and provenance.
        return str(PurePosixPath(name.replace("\\", "/")))

    @staticmethod
    def _bom(file_map: Dict[str, bytes]) -> tuple[list[ComponentItem], float | None, str | None]:
        for name, data in file_map.items():
            if not name.lower().endswith("bom.csv"):
                continue
            try:
                reader = csv.DictReader(io.StringIO(data.decode("utf-8", errors="replace")))
                components: list[ComponentItem] = []
                for raw in reader:
                    row = {str(k).strip().lower(): (v or "").strip() for k, v in raw.items() if k}
                    component_name = row.get("part") or row.get("component") or row.get("name")
                    if not component_name:
                        continue
                    try:
                        qty = max(1, int(float(row.get("qty") or row.get("quantity") or 1)))
                    except ValueError:
                        qty = 1
                    cost_raw = row.get("unit_cost_usd") or row.get("unit cost") or row.get("unit_cost")
                    unit_cost = None
                    if cost_raw:
                        try:
                            unit_cost = float(re.sub(r"[^0-9.\-]", "", cost_raw))
                        except ValueError:
                            unit_cost = None
                    components.append(ComponentItem(
                        name=component_name,
                        description=row.get("description") or row.get("specification") or row.get("desc") or "",
                        material=row.get("material") or "Unspecified",
                        qty=qty,
                        unit_cost_usd=unit_cost,
                        supplier=row.get("supplier") or None,
                        cad_body_name=row.get("cad_body_name") or None,
                    ))
                if components:
                    total = sum((c.unit_cost_usd or 0) * c.qty for c in components)
                    return components, round(total, 4), name
            except (UnicodeError, csv.Error):
                pass
        return [], None, None

    @staticmethod
    def process_bundle(
        file_map: Dict[str, bytes],
        twin_id: str = "0001",
        title: str | None = None,
        author: str = "Unknown",
    ) -> TwinDocument:
        filenames = sorted(TwinFactoryEngine._safe_name(name) for name in file_map)
        fallback_title = title or "Untitled Physical Invention"
        extracted_title, summary = TwinFactoryEngine._title_and_summary(file_map, fallback_title)
        if title:
            extracted_title = title

        components, bom_total, bom_file = TwinFactoryEngine._bom(file_map)

        step_path = next((f for f in filenames if f.lower().endswith((".step", ".stp"))), None)
        glb_path = next((f for f in filenames if f.lower().endswith(".glb")), None)
        object_geometry = TwinObjectGeometry(
            cad_step_path=step_path,
            cad_preview_glb_path=glb_path,
        )

        thermal_script = next((f for f in filenames if f.lower().endswith("thermal.py")), None)
        parameters = next((f for f in filenames if "param" in f.lower() and f.lower().endswith((".json", ".csv", ".txt"))), None)
        simulation_results = next((f for f in filenames if "result" in f.lower() and f.lower().endswith((".json", ".csv"))), None)
        test_files = [f for f in filenames if f.lower().endswith(".csv") and ("test" in f.lower() or "telemetry" in f.lower())]

        behavior = TwinBehavior(
            engine_name="twinthink.simulation.thermal" if thermal_script else None,
            entrypoint_script=thermal_script,
            parameters_path=parameters,
            simulation_results_path=simulation_results,
        )

        evidence = TwinEvidence(
            test_runs_count=len(test_files),
            calibration_rmse=None,
            sensor_channels=[],
            verified_files=[f for f in filenames if f.lower().endswith((".csv", ".step", ".stp", ".glb", ".py", ".json"))],
        )

        history: list[TwinHistoryEntry] = []
        for name, data in file_map.items():
            if not name.lower().endswith("journal_manifest.json"):
                continue
            try:
                manifest = json.loads(data.decode("utf-8", errors="replace"))
                for entry in manifest.get("entries", []):
                    history.append(TwinHistoryEntry(
                        page=entry.get("page"),
                        year=entry.get("year"),
                        title=entry.get("title") or "Archive page",
                        caption=entry.get("archive_caption") or entry.get("caption") or "",
                        asset_path=entry.get("asset_path") or entry.get("filename") or "",
                        relationship_to_twin="not_established",
                    ))
            except (ValueError, UnicodeError):
                pass
            break

        unknowns = []
        if not step_path and not glb_path:
            unknowns.append("Native or preview 3D geometry has not been supplied.")
        if not components:
            unknowns.append("No structured BOM was found; component structure remains unestablished.")
        if not thermal_script:
            unknowns.append("No governing simulation entrypoint was identified.")
        if not test_files:
            unknowns.append("No physical telemetry/test CSV was identified.")
        if not history:
            unknowns.append("No curated journal manifest was supplied.")
        unknowns.append("Technical claims have not been human-established by this deterministic ingestion pass.")

        claims: list = []
        draft = {
            "identity": {
                "title": extracted_title,
                "summary": summary,
                "version": "0.1.0",
                "creator": author,
                "license": "UNSPECIFIED",
            },
            "object": object_geometry.model_dump(),
            "structure": {
                "components": [c.model_dump() for c in components],
                "materials": sorted({c.material for c in components if c.material}),
                "estimated_bom_usd": bom_total,
            },
            "behavior": behavior.model_dump(),
            "evidence": evidence.model_dump(),
            "claims": claims,
            "unknowns_and_assumptions": unknowns,
        }

        reality_state = derive_reality_state(
            files=filenames,
            claims=claims,
            has_step_cad=bool(step_path),
            has_test_telemetry=bool(test_files),
            has_simulation_ode=bool(thermal_script),
            rmse_error=None,
        )

        return TwinDocument(
            schema_version="0.1.0",
            identity=TwinIdentity(
                title=extracted_title,
                summary=summary,
                classification="PhysicalObject",
                creator=author,
                license="UNSPECIFIED",
                version="0.1.0",
            ),
            object=object_geometry,
            structure=TwinStructure(
                components=components,
                materials=sorted({c.material for c in components if c.material}),
                estimated_bom_usd=bom_total,
            ),
            behavior=behavior,
            evidence=evidence,
            history=history,
            lineage=TwinLineage(parent_twin_id=None),
            claims=claims,
            reality_state=reality_state,
            unknowns_and_assumptions=unknowns,
        )
