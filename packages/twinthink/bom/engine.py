"""
TwinThink Canonical Hierarchical BOM & Cost Engine (M2)
Supports tree structure, multi-tier rollup, cycle detection, and honest missing-data handling.
"""

import csv
import io
import re
import json
import hashlib
from typing import List, Dict, Any, Optional, Union, Tuple, Set, Literal
from ..schema import BomNode, MaterialSpec, ManufacturingSpec, CostSpec, ComponentItem, NodeType, ProvenanceEntry

class CyclicBomError(ValueError):
    """Raised when a circular reference is detected in the Bill of Materials hierarchy."""
    pass

class OrphanBomNodeError(ValueError):
    """Raised when a BOM node references a non-existent parent_id."""
    pass

def validate_bom_orphans(nodes: Union[List[BomNode], List[Dict[str, Any]]]) -> None:
    """
    Validates that any node with a parent_id references a node that exists in the dataset.
    Raises OrphanBomNodeError if an orphan node is detected.
    """
    all_ids = set()
    for item in nodes:
        n_id = item.node_id if isinstance(item, BomNode) else str(item.get("node_id", ""))
        if n_id:
            all_ids.add(n_id)

    for item in nodes:
        n_id = item.node_id if isinstance(item, BomNode) else str(item.get("node_id", ""))
        p_id = item.parent_id if isinstance(item, BomNode) else item.get("parent_id")
        if p_id is not None:
            p_str = str(p_id).strip()
            if p_str and p_str.lower() not in ["", "none", "null"] and p_str not in all_ids:
                raise OrphanBomNodeError(f"Orphan BOM node detected: node '{n_id}' references non-existent parent_id '{p_id}'")

def validate_bom_acyclic(nodes_or_root: Union[List[BomNode], BomNode, List[Dict[str, Any]], Dict[str, Any]]) -> None:
    """
    Validates that a BOM graph has no directed cycles.
    Raises CyclicBomError if a cycle is detected.
    """
    # Build adjacency mapping: parent -> list of children
    adjacency: Dict[str, List[str]] = {}
    all_nodes: Set[str] = set()

    if isinstance(nodes_or_root, BomNode):
        visited_in_path: Set[str] = set()
        def _traverse(n: BomNode):
            all_nodes.add(n.node_id)
            if n.node_id not in adjacency:
                adjacency[n.node_id] = []
            if n.node_id in visited_in_path:
                raise CyclicBomError(f"Cyclic BOM dependency detected: node '{n.node_id}' appears multiple times in ancestor path")
            visited_in_path.add(n.node_id)
            for c in n.children:
                if c.node_id not in adjacency[n.node_id]:
                    adjacency[n.node_id].append(c.node_id)
                _traverse(c)
            visited_in_path.remove(n.node_id)
        _traverse(nodes_or_root)
    elif isinstance(nodes_or_root, list):
        for item in nodes_or_root:
            n_id = item.node_id if isinstance(item, BomNode) else str(item.get("node_id", ""))
            p_id = item.parent_id if isinstance(item, BomNode) else item.get("parent_id")
            if n_id:
                all_nodes.add(n_id)
                if n_id not in adjacency:
                    adjacency[n_id] = []
                if p_id:
                    p_id = str(p_id)
                    all_nodes.add(p_id)
                    if p_id not in adjacency:
                        adjacency[p_id] = []
                    adjacency[p_id].append(n_id)
                # Check direct children if object has them
                ch = item.children if isinstance(item, BomNode) else item.get("children", [])
                for c in ch:
                    c_id = c.node_id if isinstance(c, BomNode) else str(c.get("node_id", ""))
                    if c_id:
                        adjacency[n_id].append(c_id)
                        all_nodes.add(c_id)
    elif isinstance(nodes_or_root, dict):
        visited_in_path: Set[str] = set()
        def _traverse_dict(d: Dict[str, Any]):
            n_id = str(d.get("node_id", ""))
            if n_id:
                all_nodes.add(n_id)
                if n_id not in adjacency:
                    adjacency[n_id] = []
                if n_id in visited_in_path:
                    raise CyclicBomError(f"Cyclic BOM dependency detected: node '{n_id}' appears multiple times in ancestor path")
                visited_in_path.add(n_id)
                ch = d.get("children", [])
                for c in ch:
                    c_id = str(c.get("node_id", ""))
                    if c_id:
                        if c_id not in adjacency[n_id]:
                            adjacency[n_id].append(c_id)
                        _traverse_dict(c)
                visited_in_path.remove(n_id)
        _traverse_dict(nodes_or_root)

    # 3-color DFS cycle detection: 0 = unvisited, 1 = visiting (in stack), 2 = visited
    state: Dict[str, int] = {node: 0 for node in all_nodes}
    path: List[str] = []

    def dfs(node: str):
        state[node] = 1
        path.append(node)
        for neighbor in adjacency.get(node, []):
            if neighbor == node:
                raise CyclicBomError(f"Self-referential cyclic BOM detected on node '{node}'")
            if state.get(neighbor, 0) == 1:
                cycle_idx = path.index(neighbor)
                cycle_path = " -> ".join(path[cycle_idx:] + [neighbor])
                raise CyclicBomError(f"Cyclic BOM dependency detected: {cycle_path}")
            elif state.get(neighbor, 0) == 0:
                dfs(neighbor)
        path.pop()
        state[node] = 2

    for node in all_nodes:
        if state[node] == 0:
            dfs(node)

