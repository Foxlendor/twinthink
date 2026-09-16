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

class MaterialSpec(BaseModel):
    name: str
    grade: Optional[str] = None
    standard: Optional[str] = None
    origin_country: Optional[str] = None
    recycled_content_pct: Optional[float] = None
    notes: Optional[str] = None

class ManufacturingSpec(BaseModel):
    process: Optional[str] = None
    finish: Optional[str] = None
    tolerances: Optional[str] = None
    processing_cost: Optional[float] = None

class CostSpec(BaseModel):
    unit_cost: Optional[float] = None
    extended_cost: Optional[float] = None
    currency: str = "USD"
    is_estimated: bool = False

NodeType = Literal["assembly", "subassembly", "component", "raw_material", "fastener"]

DeclaredRightsMode = Literal["Private", "Licensed", "Open Development", "Public Domain Dedication", "Conditional Release"]

class RightsPolicyDeclaration(BaseModel):
    mode: DeclaredRightsMode = "Open Development"
    scope: str = "twin"  # 'twin', 'design', 'bom', 'evidence', etc.
    terms_uri: Optional[str] = None
    declared_by: Optional[str] = None  # did:twin:<hex_pubkey>
    declared_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    notes: Optional[str] = None

class ProvenanceEntry(BaseModel):
    source: str = "tt"
    artifact_hash: Optional[str] = None
    captured_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    creator: str = "Anonymous"
    creator_identity: Optional[str] = None  # did:twin:<hex_pubkey>
    action: str = "created"
    revision: Optional[str] = None  # e.g. R0, R1
    signature: Optional[str] = None  # Ed25519 hex signature over entry payload
    notes: Optional[str] = None

class BomNode(BaseModel):
    node_id: str
    parent_id: Optional[str] = None
    node_type: NodeType = "component"
    name: str
    part_number: Optional[str] = None
    revision: Optional[str] = "R1"
    description: Optional[str] = ""
    quantity: float = 1.0
    unit: str = "ea"
    material: Optional[MaterialSpec] = None
    manufacturing: Optional[ManufacturingSpec] = None
    cost: Optional[CostSpec] = None
    supplier: Optional[str] = None
    dpp_id: Optional[str] = None
    cad_body_name: Optional[str] = None
    provenance: List[ProvenanceEntry] = Field(default_factory=list)
    rights_override: Optional[DeclaredRightsMode] = None
    evidence_refs: List[str] = Field(default_factory=list)
    children: List["BomNode"] = Field(default_factory=list)

class ComponentItem(BaseModel):
    name: str
    description: str = ""
    material: str = "Standard"
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
    declared_rights_mode: DeclaredRightsMode = "Open Development"  # Creator distribution intent, not legal warranty
    version: str = "1.0.0"
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

class TwinObjectGeometry(BaseModel):
    cad_step_path: Optional[str] = None
    cad_preview_glb_path: Optional[str] = None
    bounding_box_mm: Optional[List[float]] = None
    mass_grams: Optional[float] = None

class TwinStructure(BaseModel):
    components: List[ComponentItem] = Field(default_factory=list)
    bom_root: Optional[BomNode] = None
    bom_nodes: List[BomNode] = Field(default_factory=list)
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
    rights_policy: Optional[RightsPolicyDeclaration] = None

def resolve_node_rights(twin: TwinDocument, node_id: str) -> DeclaredRightsMode:
    """
    Resolves the effective rights mode for a specific BOM node within a TwinDocument:
    1. If the node has an explicit rights_override, that override takes precedence.
    2. Otherwise, walk up the parent chain; if any ancestor defines a rights_override, inherit it.
    3. Fall back to twin.rights_policy.mode (if present), or twin.identity.declared_rights_mode.
    """
    node_map: Dict[str, BomNode] = {n.node_id: n for n in twin.structure.bom_nodes}
    if not node_map and twin.structure.bom_root:
        def _collect(n: BomNode):
            node_map[n.node_id] = n
            for c in n.children:
                _collect(c)
        _collect(twin.structure.bom_root)

    curr = node_map.get(node_id)
    while curr:
        if curr.rights_override:
            return curr.rights_override
        curr = node_map.get(curr.parent_id) if curr.parent_id else None

    if twin.rights_policy:
        return twin.rights_policy.mode
    return twin.identity.declared_rights_mode
