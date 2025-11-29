import * as THREE from "three";
import { World } from "./World";

export class Graphics {
    /**@param {World} world */
    constructor(world) {
        this.world = world;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
        this.scene.add(this.camera);
        this.world.events.on("actor_added", this.makeMesh);
    }
    makeMesh(id, data){
        console.log(id, data);
    }
}