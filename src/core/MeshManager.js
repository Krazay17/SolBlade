import { Vector3 } from "three";
import * as THREE from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import { MeshBVH } from 'three-mesh-bvh';

export default class MeshManager {
    constructor(game) {
        this.game = game;
        this.loader = game.glbLoader;
        this.meshMap = new Map();
        this.meshPool = {};
        this.skinCache = {};
        this.skinMap = new Map();
        this.tempVec = new Vector3();

        this.skinMap.set('KnightGirl', '/assets/KnightGirl.glb');
        this.skinMap.set('NinjaDude', '/assets/NinjaDude.glb');
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

    getSkeleMesh(meshName) {
        return this.meshPool[meshName] ? this.meshPool[meshName].pop() : null;
    }

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
                        child.geometry.boundsTree = new MeshBVH(child.geometry, { lazyGeneration: false });
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

    async createMesh(name, scale = 1) {
        return new Promise((resolve, reject) => {
            this.loader.load(`assets/${name}.glb`, (gltf) => {
                const mesh = gltf.scene;
                mesh.scale.set(scale, scale, scale);
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

    async getMesh(name, scale) {
        let mesh = this.meshMap.get(name);
        if (mesh) {
            return mesh.clone();
        } else {
            let newScale = scale;
            switch (name) {
                case 'crown':
                    newScale = newScale || 0.5;
                    break;
            }
            mesh = await this.createMesh(name, newScale);
            return mesh.clone();
        }
    }
}
