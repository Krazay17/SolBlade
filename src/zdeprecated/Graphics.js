import * as THREE from "three";
import { GameState } from "../common/core/GameState.js";
import { SolLoading } from "../client/core/SolLoading.js";

export class Graphics {
    /**
     * @param {GameState} gameState 
     * @param {SolLoading} loader
     */
    constructor(gameState, loader) {
        this.gameState = gameState;
        this.loader = loader;

        this.actors = new Map();
        this.scene = new THREE.Scene();
        this.gameState.events.on("addActor", (a) => console.log(a));
        this.gameState.events.on("newActor", (a) => this.makeMesh(a.id, a.mesh));
        this.gameState.events.on("updateState", (a) => this.update(a))
    }
    update(data) {
        this.actors.forEach((v, k) => {
            const actor = data.get(k);
            v.mesh.position.set(actor.pos[0], actor.pos[1], actor.pos[2]);
        })
    }
    tick(dt) {
    }
    remove(obj) {
        if (obj) {
            this.scene.add(obj);
        }
    }
    add(obj) {
        if (obj) {
            this.scene.add(obj);
        }
    }
    makeMesh(id, meshName) {
        this.loader.meshManager.makeMesh(meshName).then(({ mesh, animations }) => {
            //@ts-ignore
            this.actors.set(id, { mesh, animation: new Animations(mesh, animations) })
            //@ts-ignore
            this.scene.add(mesh);
        });
    }
}