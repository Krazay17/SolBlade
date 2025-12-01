import * as THREE from "three";
import { GameState } from "./GameState.js";

export class Graphics {
    /**@param {GameState} gameState */
    constructor(gameState) {
        this.gameState = gameState;
        this.scene = new THREE.Scene();
        this.gameState.events.on("addActor", this.makeMesh);
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
    makeMesh(id, data) {
        console.log(id, data);
    }
}