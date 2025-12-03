import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import Actor from "@solblade/common/actors/Actor";
import AnimationManager from "./components/AnimationManager";

export class CActor extends Actor {
    constructor(data) {
        super(data);
        this.graphics = new THREE.Scene();
        /**@type {RAPIER.RigidBody} */
        this.body = null;
        /**@type {THREE.Object3D} */
        this.mesh = null;
        /**@type {AnimationManager} */
        this.animation = null;
    }
    tick(dt) {
        if (this.graphics) {
            this.graphics.position.set(this.pos[0], this.pos[1], this.pos[2]);
        }
    }
}