import bpy
import json
import os

OUTPUT_PATH = os.path.join(bpy.path.abspath("//"), "colliders2.json")

colliders = []

for obj in bpy.context.selected_objects:
    if obj.type != 'MESH':
        continue

    # Apply modifiers and get mesh data
    mesh = obj.to_mesh()
    mesh.calc_loop_triangles()
    
    vertices = [[v.co.x, v.co.z, v.co.y] for v in mesh.vertices]  # Z→Y
    indices = [list(tri.vertices) for tri in mesh.loop_triangles]

    colliders.append({
        "name": obj.name,
        "vertices": vertices,
        "indices": indices
    })

# Save JSON
with open(OUTPUT_PATH, "w") as f:
    json.dump(colliders, f, indent=2)

print(f"Saved {len(colliders)} colliders to {OUTPUT_PATH}")
