import { Vector3 } from "three";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import { MeshBVH, SAH } from 'three-mesh-bvh';

export default class MeshManager {
    constructor(game) {
        this.game = game;
        this.loader = game.glbLoader;
        this.meshMap = new Map();
        this.meshPool = {};
        this.skinCache = {};
        this.skinMap = new Map();
        this.texMap = new Map();
        this.tempVec = new Vector3();

        this.texLoader = new THREE.TextureLoader();

        this.skinMap.set('KnightGirl', '/assets/KnightGirl.glb');
        this.skinMap.set('NinjaDude', '/assets/NinjaDude.glb');
        this.skinMap.set('julian', '/assets/julian.glb');
    }

    meshInitProperties(meshName) {
        let offset = this.tempVec.set(0, -.5, 0);
        let rotation = Math.PI;
        let scale = 1;
        switch (meshName) {
            case 'KnightGirl':
                break;
            case 'NinjaDude':
                break;
            default:
                console.log('Initializing default properties');
                break;
        }
        return { offset, rotation, scale };
    }

    getAddress(name) {
        return this.skinMap.get(name);
    }

    addMesh(meshName, mesh) {
        this.meshPool[meshName] = this.meshPool[meshName] || [];
        this.meshPool[meshName].push(mesh);
    }

    getSkeleMesh(meshName) {
        return this.meshPool[meshName] ? this.meshPool[meshName].pop() : null;
    }

    /**
     * Loads a skeletal mesh by its skin name.
     * @param {*} skinName 
     * @returns {Promise<{model: THREE.Group, animations: Array}>} The loaded model and its animations.
     */

    async loadSkeleMesh(skinName) {
        if (this.skinCache[skinName]) {
            return this.skinCache[skinName];
        }
        const url = this.getAddress(skinName);
        return new Promise((resolve, reject) => {
            this.loader.load(url, (gltf) => {
                const model = gltf.scene;
                const { offset, rotation, scale } = this.meshInitProperties(skinName);

                model.position.copy(offset);
                model.rotation.y = rotation;
                model.scale.set(scale, scale, scale);
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.geometry.computeBoundsTree({
                            strategy: SAH,
                            maxLeafTris: 2,   // each leaf holds just 2 triangles
                            verbose: true,
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.skinCache[skinName] = { model, animations: gltf.animations };
                resolve(this.skinCache[skinName]);
            }, undefined, reject);
        });
    }

    async createSkeleMesh(skinName) {
        const pooledMesh = this.getSkeleMesh(skinName);
        if (pooledMesh) {
            return pooledMesh;
        }

        const { model, animations } = await this.loadSkeleMesh(skinName);
        const clonedMesh = SkeletonUtils.clone(model);
        clonedMesh.animations = animations;
        let meshBody = null;
        clonedMesh.traverse((child) => {
            if (child.isMesh && child.name.includes('BodyMesh')) {
                meshBody = child;
            }
        });
        clonedMesh.meshBody = meshBody;
        return clonedMesh;
    }

    releaseMesh(skinName, mesh) {
        this.addMesh(skinName, mesh);
    }

    async createMesh(name) {
        return new Promise((resolve, reject) => {
            this.loader.load(`assets/${name}.glb`, (gltf) => {
                const mesh = gltf.scene;
                mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.receiveShadow = true;
                        child.castShadow = true;
                    }
                });
                this.meshMap.set(name, mesh);
                resolve(mesh);
            }, undefined, reject);
        });
    }

    async getMesh(name) {
        let mesh = this.meshMap.get(name);
        if (mesh) {
            return mesh.clone();
        } else {
            mesh = await this.createMesh(name);
            return mesh.clone();
        }
    }

    async getTex(name) {
        console.log('trygetTex')
        let tex = this.texMap.get(name);
        if (tex) {
            tex.flipY = false;
            tex.needsUpdate = true;
            return tex.clone();
        } else {
            tex = await this.createTex(name);
            tex.flipY = false;
            tex.needsUpdate = true;
            return tex.clone();
        }
    }

    async createTex(name) {
        return new Promise((resolve, reject) => {
            this.texLoader.load(`assets/${name}.png`, (tex) => {
                this.texMap.set(name, tex)
                resolve(tex);
            }, undefined, reject);
        })
    }
}
