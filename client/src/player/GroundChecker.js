import * as THREE from "three";
import Globals from "../utils/Globals";
import Pawn from "../actors/Pawn";

export default class GroundChecker {
    constructor(pawn, rayLength = 1.1, spread = 0.5) {
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
            new THREE.Vector3(0, 0, 0),                      // center
            new THREE.Vector3(spread, 0, 0),                 // right
            new THREE.Vector3(-spread, 0, 0),                // left
            new THREE.Vector3(0, 0, spread),                 // front
            new THREE.Vector3(0, 0, -spread),                // back
            // new THREE.Vector3(spread, 0, spread),            // front-right
            // new THREE.Vector3(-spread, 0, spread),           // front-left
            // new THREE.Vector3(spread, 0, -spread),           // back-right
            // new THREE.Vector3(-spread, 0, -spread),          // back-left
        ];
    }
    floorTrace(slope = .3) {
        const originBase = this.pawn.position;

        for (let offset of this.offsets) {
            const origin = this.tempVector.copy(originBase).add(offset);

            this.raycaster.set(origin, this.worldDown);
            this.raycaster.near = 0;
            this.raycaster.far = this.rayLength;

            const hit = this.raycaster.intersectObject(this.pawn.world.getMergedLevel(), false)[0];

            if (hit) {
                if (hit) {
                    let normal = hit.normal;
                    if (normal.dot(this.worldUp) > slope) {
                        return { grounded: true, hit, normal };
                    }
                }
            }
        }
        return { grounded: false, hit: null, normal: null };
    }
    floorNormal(slope = 0.3) {
        return this.floorTrace(slope).normal;
    }
    isGrounded(slope = 0.3) {
        return this.floorTrace(slope).grounded;
    }

    groundBuffer(slope = 0.3) {
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
