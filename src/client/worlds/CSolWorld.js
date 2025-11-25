import RAPIER from "@dimforge/rapier3d-compat";
import { getVerts } from "@solblade/common/utils/VertUtils";
import SolWorld from "@solblade/common/core/SolWorld";
import { Mesh, Scene } from "three";
import SkyBox from "./SkyBox";
import GameClient from "@solblade/client/core/GameClient";
import { actorRegistry } from "./ClientActors";

export default class CSolWorld extends SolWorld {
    /**
     * 
     * @param {GameClient} game 
     */
    constructor(game, name = "world1") {
        super(name);
        this.game = game;
        this.glbLoader = game.glbLoader;

        this.worldCollider = null;
        this.allGeoms = [];
        this.graphics = new Scene()
        this.game.graphics.add(this.graphics);

        this.skybox = new SkyBox(this, this.game.textureLoader);

        super.init(actorRegistry, true);
    }
    get meshManager() { return this.game.meshManager }
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
    enter(callback) {
        this.glbLoader.load(`/assets/${this.name}.glb`, (data) => {
            const scene = data.scene;
            //@ts-ignore
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
                //@ts-ignore
                if (obj.geometry) obj.geometry.dispose();
                //@ts-ignore
                if (obj.material) obj.material.dispose();
            });
        }
    }
}