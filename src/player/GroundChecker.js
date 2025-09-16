import * as CANNON from "cannon-es";
import * as THREE from "three";
import Globals from "../utils/Globals";

export default class GroundChecker {
    constructor(actor, rayLength = .6, spread = 0.3) {
        this.actor = actor;
        this.body = actor.body;
        this.world = Globals.physicsWorld;
        this.rayLength = rayLength;
        this.spread = spread;
        this.lastHit = null;
        this.lastResult = null;

        // Offsets around the player's bottom
        this.offsets = [
            new CANNON.Vec3(0, 0, 0),                      // center
            new CANNON.Vec3(spread, 0, 0),                 // right
            new CANNON.Vec3(-spread, 0, 0),                // left
            new CANNON.Vec3(0, 0, spread),                 // front
            new CANNON.Vec3(0, 0, -spread),                // back
            new CANNON.Vec3(spread, 0, spread),            // front-right
            new CANNON.Vec3(-spread, 0, spread),           // front-left
            new CANNON.Vec3(spread, 0, -spread),           // back-right
            new CANNON.Vec3(-spread, 0, -spread),          // back-left
        ];
    }

    floorDot() {
        const result = this.floorTrace();
        if (result) {
            return result.hitNormalWorld.dot(new CANNON.Vec3(0, 1, 0));
        }
        return 0;
    }

    floorNormal() {
        const result = this.floorTrace();
        if (result) {
            return result.hitNormalWorld;
        }
        return new CANNON.Vec3(0, 1, 0);
    }

    floorTrace() {
        const origin = this.body.position.clone();

        for (let offset of this.offsets) {
            const from = origin.vadd(offset);
            const to = from.clone().vadd(new CANNON.Vec3(0, -this.rayLength, 0));
            const ray = new CANNON.Ray(from, to);

            const result = new CANNON.RaycastResult();
            ray.intersectWorld(this.world, {
                //only collide with world floor
                result: result,
                collisionFilterMask: 1,
                skipBackfaces: true,
            });
            this.lastResult = result;

            //If any rays hit a walkable floor return true

            if (result.hasHit) {
                this.lastHit = result.hitNormalWorld.dot(new CANNON.Vec3(0, 1, 0));
                return result;
            }
        }
        return null;
    }

    isGrounded(slope = 0.7) {
        const result = this.floorTrace();
        return result ? Math.abs(result.hitNormalWorld.dot(new CANNON.Vec3(0, 1, 0))) > slope : false;
    }

    groundBuffer(slope = 0.7) {
        if (!this.isGrounded(slope)) {
            if (!this.floorTimer) {
                this.floorTimer = setTimeout(() => {
                    this.floorTimer = null;
                    this.grounded = false;
                }, 150);
            }
        } else {
            clearTimeout(this.floorTimer);
            this.floorTimer = null;
            if (!this.grounded) {
                //this.actor.movement.bladeStart();
            }

            this.grounded = true;
        }
    }

    visualDebugTrace() {
        // Use three js to make a visual debug for traces
        const origin = new THREE.Vector3().copy(this.body.position);
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
