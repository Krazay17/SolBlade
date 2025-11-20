import RAPIER from "@dimforge/rapier3d-compat";
import CGame from "../CGame";

export default class Scene {
    /**
     * 
     * @param {CGame} game 
     */
    constructor(game) {
        this.game = game;
        this.glbLoader = game.glbLoader;
    }
    update(dt) { }
    fixedUpdate(dt) { }
    async init() {
        this.glbLoader.load("/assets/scene3.glb", (data) => {
            const scene = data.scene;
            this.game.graphicsWorld.add(scene);

            scene.traverse((child) => {
                const childName = child.name;
                const userData = child.userData;

                if (child.isMesh) {
                    const { vertices, indices } = getVerts(child.geometry);
                    const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
                    colliderDesc.setFriction(0);
                    colliderDesc.setRestitution(0);
                    this.game.physics.world.createCollider(colliderDesc);
                }
            })
        })
    }
}

function getVerts(geom) {
    // Clone vertex and index arrays so Rapier gets unique, safe buffers
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