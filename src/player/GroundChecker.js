import * as CANNON from "cannon-es";
import * as THREE from "three";
import Globals from "../utils/Globals";
import Pawn from "../actors/Pawn";

export default class GroundChecker {
    constructor(pawn, rayLength = .65, spread = 0.5) {
        /**@type {Pawn} */
        this.pawn = pawn;
        this.body = pawn.body;
        this.world = Globals.physicsWorld;
        this.rayLength = rayLength;
        this.spread = spread;
        this.lastHit = null;
        this.lastResult = null;

        this.raycaster = new THREE.Raycaster();

        this.tempVector = new THREE.Vector3();
        this.worldDown = new THREE.Vector3(0, -1, 0);
        this.worldUp = new THREE.Vector3(0, 1, 0);
        this.zeroVec = new THREE.Vector3(0, 0, 0);

        // Offsets around the player's bottom
        this.offsets = [
            new CANNON.Vec3(0, 0, 0),                      // center
            new CANNON.Vec3(spread, 0, 0),                 // right
            new CANNON.Vec3(-spread, 0, 0),                // left
            new CANNON.Vec3(0, 0, spread),                 // front
            new CANNON.Vec3(0, 0, -spread),                // back
            // new CANNON.Vec3(spread, 0, spread),            // front-right
            // new CANNON.Vec3(-spread, 0, spread),           // front-left
            // new CANNON.Vec3(spread, 0, -spread),           // back-right
            // new CANNON.Vec3(-spread, 0, -spread),          // back-left
        ];
    }
    // floorNormal() {
    //     const hits = this.floorTrace();
    //     if (hits) {
    //         for (const hit of hits) {
    //             const checkNormal = hit.normal.dot(this.wordUp) > 0.7;
    //             if (checkNormal) return hit.normal;
    //         }
    //     }
    //     return false;
    //     // const result = this.floorTrace();
    //     // if (result) {
    //     //     return result.hitNormalWorld;
    //     // }
    //     // return new CANNON.Vec3(0, 1, 0);
    // }

    // floorTrace(slope = 0.7) {
    //     //const origin = this.body.position.clone();

    //     // for (let offset of this.offsets) {
    //     //     const from = origin.vadd(offset);
    //     //     const to = from.clone().vadd(new CANNON.Vec3(0, -this.rayLength, 0));
    //     //     const ray = new CANNON.Ray(from, to);

    //     //     const result = new CANNON.RaycastResult();
    //     //     ray.intersectWorld(this.world, {
    //     //         //only collide with world floor
    //     //         result: result,
    //     //         collisionFilterMask: 1,
    //     //         skipBackfaces: true,
    //     //     });
    //     //     this.lastResult = result;

    //     //     //If any rays hit a walkable floor return true

    //     //     if (result.hasHit) {
    //     //         this.lastHit = result.hitNormalWorld.dot(new CANNON.Vec3(0, 1, 0));
    //     //         return result;
    //     //     }
    //     // }

    //     const origin = this.pawn.position.clone();

    //     const ray = new THREE.Raycaster(origin, this.worldDown, 0, this.rayLength);
    //     const hits = ray.intersectObject(Globals.scene.getMergedLevel(), false);

    //     if (hits) {
    //         return hits;
    //         for (const hit of hits) {
    //             const checkNormal = hit.normal.dot(this.wordUp) > slope;
    //             if (checkNormal) return checkNormal;
    //         }
    //     }
    //     return null;
    // }

    // isGrounded(slope = 0.7) {
    //     // const result = this.floorTrace();
    //     // return result ? Math.abs(result.hitNormalWorld.dot(new CANNON.Vec3(0, 1, 0))) > slope : false;
    //     const hits = this.floorTrace();
    //     if (hits) {
    //         for (const hit of hits) {
    //             const checkNormal = hit.normal.dot(this.wordUp) > slope;
    //             if (checkNormal) return checkNormal;
    //         }
    //     }
    //     return false;
    // }
    floorTrace(slope = 0.7) {
        const originBase = this.pawn.position;

        for (let offset of this.offsets) {
            const origin =this.tempVector.copy(originBase).add(offset);

            this.raycaster.set(origin, this.worldDown);
            this.raycaster.near = 0;
            this.raycaster.far = this.rayLength;

            const hit = this.raycaster.intersectObject(Globals.scene.getMergedLevel(), false)[0];

            if (hit) {
                // Dot with worldUp to check slope tolerance
                if (hit) {
                    const normal = hit.normal;
                    if (normal.dot(this.worldUp) > slope) {
                        return { grounded: true, hit, normal };
                    }
                }
            }
        }
        return { grounded: false, hit: null, normal: this.zeroVec };
    }
    floorNormal(slope = 0.7) {
        return this.floorTrace(slope).normal;
    }
    isGrounded(slope = 0.7) {
        return this.floorTrace(slope).grounded;
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
                //this.pawn.movement.bladeStart();
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
