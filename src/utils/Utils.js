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