import * as CANNON from 'cannon-es';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function threeVecToCannon(vec) {
    return new CANNON.Vec3(vec.x, vec.y, vec.z);
}

export function projectOnPlane(vector, planeNormal) {
    const dot = vector.dot(planeNormal);
    const projected = planeNormal.scale(dot);
    return vector.vsub(projected);
}

export function meshToPoly(mesh) {
    mesh.deleteAttribute('uv');
    mesh.deleteAttribute('normal');
    const merged = mergeVertices(mesh);
    const pos = merged.attributes.position;
    let vertices = [];
    let faces = [];

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        vertices.push(new CANNON.Vec3(x, y, z));
    }
    if (merged.index) {
        const index = merged.index.array;
        for (let i = 0; i < index.length; i += 3) {
            faces.push([index[i], index[i + 1], index[i + 2]]);
        }
    } else {
        // fallback: assume every 3 verts is a triangle
        for (let i = 0; i < pos.count; i += 3) {
            faces.push([i, i + 1, i + 2]);
        }
    }
    return new CANNON.ConvexPolyhedron({ vertices, faces });
}

export function clampVector(vec, maxLength) {
    const length = vec.length();
    if (length > maxLength) {
        vec.scale(maxLength / length, vec);
    }
    return vec;
}