"""
Generates a valid binary glTF 2.0 (.glb) 3D model of the Sodium Acetate Thermal Drink Straw.
Constructs parametric vertices, normals, indices, and PBR materials for:
1. Inner 316 Stainless Steel Drinking Conduit Tube (Central core)
2. Outer Sodium Acetate Phase-Change Thermal Chamber (Translucent Amber/Orange Cylinder)
3. Mid-body Nucleation Trigger Ring & Silicone Grips (Accent rings)
4. Ergonomic Beveled Mouthpiece Tip
"""

import struct
import json
import math
import os

def create_cylinder_mesh(
    radius_outer: float,
    radius_inner: float,
    height: float,
    y_offset: float = 0.0,
    segments: int = 32,
    color_rgba: list = [1.0, 0.6, 0.1, 1.0],
    metallic: float = 0.2,
    roughness: float = 0.3
):
    """Generates an annular cylinder (pipe) mesh."""
    positions = []
    normals = []
    indices = []

    half_h = height / 2.0
    y_bottom = y_offset - half_h
    y_top = y_offset + half_h

    # 1. Outer Wall Vertices
    for i in range(segments + 1):
        theta = (2.0 * math.pi * i) / segments
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)

        # Bottom vertex
        positions.extend([radius_outer * cos_t, y_bottom, radius_outer * sin_t])
        normals.extend([cos_t, 0.0, sin_t])

        # Top vertex
        positions.extend([radius_outer * cos_t, y_top, radius_outer * sin_t])
        normals.extend([cos_t, 0.0, sin_t])

    # Outer wall faces
    for i in range(segments):
        b1 = i * 2
        t1 = b1 + 1
        b2 = (i + 1) * 2
        t2 = b2 + 1
        indices.extend([b1, b2, t1, t1, b2, t2])

    base_idx = len(positions) // 3

    # 2. Inner Wall Vertices (if hollow)
    if radius_inner > 0:
        for i in range(segments + 1):
            theta = (2.0 * math.pi * i) / segments
            cos_t = math.cos(theta)
            sin_t = math.sin(theta)

            # Bottom vertex (inward normal)
            positions.extend([radius_inner * cos_t, y_bottom, radius_inner * sin_t])
            normals.extend([-cos_t, 0.0, -sin_t])

            # Top vertex
            positions.extend([radius_inner * cos_t, y_top, radius_inner * sin_t])
            normals.extend([-cos_t, 0.0, -sin_t])

        for i in range(segments):
            b1 = base_idx + i * 2
            t1 = b1 + 1
            b2 = base_idx + (i + 1) * 2
            t2 = b2 + 1
            indices.extend([b1, t1, b2, t1, t2, b2])

    return {
        "positions": positions,
        "normals": normals,
        "indices": indices,
        "color": color_rgba,
        "metallic": metallic,
        "roughness": roughness
    }

