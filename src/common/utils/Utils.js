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

export function lerpTo(a, b, t) {
    let diff = b - a;
    return a + diff * t;
}

export function rotateInputAroundYaw(x, z, yaw) {
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    const rotatedX = x * cosYaw + z * sinYaw;
    const rotatedZ = -x * sinYaw + z * cosYaw;

    return { rotatedX, rotatedZ };
}

export function arrayBuffer(list, length = 8) {
    const count = list.length;
    const buffer = new Float32Array(count * length)
    let i = 0;
    for (const e of list) {
        buffer[i++] = e.id ?? 0;
        buffer[i++] = e.pos[0] ?? 0;
        buffer[i++] = e.pos[1] ?? 0;
        buffer[i++] = e.pos[2] ?? 0;
        buffer[i++] = e.rot[0] ?? 0;
        buffer[i++] = e.rot[1] ?? 0;
        buffer[i++] = e.rot[2] ?? 0;
        buffer[i++] = e.rot[3] ?? 0;
    };
    return buffer;
}

export function filterMoved(actors) {
    return actors.filter(a => {
        if (!a.active) return false;
        const moved = (
            !a.lastPos ||
            a.pos[0] !== a.lastPos[0] ||
            a.pos[1] !== a.lastPos[1] ||
            a.pos[2] !== a.lastPos[2]
        );
        const rotated = (
            !a.lastRot ||
            a.rot[0] !== a.lastRot[0] ||
            a.rot[1] !== a.lastRot[1] ||
            a.rot[2] !== a.lastRot[2] ||
            a.rot[3] !== a.lastRot[3]
        );
        if (moved || rotated) {
            a.lastPos = [a.pos[0], a.pos[1], a.pos[2]];
            a.lastRot = [a.rot[0], a.rot[1], a.rot[2], a.rot[3]];
            return true;
        }
        return false;
    })
}