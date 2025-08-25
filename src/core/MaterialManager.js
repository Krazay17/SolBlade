// utils/MaterialRegistry.js
import * as CANNON from 'cannon-es';

const materials = {};

export function getMaterial(name) {
    if (!materials[name]) {
        materials[name] = new CANNON.Material(name);
    }
    return materials[name];
}

// Optional helper to create a contact material
export function getContactMaterial(nameA, nameB, options = {}) {
    const matA = getMaterial(nameA);
    const matB = getMaterial(nameB);

    // Check if contact material already exists in the world
    // If not, create and return it
    return new CANNON.ContactMaterial(matA, matB, options);
}
