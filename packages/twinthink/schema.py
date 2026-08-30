"""
TwinThink Authoritative Twin Data Schema
Defines the core data model for living digital twins (.twin / twin.json)
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
import datetime

EpistemicStatus = Literal["VERIFIED", "EXPERIMENTAL", "ESTIMATED", "ASSUMED", "UNKNOWN", "LITERATURE", "MEASURED", "CALIBRATED"]

class Claim(BaseModel):
    key: str
    name: str
    value: Any
    unit: Optional[str] = None
    status: EpistemicStatus = "UNKNOWN"
    confidence_pct: int = 50
    origin: str = "Extracted from source document"
    source_file: Optional[str] = None
    evidence_paths: List[str] = Field(default_factory=list)
    relationships: List[str] = Field(default_factory=list)
    improvement_action: Optional[str] = None

class ComponentItem(BaseModel):
    name: str
    description: str
    material: str
    qty: int = 1
    unit_cost_usd: Optional[float] = None
    supplier: Optional[str] = None
    cad_body_name: Optional[str] = None

class RealityDimensionState(BaseModel):
    status: Literal["Verified", "Experimental", "Partial", "Unvalidated", "Concept", "Unknown"]
    score_pct: int
    evidence_count: int
    rationale: str

class RealityState(BaseModel):
    structural: RealityDimensionState
    thermal: RealityDimensionState
    material: RealityDimensionState
    safety: RealityDimensionState
    manufacturing: RealityDimensionState
    overall_score_pct: int

class TwinIdentity(BaseModel):
    title: str
    summary: str
    classification: str = "PhysicalObject"
    creator: str = "Anonymous"
    license: str = "CERN-OHL-S-2.0"
    version: str = "1.0.0"
    created_at: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

class TwinObjectGeometry(BaseModel):
    cad_step_path: Optional[str] = None
    cad_preview_glb_path: Optional[str] = None
    bounding_box_mm: Optional[List[float]] = None
    mass_grams: Optional[float] = None

class TwinStructure(BaseModel):
    components: List[ComponentItem] = Field(default_factory=list)
    materials: List[str] = Field(default_factory=list)
    estimated_bom_usd: Optional[float] = None
    target_msrp_usd: Optional[float] = None

class TwinBehavior(BaseModel):
    engine_name: Optional[str] = None
    entrypoint_script: Optional[str] = None
    parameters_path: Optional[str] = None
    simulation_results_path: Optional[str] = None
    operating_envelope: Dict[str, Any] = Field(default_factory=dict)

class TwinEvidence(BaseModel):
    test_runs_count: int = 0
    calibration_rmse: Optional[float] = None
    sensor_channels: List[str] = Field(default_factory=list)
    verified_files: List[str] = Field(default_factory=list)

class TwinHistoryEntry(BaseModel):
    page: Optional[int] = None
    year: Optional[str] = None
    title: str
    caption: str
    asset_path: str
    relationship_to_twin: Literal["not_established", "ancestor_candidate", "verified_prototype"] = "not_established"

class TwinLineage(BaseModel):
    parent_twin_id: Optional[str] = None
    parent_version: Optional[str] = None
    mutation_notes: Optional[str] = None
    forks: List[str] = Field(default_factory=list)

class TwinDocument(BaseModel):
    schema_version: str = "1.0.0"
    identity: TwinIdentity
    object: TwinObjectGeometry
    structure: TwinStructure
    behavior: TwinBehavior
    evidence: TwinEvidence
    history: List[TwinHistoryEntry] = Field(default_factory=list)
    lineage: TwinLineage
    claims: List[Claim] = Field(default_factory=list)
    reality_state: RealityState
    unknowns_and_assumptions: List[str] = Field(default_factory=list)
