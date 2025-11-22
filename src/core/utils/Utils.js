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