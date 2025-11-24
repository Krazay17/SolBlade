import RAPIER from "@dimforge/rapier3d-compat";
import { getVerts } from "@common/utils/VertUtils";
import SolWorld from "@common/core/SolWorld";
import { Mesh, Scene } from "three";
import SkyBox from "./SkyBox";
import CWizard from "../actors/CWizard";
import GameClient from "@client/core/GameClient";

export default class CSolWorld extends SolWorld {
    /**
     * 
     * @param {GameClient} game 
     */
    constructor(game, name = "world1") {
        super(name);
        this.game = game;
        this.glbLoader = game.glbLoader;

        this.actorRegistry = {
            wizard: CWizard,
        }

        this.worldCollider = null;
        this.allGeoms = [];
        this.graphics = new Scene()
        this.game.graphics.add(this.graphics);

        this.skybox = new SkyBox(game, this);
    }
    get meshManager() { return this.game.meshManager }
    add(obj) {
        this.graphics.add(obj);
    }
    tick(dt) {
        this.skybox.update(dt);
        for (const a of this.actorManager.allActors) { a.tick(dt); }
    }
    enter(callback) {
        super.enter();
        this.glbLoader.load(`/assets/${this.name}.glb`, (data) => {
            const scene = data.scene;
            this.graphics.add(scene);

            scene.traverse((child) => {
                if (child instanceof Mesh) {
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
    exit() {
        super.exit();
        // remove graphics
        if (this.graphics) {
            this.game.graphics.remove(this.graphics);
            this.graphics.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
    }
}