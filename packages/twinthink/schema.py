"""
TwinThink Authoritative Twin Data Schema (v0.1)
Defines the 8-node core schema for living digital twins (.twin / twin.json).
"""

from typing import List, Dict, Any, Optional, Literal, Union
from pydantic import BaseModel, Field
import datetime

EpistemicStatus = Literal[
    "VERIFIED",
    "ESTABLISHED",
    "EXPERIMENTAL",
    "PARTIALLY_ESTABLISHED",
    "ESTIMATED",
    "ASSUMED",
    "CONCEPTUAL",
    "UNKNOWN",
    "LITERATURE",
    "MEASURED",
    "CALIBRATED"
]

class Author(BaseModel):
    name: str = "John Troy Thompson"
    handle: str = "foxlendor"

class Identity(BaseModel):
    twin_id: str = "twin_0001"
    slug: str = "resip-thermal-straw"
    title: str = "RESIP™"
    subtitle: str = "Thermal Drink Straw"
    version: str = "1.0.0"
    author: Author = Field(default_factory=Author)
    license: str = "CERN-OHL-S-2.0"
    created_at: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

class RealityDimension(BaseModel):
    status: str
    confidence: float
    reason: str

class RealityState(BaseModel):
    composite_score: float
    derived_dimensions: Dict[str, RealityDimension]

class ClaimSource(BaseModel):
    type: str
    reference: str

class ClaimValue(BaseModel):
    magnitude: Union[float, int, str]
    unit: Optional[str] = None
    tolerance: Optional[str] = None
    currency: Optional[str] = None

class Claim(BaseModel):
    id: str
    target_node: str
    statement: str
    value: Optional[Union[ClaimValue, Dict[str, Any], Any]] = None
    epistemic_status: EpistemicStatus = "UNKNOWN"
    confidence: float = 0.5
    source: ClaimSource
    evidence_ids: List[str] = Field(default_factory=list)
    relationships: List[str] = Field(default_factory=list)

class ObjectLayer(BaseModel):
    id: str
    name: str
    role: str

class TwinObject(BaseModel):
    primary_3d: str = "assets/cad/preview.glb"
    cad_source: str = "assets/cad/primary.step"
    layers: List[ObjectLayer] = Field(default_factory=list)

class Component(BaseModel):
    id: str
    name: str
    qty: int = 1
    unit_cost: float = 0.0
    material: str
    supplier: Optional[str] = None

class TwinStructure(BaseModel):
    bom_file: str = "structure/bom.csv"
    component_count: int = 0
    components: List[Component] = Field(default_factory=list)

class TwinBehavior(BaseModel):
    solver: str = "Euler-4Node-ODE"
    governing_equations: List[str] = Field(default_factory=list)
    parameters: Dict[str, Any] = Field(default_factory=dict)

class EvidenceTestRun(BaseModel):
    id: str
    date: str
    file: str
    type: str
    rmse: Optional[float] = None

class TwinEvidence(BaseModel):
    test_runs: List[EvidenceTestRun] = Field(default_factory=list)

class HistoryEstablishedNode(BaseModel):
    date: str
    title: str
    source: str
    provenance_level: str = "ESTABLISHED"

class TwinHistory(BaseModel):
    curated_manifest: str = "history/journal_manifest.json"
    established_nodes: List[HistoryEstablishedNode] = Field(default_factory=list)

class TwinLineage(BaseModel):
    parent: Optional[str] = None
    forks_count: int = 0
    mutations: List[Dict[str, Any]] = Field(default_factory=list)

class UnknownRisk(BaseModel):
    id: str
    category: str
    issue: str

class TwinDocument(BaseModel):
    schema_url: str = Field(default="https://twinth.ink/schemas/twin.v0.1.json", alias="$schema")
    identity: Identity
    reality_state: RealityState
    claims: List[Claim] = Field(default_factory=list)
    object: TwinObject
    structure: TwinStructure
    behavior: TwinBehavior
    evidence: TwinEvidence
    history: TwinHistory
    lineage: TwinLineage
    unknowns: List[UnknownRisk] = Field(default_factory=list)

    class Config:
        populate_by_name = True
