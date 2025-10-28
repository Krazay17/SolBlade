import { World, RigidBody } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";

export default class Physics {
    constructor() {
        this.gravity = new Vector3(0, -6, 0);
        this.world = new World(this.gravity);
        this.pendingRemoval = [];
    }

    safeRemoveBody(body) {
        if (!body) return;
        this.pendingRemoval.push({ type: 'body', });
    }
}