def calculate_bom_costs(root: BomNode) -> BomNode:
    """
    Bottom-up cost calculation:
    - Leaf: extended_cost = unit_cost * quantity
    - Assembly: unit_cost = sum(child.extended_cost) + processing_cost + finishing_cost
                extended_cost = unit_cost * quantity
    - Missing data honesty: if any constituent child cost is unknown (None),
      the assembly cost is None (or honest unknown).
    """
    if not root.children:
        # Leaf node
        if root.cost:
            if root.cost.unit_cost is not None:
                root.cost.extended_cost = round(root.cost.unit_cost * root.quantity, 2)
            else:
                root.cost.extended_cost = None
        return root

    # Internal node: recursively compute children first
    all_children_known = True
    children_total = 0.0

    for child in root.children:
        calculate_bom_costs(child)
        if child.cost and child.cost.extended_cost is not None:
            children_total += child.cost.extended_cost
        else:
            all_children_known = False

    proc_cost = 0.0
    if root.manufacturing and root.manufacturing.processing_cost is not None:
        proc_cost = root.manufacturing.processing_cost

    if all_children_known:
        unit_c = round(children_total + proc_cost, 2)
        ext_c = round(unit_c * root.quantity, 2)
        if not root.cost:
            root.cost = CostSpec(unit_cost=unit_c, extended_cost=ext_c, currency="USD")
        else:
            root.cost.unit_cost = unit_c
            root.cost.extended_cost = ext_c
    else:
        # Honest missing data: do not fabricate total
        if not root.cost:
            root.cost = CostSpec(unit_cost=None, extended_cost=None, currency="USD")
        else:
            root.cost.unit_cost = None
            root.cost.extended_cost = None

    return root

def flatten_bom_tree(root: BomNode) -> List[BomNode]:
    """Flattens a hierarchical BOM tree into a list of nodes with parent_id preserved."""
    result: List[BomNode] = []

    def _traverse(node: BomNode, parent_id: Optional[str] = None):
        flat_copy = node.model_copy(update={"parent_id": parent_id, "children": []})
        result.append(flat_copy)
        for child in node.children:
            _traverse(child, node.node_id)

    _traverse(root, root.parent_id)
    return result

