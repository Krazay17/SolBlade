import bpy
import json
import os
import math
import mathutils

OUTPUT_PATH = os.path.join(bpy.path.abspath("//"), "world4.json")

colliders = []

# Rotation matrix to convert Z-up -> Y-up
rot = mathutils.Matrix.Rotation(-math.pi / 2, 4, 'X')

for obj in bpy.context.selected_objects:
    if obj.type != 'MESH':
        continue

    mesh = obj.to_mesh()
    mesh.calc_loop_triangles()

    # Apply rotation to each vertex (so it matches +Y up GLB)
    vertices = [(rot @ v.co)[:] for v in mesh.vertices]
    indices = [list(tri.vertices) for tri in mesh.loop_triangles]

    colliders.append({
        "name": obj.name,
        "vertices": [[v[0], v[1], v[2]] for v in vertices],
        "indices": indices
    })

# Save JSON
with open(OUTPUT_PATH, "w") as f:
    json.dump(colliders, f, indent=2)

print(f"Saved {len(colliders)} colliders to {OUTPUT_PATH}")
