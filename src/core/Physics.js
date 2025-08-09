import { Vector3 } from "three";

const gravity = -9.8;
const gravityObjects = [];

export function updatePhysics(dt) {
    for (const obj of gravityObjects) {
        if(obj.usesGravity === false) continue;
        if(!obj.velocity) obj.velocity = new Vector3();

        obj.velocity.y += gravity * dt;
        obj.position.addScaledVector(obj.velocity, dt)

        if(obj.position.y < 0.001) {
            obj.velocity.y = 0;
            obj.position.y = 0;
        }
    }
}

export function addPhysics(obj) {
    if(!obj.velocity) obj.velocity = new Vector3();
    gravityObjects.push(obj);
}