def build_bom_tree(nodes: List[BomNode]) -> BomNode:
    """Reconstructs a nested BomNode tree from a list of nodes with parent_id references."""
    validate_bom_orphans(nodes)
    validate_bom_acyclic(nodes)

    node_map: Dict[str, BomNode] = {n.node_id: n.model_copy(update={"children": []}) for n in nodes}
    roots: List[BomNode] = []

    for n in nodes:
        current = node_map[n.node_id]
        if n.parent_id and n.parent_id in node_map:
            node_map[n.parent_id].children.append(current)
        else:
            roots.append(current)

    if not roots:
        raise ValueError("No root node found in BOM")
    if len(roots) == 1:
        root = roots[0]
    else:
        # Create an umbrella assembly root if multiple top-level nodes exist
        root = BomNode(
            node_id="root_assembly",
            node_type="assembly",
            name="Top Level Assembly",
            quantity=1.0,
            children=roots
        )

    calculate_bom_costs(root)
    return root

def extract_leaf_components(root: BomNode) -> List[BomNode]:
    """Returns all leaf components (parts/fasteners without sub-assemblies)."""
    leaves: List[BomNode] = []

    def _collect(n: BomNode):
        if not n.children:
            leaves.append(n)
        else:
            for c in n.children:
                _collect(c)

    _collect(root)
    return leaves

def convert_leaves_to_component_items(root: BomNode) -> List[ComponentItem]:
    """Converts leaf nodes into legacy ComponentItem models for backward compatibility."""
    leaves = extract_leaf_components(root)
    components = []
    for leaf in leaves:
        mat_name = leaf.material.name if leaf.material else "Standard"
        if leaf.material and leaf.material.grade:
            mat_name = f"{mat_name} ({leaf.material.grade})"
        components.append(ComponentItem(
            name=leaf.name,
            description=leaf.description or "",
            material=mat_name,
            qty=int(leaf.quantity),
            unit_cost_usd=leaf.cost.unit_cost if leaf.cost else None,
            supplier=leaf.supplier,
            cad_body_name=leaf.cad_body_name
        ))
    return components