def build_straw_glb(output_path: str):
    # Straw components:
    # 1. Main Inner Steel Straw Tube: length 220mm (2.2), radius 4mm (0.04)
    # 2. Outer Sodium Acetate Heat Chamber Jacket: length 120mm (1.2), radius 9mm (0.09)
    # 3. Middle Snap-Disc Trigger Collar: length 20mm (0.2), radius 10.5mm (0.105)
    # 4. Top/Bottom Chamber Seal Caps
    # 5. Angled Silicone Mouthpiece Tip
    
    meshes_data = [
        # Central Stainless Tube
        create_cylinder_mesh(radius_outer=0.045, radius_inner=0.035, height=2.2, y_offset=0.0, segments=32, color_rgba=[0.85, 0.88, 0.92, 1.0], metallic=0.9, roughness=0.15),
        # Sodium Acetate Thermal Chamber (Amber/Orange PCM)
        create_cylinder_mesh(radius_outer=0.095, radius_inner=0.046, height=1.3, y_offset=-0.1, segments=32, color_rgba=[0.98, 0.55, 0.08, 0.9], metallic=0.1, roughness=0.2),
        # Central Nucleation Snap-Disc Trigger Collar
        create_cylinder_mesh(radius_outer=0.105, radius_inner=0.094, height=0.18, y_offset=-0.1, segments=32, color_rgba=[0.25, 0.25, 0.28, 1.0], metallic=0.6, roughness=0.4),
        # Top Chamber Collar Ring
        create_cylinder_mesh(radius_outer=0.098, radius_inner=0.045, height=0.04, y_offset=0.55, segments=32, color_rgba=[0.9, 0.75, 0.3, 1.0], metallic=0.85, roughness=0.2),
        # Bottom Chamber Collar Ring
        create_cylinder_mesh(radius_outer=0.098, radius_inner=0.045, height=0.04, y_offset=-0.75, segments=32, color_rgba=[0.9, 0.75, 0.3, 1.0], metallic=0.85, roughness=0.2),
        # Silicone Comfort Mouthpiece Tip at Top
        create_cylinder_mesh(radius_outer=0.055, radius_inner=0.044, height=0.35, y_offset=0.95, segments=32, color_rgba=[0.15, 0.75, 0.95, 1.0], metallic=0.05, roughness=0.6)
    ]

    # Combine into single binary buffer and glTF structure
    bin_buffer = bytearray()
    buffer_views = []
    accessors = []
    materials = []
    primitives = []

    for idx, m in enumerate(meshes_data):
        pos_bytes = struct.pack(f"{len(m['positions'])}f", *m["positions"])
        norm_bytes = struct.pack(f"{len(m['normals'])}f", *m["normals"])
        idx_bytes = struct.pack(f"{len(m['indices'])}H", *m["indices"])

        # Align to 4-byte boundaries
        while len(bin_buffer) % 4 != 0:
            bin_buffer.append(0)
        idx_offset = len(bin_buffer)
        bin_buffer.extend(idx_bytes)

        while len(bin_buffer) % 4 != 0:
            bin_buffer.append(0)
        pos_offset = len(bin_buffer)
        bin_buffer.extend(pos_bytes)

        while len(bin_buffer) % 4 != 0:
            bin_buffer.append(0)
        norm_offset = len(bin_buffer)
        bin_buffer.extend(norm_bytes)

        # Buffer Views: Indices (ELEMENT_ARRAY_BUFFER=34963), Attributes (ARRAY_BUFFER=34962)
        bv_idx = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": len(idx_bytes), "target": 34963})
        bv_pos = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": pos_offset, "byteLength": len(pos_bytes), "target": 34962})
        bv_norm = len(buffer_views)
        buffer_views.append({"buffer": 0, "byteOffset": norm_offset, "byteLength": len(norm_bytes), "target": 34962})

        # Calculate bounding box
        coords = [m["positions"][i:i+3] for i in range(0, len(m["positions"]), 3)]
        min_c = [min(c[0] for c in coords), min(c[1] for c in coords), min(c[2] for c in coords)]
        max_c = [max(c[0] for c in coords), max(c[1] for c in coords), max(c[2] for c in coords)]

        # Accessors: 5123 = UNSIGNED_SHORT, 5126 = FLOAT
        acc_idx = len(accessors)
        accessors.append({"bufferView": bv_idx, "byteOffset": 0, "componentType": 5123, "count": len(m["indices"]), "type": "SCALAR", "min": [0], "max": [len(m["positions"])//3 - 1]})
        acc_pos = len(accessors)
        accessors.append({"bufferView": bv_pos, "byteOffset": 0, "componentType": 5126, "count": len(m["positions"]) // 3, "type": "VEC3", "min": min_c, "max": max_c})
        acc_norm = len(accessors)
        accessors.append({"bufferView": bv_norm, "byteOffset": 0, "componentType": 5126, "count": len(m["normals"]) // 3, "type": "VEC3"})

        mat_idx = len(materials)
        materials.append({
            "name": f"Material_{idx}",
            "pbrMetallicRoughness": {
                "baseColorFactor": m["color"],
                "metallicFactor": m["metallic"],
                "roughnessFactor": m["roughness"]
            },
            "doubleSided": True
        })

        primitives.append({
            "attributes": {"POSITION": acc_pos, "NORMAL": acc_norm},
            "indices": acc_idx,
            "material": mat_idx
        })

    # Pad binary chunk to 4-byte alignment
    while len(bin_buffer) % 4 != 0:
        bin_buffer.append(0)

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "TwinThink Straw Geometry Engine"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "Sodium_Acetate_Straw_Assembly"}],
        "meshes": [{"name": "Straw_Mesh", "primitives": primitives}],
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_buffer)}]
    }

    json_bytes = json.dumps(gltf_dict).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "

    # GLB Header: Magic (0x46546C67), Version (2), Total Length
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    header = struct.pack("<4sII", b"glTF", 2, total_length)

    # Chunk 0: JSON (0x4E4F534A)
    chunk0_header = struct.pack("<II", len(json_bytes), 0x4E4F534A)
    # Chunk 1: BIN (0x004E4942)
    chunk1_header = struct.pack("<II", len(bin_buffer), 0x004E4942)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(header)
        f.write(chunk0_header)
        f.write(json_bytes)
        f.write(chunk1_header)
        f.write(bin_buffer)

    print(f"Generated 3D Straw GLB successfully at: {output_path} ({len(bin_buffer) + len(json_bytes)} bytes)")

if __name__ == "__main__":
    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../fixtures/valid/straw_v1/cad/preview.glb"))
    build_straw_glb(out_file)
