import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import path from 'path';


// Folder containing your GLTF/GLB models
const MODELS_DIR = path.resolve('./models');

// Loader
const loader = new GLTFLoader();

// Extract vertices from a mesh
function extractGeometry(mesh) {
    const geom = mesh.geometry;
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    const position = geom.getAttribute('position');
    const vertices = [];

    for (let i = 0; i < position.count; i++) {
        vertices.push([
            position.getX(i),
            position.getY(i),
            position.getZ(i)
        ]);
    }

    return {
        name: mesh.name,
        vertices
    };
}

// Process a single file
function processFile(filePath) {
    loader.load(
        filePath,
        (gltf) => {
            const colliders = [];

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    colliders.push(extractGeometry(child));
                }
            });

            const outPath = path.join(
                path.dirname(filePath),
                path.basename(filePath, path.extname(filePath)) + '_colliders.json'
            );

            fs.writeFileSync(outPath, JSON.stringify(colliders, null, 2));
            console.log(`Saved colliders: ${outPath}`);
        },
        undefined,
        (err) => {
            console.error('Error loading', filePath, err);
        }
    );
}

// Read all GLTF/GLB files in folder
fs.readdirSync(MODELS_DIR).forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.glb' || ext === '.gltf') {
        const fullPath = path.join(MODELS_DIR, file);
        processFile(fullPath);
    }
});