def parse_bom_csv(csv_text: str, root_title: str = "Root Assembly") -> BomNode:
    """
    Parses a BOM CSV into a canonical BomNode hierarchy.
    Supports:
    1. Hierarchical dot-notation level (e.g. 1, 1.1, 1.1.1, 1.2)
    2. Explicit node_id and parent_id columns
    3. Flat CSV (converted to root assembly + leaf components)
    """
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    if not rows:
        return BomNode(
            node_id="root",
            node_type="assembly",
            name=root_title,
            quantity=1.0,
            children=[]
        )

    # Normalize column names
    field_map = {}
    for f in (reader.fieldnames or []):
        field_map[f.lower().strip().replace(" ", "_")] = f

    has_level = any(k in field_map for k in ['level', 'item', 'bom_level'])
    has_parent_id = any(k in field_map for k in ['parent_id', 'parent_part_number', 'parent'])

    raw_nodes: List[Dict[str, Any]] = []

    def _extract_row_data(row_dict: Dict[str, str], idx: int) -> Dict[str, Any]:
        lower_row = {k.lower().strip().replace(" ", "_"): v.strip() for k, v in row_dict.items() if k}
        
        name = lower_row.get("part", lower_row.get("component", lower_row.get("name", f"Part {idx}")))
        part_num = lower_row.get("part_number", lower_row.get("pn", lower_row.get("part_no")))
        rev = lower_row.get("revision", lower_row.get("rev", "R1"))
        desc = lower_row.get("description", lower_row.get("spec", lower_row.get("specification", "")))
        
        # Quantity
        qty_val = 1.0
        for qk in ['qty', 'quantity', 'count']:
            if qk in lower_row and lower_row[qk]:
                try:
                    qty_val = float(lower_row[qk])
                    break
                except ValueError:
                    pass

        # Unit
        unit_val = lower_row.get("unit", "ea")

        # Material
        mat_str = lower_row.get("material", "")
        grade_str = lower_row.get("grade", lower_row.get("material_grade"))
        mat_spec = None
        if mat_str:
            mat_spec = MaterialSpec(name=mat_str, grade=grade_str)

        # Manufacturing
        proc_str = lower_row.get("process", lower_row.get("manufacturing_process"))
        finish_str = lower_row.get("finish", lower_row.get("surface_finish"))
        proc_cost = None
        if "processing_cost" in lower_row and lower_row["processing_cost"]:
            try:
                proc_cost = float(lower_row["processing_cost"].replace("$", ""))
            except ValueError:
                pass
        mfg_spec = None
        if proc_str or finish_str or proc_cost is not None:
            mfg_spec = ManufacturingSpec(process=proc_str, finish=finish_str, processing_cost=proc_cost)

        # Cost
        cost_val = None
        for ck in ['unit_cost', 'unit_cost_usd', 'cost', 'price']:
            if ck in lower_row and lower_row[ck]:
                try:
                    cost_val = float(lower_row[ck].replace("$", ""))
                    break
                except ValueError:
                    pass
        cost_spec = CostSpec(unit_cost=cost_val, currency=lower_row.get("currency", "USD")) if cost_val is not None else None

        # Node type
        type_str: NodeType = "component"
        t_in = lower_row.get("type", lower_row.get("node_type", "")).lower()
        if "assembly" in t_in:
            type_str = "assembly" if "sub" not in t_in else "subassembly"
        elif "fastener" in t_in or "screw" in name.lower() or "bolt" in name.lower() or "washer" in name.lower():
            type_str = "fastener"
        elif "raw" in t_in or "billet" in name.lower() or "stock" in name.lower():
            type_str = "raw_material"

        supplier = lower_row.get("supplier", lower_row.get("vendor"))
        dpp_id = lower_row.get("dpp_id", lower_row.get("passport_id"))

        node_id = lower_row.get("node_id") or (f"part_{part_num.lower()}" if part_num else f"node_{idx}")
        parent_id = lower_row.get("parent_id") or lower_row.get("parent_part_number") or lower_row.get("parent")
        if parent_id and str(parent_id).strip().lower() in ["", "none", "null"]:
            parent_id = None

        level_val = lower_row.get("level", lower_row.get("item", lower_row.get("bom_level", "")))

        return {
            "node_id": node_id,
            "parent_id": parent_id,
            "level": level_val,
            "node_type": type_str,
            "name": name,
            "part_number": part_num,
            "revision": rev,
            "description": desc,
            "quantity": qty_val,
            "unit": unit_val,
            "material": mat_spec,
            "manufacturing": mfg_spec,
            "cost": cost_spec,
            "supplier": supplier,
            "dpp_id": dpp_id
        }

    for i, r in enumerate(rows, 1):
        raw_nodes.append(_extract_row_data(r, i))

    # Case 1: Dot-level hierarchy (e.g. 1, 1.1, 1.2, 1.2.1)
    if has_level and any("." in str(n["level"]) for n in raw_nodes):
        level_map: Dict[str, str] = {}
        for n in raw_nodes:
            lvl = str(n["level"])
            level_map[lvl] = n["node_id"]
            if "." in lvl:
                parent_lvl = ".".join(lvl.split(".")[:-1])
                if parent_lvl in level_map:
                    n["parent_id"] = level_map[parent_lvl]

    # Convert to BomNode objects
    bom_nodes: List[BomNode] = []
    for n in raw_nodes:
        bom_nodes.append(BomNode(
            node_id=n["node_id"],
            parent_id=n["parent_id"],
            node_type=n["node_type"],
            name=n["name"],
            part_number=n["part_number"],
            revision=n["revision"],
            description=n["description"],
            quantity=n["quantity"],
            unit=n["unit"],
            material=n["material"],
            manufacturing=n["manufacturing"],
            cost=n["cost"],
            supplier=n["supplier"],
            dpp_id=n["dpp_id"]
        ))

    # If flat CSV without parent links, make them children of root
    if not any(n.parent_id for n in bom_nodes):
        root = BomNode(
            node_id="root_assembly",
            node_type="assembly",
            name=root_title,
            quantity=1.0,
            children=bom_nodes
        )
        calculate_bom_costs(root)
        return root

    return build_bom_tree(bom_nodes)

