import { Quaternion, Vector3 } from "three";
import * as THREE from "three";
import PlayerState from "./_PlayerState";

export default class BladeState extends PlayerState {
    constructor(game, manager, actor, options = {}) {
        super(game, manager, actor, options);
        this.reEnter = false;
        this.jumpCD = 0;
        this.cdSpeed = 1000;
        this.dashTimer = null;
        this.lastEnter = null;
        this.lastExit = null;
        this.timer = 0;
        this.tempVector = new Vector3();
        this.upVec = new Vector3(0, 1, 0);
        this.zeroQuat = new THREE.Quaternion(0, 0, 0, 1);
    }
    enter(state, neutral) {
        this.lastEnter = performance.now();
        this.floorTimer = null;
        this.animationManager.playAnimation('blade', true);
        this.actor.energy.drainRate = 5;
    }
    update(dt) {
        this.rotatePlayerToGround();
        if (this.input.actionStates.jump && this.grounded && !this.jumping) {
            clearTimeout(this.floorTimer);
            this.grounded = false;
            this.movement.jumpStart(4);
            this.jumping = performance.now() + 400;
            this.actor.animationManager.playAnimation('jump', false);
            return;
        }
        if (this.jumping > performance.now()) return this.movement.jumpMove(dt, 6);
        else this.jumping = 0;

        this.actor.movement.bladeMove(dt);
        if (!this.input.actionStates.blade) {
            this.manager.setState('idle');
            return;
        }

        if (!this.actor.movement.isGrounded(.1)) {
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

        if (this.grounded) {
            this.animationManager.playAnimation('blade', true);
        } else {
            this.animationManager.playAnimation('bladeAir', true);
        }
    }
    exit(state) {
        clearTimeout(this.floorTimer);
        this.floorTimer = null;
        this.grounded = false;
        this.lastExit = performance.now();
        this.actor.energy.drainRate = 0;
        this.actor.meshRot = { x: 0, z: 0 };
    }
    canEnter() {
        return !this.actor.getDimmed()
    }
    rotatePlayerToGround() {
        const floor = this.grounded
            ? this.movement.groundChecker.floorNormal(.1)
            : this.movement.groundChecker.floorPredict();


        if (!floor) {
            this.actor.meshRot = { x: 0, z: 0 };
            return;
        }

        // Normalize floor normal
        const n = floor.clone().normalize();

        // Rotate floor normal into player's local space
        const yaw = this.actor.yaw;
        const invYawQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -yaw
        );
        n.applyQuaternion(invYawQuat);

        // Compute tilt based on local-space normal
        const pitch = Math.asin(n.z);   // forward/back tilt
        const roll = -Math.asin(n.x);  // side-to-side tilt

        // Store results for use in update()
        this.actor.meshRot = { x: pitch, z: roll };
    }

}