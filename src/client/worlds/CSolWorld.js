import SolWorld from "@solblade/common/core/SolWorld.js";
import RAPIER from "@dimforge/rapier3d-compat";
import { getVerts } from "@solblade/common/utils/VertUtils.js";
import { Mesh, Scene } from "three";
import SkyBox from "./SkyBox.js";
import GameClient from "@solblade/client/core/GameClient.js";
import { clientActors } from "@solblade/client/core/CRegistry.js";
import { CActorManager } from "../managers/CActorManager.js";

export default class CSolWorld extends SolWorld {
    /**
     * 
     * @param {GameClient} game 
     */
    constructor(game, name = "world1") {
        //@ts-ignore
        super(name, clientActors);
        this.game = game;
        this.loader = game.glbLoader;

        this.graphics = new Scene()
        this.game.graphics.add(this.graphics);

        this.skybox = new SkyBox(this, this.game.textureLoader);
    }
    init(){
        this.actorManager = new CActorManager(this);
    }
    get meshManager() { return this.game.meshManager }
    async loadWorldData() {
        const data = await this.loader.loadAsync(`/assets/${this.name}.glb`)
        this.graphics.add(data.scene);
        data.scene.traverse((child) => {
            if (child instanceof Mesh) {
                this.allGeoms.push(child.geometry.clone());
                const { vertices, indices } = getVerts(child.geometry);
                const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
                colliderDesc.setFriction(0);
                colliderDesc.setRestitution(0);
                this.physics.createCollider(colliderDesc);
            }
        });
    }
    add(obj) {
        this.graphics.add(obj);
    }
    remove(obj) {
        this.graphics.remove(obj);
    }
    tick(dt) {
        for (const a of this.actorManager.allActors) { a.tick(dt); }
        this.skybox.update(dt);
    }
    exit() {
        super.exit();
        // remove graphics
        if (this.graphics) {
            this.game.graphics.remove(this.graphics);
            this.graphics.traverse(obj => {
                //@ts-ignore
                if (obj.geometry) obj.geometry.dispose();
                //@ts-ignore
                if (obj.material) obj.material.dispose();
            });
        }
    }
}