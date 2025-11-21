import RAPIER from "@dimforge/rapier3d-compat";

export function sharedTest() {
  console.log('shared folder import test!');
}

export function randomPos(maxHoriz, maxHeight) {
  const x = (Math.random() * 2 - 1) * maxHoriz;
  const z = (Math.random() * 2 - 1) * maxHoriz;
  const y = Math.random() * maxHeight;

  return { x, y, z };
}

export function projectOnPlane(vector, planeNormal) {
  const dot = vector.dot(planeNormal);
  const projected = planeNormal.multiplyScalar(dot);
  return vector.sub(projected);
}

export function clampVector(vec, maxLength) {
  const length = vec.length();
  if (length > maxLength) {
    vec.multiplyScalar(maxLength / length);
  }
  return vec;
}

export function randomIntFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function vectorsToLateralDegrees(vec1, vec2) {
  const cross = vec1.x * vec2.z - vec1.z * vec2.x;
  const dot = vec1.x * vec2.x + vec1.z * vec2.z;

  const angleRad = Math.round(Math.atan2(cross, dot) * 1e6) / 1e6;

  // Convert to degrees
  let angleDeg = angleRad * 180 / Math.PI;

  // Normalize to [0, 360)
  if (angleDeg < 0) angleDeg += 360;

  return angleDeg;
}

export function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

export function triMeshFromVerts(geometry) {
  // Clone vertex and index arrays so Rapier gets unique, safe buffers
  const vertices = new Float32Array(geometry.attributes.position.array);
  let indices;

  if (geometry.index) {
    indices = new Uint32Array(geometry.index.array);
  } else {
    const count = vertices.length / 3;
    indices = new Uint32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }
  // Create the collider safely
  const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
  colliderDesc.setFriction(0);
  colliderDesc.setRestitution(0);
  return colliderDesc;
}

export function rawTrimeshFromVerts(geometry) {
  const vertices = new Float32Array(geometry.attributes.position.array);
  let indices;

  if (geometry.index) {
    indices = new Uint32Array(geometry.index.array);
  } else {
    const count = vertices.length / 3;
    indices = new Uint32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }
  return { vertices, indices };
}

export function swingMath(d, rev = false) {
    return rev ? 1 - d * 2 : d * 2 - 1;
}