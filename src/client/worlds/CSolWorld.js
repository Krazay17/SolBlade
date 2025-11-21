import RAPIER from "@dimforge/rapier3d-compat";
import CGame from "../CGame";
import { getVerts } from "../../core/utils/VertUtils";
import SolWorld from "../../core/SolWorld";
import { Scene } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";

export default class CSolWorld extends SolWorld {
    /**
     * 
     * @param {CGame} game 
     */
    constructor(game, worldName = "scene3") {
        super(game, worldName);
        this.game = game;
        this.glbLoader = game.glbLoader;
        this.worldName = worldName;
        this.worldCollider = null;
        this.allGeoms = [];

        this.game.graphics.add(this.graphics = new Scene());

    }
    tick(dt) { }
    fixedUpdate(dt) { }
    async init(callback) {
        this.glbLoader.load(`/assets/${this.worldName}.glb`, (data) => {
            const scene = data.scene;
            this.graphics.add(scene);

            scene.traverse((child) => {
                if (child.isMesh) {
                    this.allGeoms.push(child.geometry.clone());
                    // const { vertices, indices } = getVerts(child.geometry);
                    // const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
                    // colliderDesc.setFriction(0);
                    // colliderDesc.setRestitution(0);
                    // this.game.physicsWorld.createCollider(colliderDesc);
                }
            });

            for (const geom of this.allGeoms) {
                Object.keys(geom.attributes).forEach(a => {
                    if (a.startsWith('color')) {
                        geom.deleteAttribute(a);
                    }
                })
            }
            const mergedGeom = mergeGeometries(this.allGeoms);
            const { vertices, indices } = getVerts(mergedGeom);
            const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
            colliderDesc.setFriction(0);
            colliderDesc.setRestitution(0);

            this.worldCollider = this.game.physicsWorld.createCollider(colliderDesc);
            if (callback) callback();
        });
    }
}