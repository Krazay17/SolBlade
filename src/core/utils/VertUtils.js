export function getVerts(geom) {
    const vertices = new Float32Array(geom.attributes.position.array);
    let indices;

    if (geom.index) {
        indices = new Uint32Array(geom.index.array);
    } else {
        const count = vertices.length / 3;
        indices = new Uint32Array(count);
        for (let i = 0; i < count; i++) indices[i] = i;
    }
    return { vertices, indices };
}