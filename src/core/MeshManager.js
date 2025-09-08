import { Vector3 } from "three";
import { GLTFLoader, SkeletonUtils } from "three/examples/jsm/Addons.js";

export default class MeshManager {
    constructor(game) {
        this.game = game;
        this.loader = game.glbLoader;
        this.meshPool = {};
        this.skinCache = {};
        this.skinMap = new Map();
        this.skinMap.set('KnightGirl', '/assets/KnightGirl.glb');
        this.skinMap.set('NinjaDude', '/assets/NinjaDude.glb');
        this.tempVec = new Vector3();
    }

    meshInitProperties(meshName) {
        let offset = this.tempVec.set(0, -.65, 0);
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

    getMesh(meshName) {
        return this.meshPool[meshName] ? this.meshPool[meshName].pop() : null;
    }

    async loadMesh(skinName) {
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
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.skinCache[skinName] = { model, animations: gltf.animations };
                resolve(this.skinCache[skinName]);
            }, undefined, reject);
        });
    }

    async createMesh(skinName) {
        const pooledMesh = this.getMesh(skinName);
        if (pooledMesh) {
            return pooledMesh;
        }

        const { model, animations } = await this.loadMesh(skinName);
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
}
