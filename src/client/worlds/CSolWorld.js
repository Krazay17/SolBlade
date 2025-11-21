import RAPIER from "@dimforge/rapier3d-compat";
import CGame from "../CGame";
import { getVerts } from "../../core/utils/VertUtils";
import SolWorld from "../../core/SolWorld";
import { Scene } from "three";

export default class CSolWorld extends SolWorld {
    /**
     * 
     * @param {CGame} game 
     */
    constructor(game, name = "scene3") {
        super(game, name);
        this.game = game;
        this.name = name;
        this.glbLoader = game.glbLoader;

        this.worldCollider = null;
        this.allGeoms = [];
        this.graphics = new Scene()
        this.game.graphics.add(this.graphics);
    }
    tick(dt) { }
    enter(callback) {
        this.glbLoader.load(`/assets/${this.name}.glb`, (data) => {
            const scene = data.scene;
            this.graphics.add(scene);

            scene.traverse((child) => {
                if (child.isMesh) {
                    this.allGeoms.push(child.geometry.clone());
                    const { vertices, indices } = getVerts(child.geometry);
                    const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
                    colliderDesc.setFriction(0);
                    colliderDesc.setRestitution(0);
                    this.physics.createCollider(colliderDesc);
                }
            });
            this.ready = true;
            if (callback) callback();
        });
    }
}