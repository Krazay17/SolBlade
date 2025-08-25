import * as CANNON from 'cannon-es';

export function threeVecToCannon(vec) {
    return new CANNON.Vec3(vec.x, vec.y, vec.z);
}