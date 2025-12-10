import {Actor} from "../Actor";
import * as THREE from "three";

export class AttachBox {
    actor: Actor;
    constructor(actor: Actor) {
        this.actor = actor;

        const box = new THREE.Box3Helper(
            new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)),
            new THREE.Color("red")
        )
        console.log(box)
        this.actor.graphics.add(box);
    }
    tick(dt: number) {
        //console.log("box tick", dt)
    }
}