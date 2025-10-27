export function triMeshFromVerts(geometry) {
  const vertices = geometry.attributes.position.array;
  let indices;

  if (geometry.index) {
    indices = geometry.index.array;
  } else {
    const count = vertices.length / 3;
    indices = new Uint16Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }
  const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
  colliderDesc.setFriction(0);
  colliderDesc.setRestitution(0);
  return colliderDesc;
}