def parse_bom_dict(data: Union[Dict[str, Any], List[Dict[str, Any]]], root_title: str = "Root Assembly") -> BomNode:
    """Parses a dictionary (nested tree or flat list of node dicts) into a canonical BomNode."""
    if isinstance(data, dict):
        if "children" in data:
            # Nested tree format
            validate_bom_acyclic(data)
            root = BomNode.model_validate(data)
            calculate_bom_costs(root)
            return root
        elif "components" in data:
            # Wrapped components list
            return parse_bom_dict(data["components"], root_title=root_title)
        else:
            return BomNode.model_validate(data)
    elif isinstance(data, list):
        nodes = [BomNode.model_validate(item) for item in data]
        return build_bom_tree(nodes)
    else:
        raise ValueError(f"Unsupported BOM payload type: {type(data)}")

def compute_bom_structural_hash(root: BomNode) -> str:
    """
    Computes a deterministic SHA-256 structural hash of the BOM tree.
    Normalizes hierarchy, names, quantities, costs, materials, manufacturing processes,
    supplier, and part numbers, deliberately omitting volatile timestamps.
    """
    def _normalize(n: BomNode) -> Dict[str, Any]:
        return {
            "node_id": n.node_id,
            "parent_id": n.parent_id,
            "node_type": n.node_type,
            "name": n.name,
            "part_number": n.part_number,
            "revision": n.revision,
            "quantity": n.quantity,
            "unit": n.unit,
            "material": n.material.model_dump() if n.material else None,
            "manufacturing": n.manufacturing.model_dump() if n.manufacturing else None,
            "cost": n.cost.model_dump() if n.cost else None,
            "supplier": n.supplier,
            "dpp_id": n.dpp_id,
            "rights_override": n.rights_override,
            "children": sorted([_normalize(c) for c in n.children], key=lambda x: x["node_id"])
        }
    normalized = _normalize(root)
    serialized = json.dumps(normalized, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def project_dpp(
    root_or_twin: Union[BomNode, Any],
    tier: Literal["public", "recycler", "authority"] = "public"
) -> Dict[str, Any]:
    """
    Generates a role-filtered Digital Product Passport (DPP) projection preview from the canonical tree.

    IMPORTANT SAFEGUARD:
    This is an uncertified PREVIEW representation based on current engineering attributes.
    Formal regulatory compliance (e.g. EU 2023/1542 battery passport, ESPR) requires
    sector-specific third-party conformity assessments, designated notified bodies,
    and verified registration in the official EU DPP registry.
    """
    if hasattr(root_or_twin, "document") and root_or_twin.document and root_or_twin.document.structure:
        root = root_or_twin.document.structure.bom_root
        twin_id = getattr(root_or_twin, "id", "unknown")
        creator = getattr(root_or_twin.document.identity, "creator", "unknown")
    elif hasattr(root_or_twin, "structure") and root_or_twin.structure:
        root = root_or_twin.structure.bom_root
        twin_id = "unknown"
        creator = getattr(root_or_twin.identity, "creator", "unknown")
    elif isinstance(root_or_twin, BomNode):
        root = root_or_twin
        twin_id = root.dpp_id or root.node_id
        creator = "TwinThink Creator"
    else:
        raise ValueError(f"Cannot project DPP from object: {type(root_or_twin)}")

    if not root:
        return {
            "status": "EMPTY_GRAPH",
            "message": "No structural BOM available to project DPP."
        }

    leaves = extract_leaf_components(root)
    flat_all = flatten_bom_tree(root)

    projection = {
        "passport_id": root.dpp_id or f"DPP-PREVIEW-{root.node_id.upper()}",
        "twin_id": twin_id,
        "product_name": root.name,
        "part_number": root.part_number,
        "revision": root.revision or "R1",
        "access_tier": tier,
        "status": "PROJECTION_PREVIEW_NON_CERTIFIED",
        "regulatory_framework": "EU Regulation 2023/1542 / ESPR (Projected Structure)",
        "disclaimer": (
            "NON-CERTIFIED PREVIEW: This representation is projected directly from the "
            "canonical digital twin record for engineering review. It does not constitute "
            "a legally certified EU Battery Passport or CE marking."
        ),
        "total_nodes_count": len(flat_all),
        "leaf_parts_count": len(leaves),
    }

    if tier == "public":
        materials_summary = sorted(list({
            leaf.material.name for leaf in leaves if leaf.material and leaf.material.name
        }))
        projection["public_declaration"] = {
            "declared_materials": materials_summary,
            "fastener_count": sum(1 for n in flat_all if n.node_type == "fastener"),
            "service_contact": root.supplier or "See product documentation",
            "dismantling_summary": "Modular assembly; mechanical fasteners allow standard tool disassembly."
        }
    elif tier == "recycler":
        dismantling_parts = []
        for leaf in leaves:
            dismantling_parts.append({
                "part_name": leaf.name,
                "part_number": leaf.part_number,
                "quantity": leaf.quantity,
                "unit": leaf.unit,
                "material_name": leaf.material.name if leaf.material else "Unspecified",
                "material_grade": leaf.material.grade if leaf.material else None,
                "standard": leaf.material.standard if leaf.material else None,
                "recycled_content_pct": leaf.material.recycled_content_pct if leaf.material else None,
                "origin_country": leaf.material.origin_country if leaf.material else None,
                "process": leaf.manufacturing.process if leaf.manufacturing else None,
                "finish": leaf.manufacturing.finish if leaf.manufacturing else None,
            })
        projection["recycler_dossier"] = {
            "dismantling_components": dismantling_parts,
            "recyclability_note": "Segregate ferrous, non-ferrous, and elastomer materials prior to reprocessing."
        }
    elif tier == "authority":
        audit_nodes = []
        for n in flat_all:
            audit_nodes.append({
                "node_id": n.node_id,
                "parent_id": n.parent_id,
                "name": n.name,
                "type": n.node_type,
                "part_number": n.part_number,
                "quantity": n.quantity,
                "supplier": n.supplier,
                "unit_cost": n.cost.unit_cost if n.cost else None,
                "extended_cost": n.cost.extended_cost if n.cost else None,
                "rights_override": n.rights_override,
                "provenance": [p.model_dump() for p in n.provenance] if n.provenance else []
            })
        projection["authority_audit_dossier"] = {
            "creator": creator,
            "total_rolled_cost": root.cost.extended_cost if root.cost else None,
            "currency": root.cost.currency if root.cost else "USD",
            "structural_hash": compute_bom_structural_hash(root),
            "complete_bom_nodes": audit_nodes
        }

    return projection

class BomEngine:
    validate_acyclic = staticmethod(validate_bom_acyclic)
    validate_orphans = staticmethod(validate_bom_orphans)
    calculate_costs = staticmethod(calculate_bom_costs)
    flatten_tree = staticmethod(flatten_bom_tree)
    build_tree = staticmethod(build_bom_tree)
    extract_leaves = staticmethod(extract_leaf_components)
    parse_csv = staticmethod(parse_bom_csv)
    parse_dict = staticmethod(parse_bom_dict)
    compute_hash = staticmethod(compute_bom_structural_hash)
    project_dpp = staticmethod(project_dpp)

