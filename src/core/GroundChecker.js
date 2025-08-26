import * as CANNON from "cannon-es";
import * as THREE from "three";
import Globals from "../utils/Globals";
import { or } from "three/tsl";

export default class GroundChecker {
    constructor(world, playerBody, rayLength = 1.2, spread = 0.35) {
        this.world = world;
        this.playerBody = playerBody;
        this.rayLength = rayLength;
        this.spread = spread;

        // Offsets around the player's bottom
        this.offsets = [
            new CANNON.Vec3(0, 0, 0),                      // center
            new CANNON.Vec3(spread, 0, spread),            // front-right
            new CANNON.Vec3(-spread, 0, spread),           // front-left
            new CANNON.Vec3(spread, 0, -spread),           // back-right
            new CANNON.Vec3(-spread, 0, -spread),          // back-left
        ];
    }

    isGrounded() {
        const origin = this.playerBody.position.clone();

        for (let offset of this.offsets) {
            const from = origin.vadd(offset);
            const to = from.clone().vadd(new CANNON.Vec3(0, -this.rayLength, 0));
            const ray = new CANNON.Ray(from, to);

            const result = new CANNON.RaycastResult();
            ray.intersectWorld(this.world, {
                collisionFilterMask: -1,   // collide with everything
                skipBackfaces: true,
                result: result,
            });

            if (result.hasHit) {
                // Optional: check the normal to ensure it’s mostly "up"
                if (result.hitNormalWorld.dot(new CANNON.Vec3(0, 1, 0)) > 0.5) {
                    return true; // standing on a walkable surface
                }
            }
        }
        return false;
    }

    visualDebugTrace() {
        // Use three js to make a visual debug for traces
        const origin = new THREE.Vector3().copy(this.playerBody.position);
        for (let offset of this.offsets) {
            const from = origin.clone().add(offset);
            const to = from.clone().add(new THREE.Vector3(0, -this.rayLength, 0));
            const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
            Globals.graphicsWorld.add(line);

            requestAnimationFrame(() => Globals.graphicsWorld.remove(line));
        }
    }
}
