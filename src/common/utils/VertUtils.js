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

export function disposeThreeGroup(root) {
    // recursively dispose materials, geometries and textures
    root.traverse((obj) => {
        if (obj.isMesh) {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                // material can be an array
                const disposeMaterial = (m) => {
                    // dispose textures attached to material
                    for (const key in m) {
                        const v = m[key];
                        if (v && typeof v === 'object' && 'dispose' in v) {
                            try { v.dispose(); } catch (e) { }
                        }
                    }
                    try { m.dispose(); } catch (e) { }
                };

                if (Array.isArray(obj.material)) {
                    obj.material.forEach(disposeMaterial);
                } else {
                    disposeMaterial(obj.material);
                }
            }
        }
    });
}