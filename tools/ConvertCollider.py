import trimesh
import json

mesh = trimesh.load('./models/world4.glb', force='mesh')
vertices = mesh.vertices.tolist()
faces = mesh.faces.tolist()

with open('./models/colliders.json', 'w') as f:
    json.dump({"vertices": vertices, "indices": faces}, f, indent=2)
