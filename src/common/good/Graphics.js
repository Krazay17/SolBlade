import * as THREE from "three";
import { GameState } from "./GameState";

export class Graphics {
    /**@param {GameState} gameState */
    constructor(gameState) {
        this.gameState = gameState;
        this.scene = new THREE.Scene();
        this.gameState.events.on("addActor", this.makeMesh);
    }
    makeMesh(id, data){
        console.log(id, data);
    }
}