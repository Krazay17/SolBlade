import * as CANNON from 'cannon-es';

export function threeVecToCannon(vec) {
    return new CANNON.Vec3(vec.x, vec.y, vec.z);
}

export function projectOnPlane(vector, planeNormal) {
    const dot = vector.dot(planeNormal);
    const projected = planeNormal.scale(dot);
    return vector.vsub(projected);
}