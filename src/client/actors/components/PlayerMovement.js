import { Vector3 } from "three";
import LocalData from "../../core/LocalData";
import { projectOnPlane, clampVector } from "@solblade/common/utils/Utils";
import RunBoost from "./MomentumBoost";
import GroundChecker from "./GroundChecker";
import GameClient from "@solblade/client/core/GameClient";
import CPlayer from "../CPlayer";

export default class PlayerMovement {
    /**
     * 
     * @param {GameClient} game 
     * @param {CPlayer} player 
     */
    constructor(game, player) {
        this.game = game
        this.player = player;

        this.momentumBooster = new RunBoost();
        //this.isGrounded = true;
        this.groundChecker = new GroundChecker(this.game, this.player);

        // Reusable vectors
        this.direction = new Vector3();
        this.tempVector = new Vector3();
        this.tempVector2 = new Vector3();
        this.dashValue = 0;

        this.defaultValues = {
            idle: {
                friction: 25,
            },
            ground: {
                friction: 20,
                accel: 20,
                speed: 6,
                tap: 0.01
            },
            air: {
                friction: 0,
                accel: 2.5,
                speed: 4,
                tap: 0.01
            },
            blade: {
                friction: 0,
                accel: 1,
                speed: 7,
                tap: 0.01
            },
            attack: {
                friction: 2,
                accel: 10,
                speed: 3,
                tap: 0.01
            },
            dash: {
                speed: 10
            }
        }

        const savedValues = LocalData.movementValues;
        this.values = savedValues ?? this.defaultValues

        window.addEventListener('beforeunload', () => {
            LocalData.movementValues = this.values;
            LocalData.save();
        });
    }
    get isGrounded() { return this.groundChecker.isGrounded() }
    update(dt) {
        this.momentumBooster.update(dt, this.player.velocity);
    }
    // jumpBuffer(slope = 0.3) {
    //     if (!this.isGrounded(slope)) {
    //         if (!this.floorTimer) {
    //             this.floorTimer = setTimeout(() => {
    //                 this.floorTimer = null;
    //                 this.grounded = false;
    //             }, 150);
    //         }
    //     } else {
    //         clearTimeout(this.floorTimer);
    //         this.floorTimer = null;
    //         if (!this.grounded) {
    //             // do once on land
    //         }
    //         this.grounded = true;
    //     }
    // }
    fallStart() {
        clearTimeout(this.floorTimer);
        this.floorTimer = setTimeout(() => {
            this.floorTimer = null;
            this.grounded = false;
        }, 150);
    }

    resetDefaultValues() {
        this.values = this.defaultValues;
        return this.values;
    }

    idleMove(dt) {
        this.applyFriction(dt, this.values.idle.friction, false);
        if (this.player.velocity.length() < 1) {
            return false;
        }
        return true;
    }
    smartMove(dt) {
        if (this.groundChecker.isGrounded()) {
            this.groundMove(dt);
        } else {
            this.airMove(dt);
        }
    }

    dashForward(speed = 7, restrictY = true, noY = false) {
        const forward = this.player.getAim().dir;
        if (restrictY) forward.y = Math.min(0, forward.y);
        if (noY) forward.y = 0;
        forward.normalize();
        this.player.velocity = forward.multiplyScalar(speed);
    }

    hoverFreeze(dt, lateralDampening = .98) {
        const scaledDelta = dt * 120;
        const x = this.player.velocity.x *= lateralDampening ** scaledDelta;
        const z = this.player.velocity.z *= lateralDampening ** scaledDelta;
        const y = this.player.velocity.y < 0 ? this.player.velocity.y *= .9 ** scaledDelta : this.player.velocity.y *= .999 ** scaledDelta;
        //@ts-ignore
        this.player.velocity = { x, y, z };
    }
    // slowMove(dt, friction = 5, speed = 2, accel = 2) {
    //     this.applyFriction(dt, friction);
    //     const wishdir = this.getInputDirection();
    //     this.accelerate(wishdir, speed, accel);
    // }
    // attackMove(dt, friction = null, speed = null) {
    //     const wishdir = this.getInputDirection();

    //     this.applyFriction(dt, friction ?? this.values.attack.friction);
    //     this.player.velocity.y *= .9975;
    //     this.accelerate(wishdir, speed ?? this.values.attack.speed, this.values.attack.accel, dt, this.values.attack.tap);
    // }

    groundMove(dt, wishdir) {

        this.applyFriction(dt, this.values.ground.friction);
        let wishspeed = this.values.ground.speed + this.momentumBooster.increaseBoost(dt);
        if (!wishdir || (wishdir.length() === 0)) return;
        const floorNormal = this.groundChecker.floorNormal();
        if (floorNormal) {
            wishdir = projectOnPlane(wishdir, floorNormal);
        }

        this.accelerate(wishdir, wishspeed, this.values.ground.accel, dt, this.values.ground.tap);
        //this.clampHorizontalSpeed(wishspeed, .02);
    }

    airMove(dt, wishdir) {
        this.applyFriction(dt, this.values.air.friction);

        if (!wishdir || (wishdir.length() === 0)) return;

        this.accelerate(wishdir, this.values.air.speed, this.values.air.accel, dt, this.values.air.tap);
    }

    // bladeStart(pwr = 1) {
    //     const v = this.tempVec2.copy(this.player.velocity)
    //     const vN = this.tempVec3.copy(v.clone())
    //     vN.normalize();
    //     const n = this.groundChecker.floorNormal();
    //     if (!n) return;
    //     const vdot = v.dot(n);
    //     let boost = 1 + ((1 - this.upDir.dot(n)) * (1 - Math.abs(vN.dot(n))));
    //     this.momentumBooster.increaseBoost(boost);
    //     let projectV = v.vsub(n.scale(vdot));
    //     projectV.scale(boost, projectV);
    //     const maxBoost = 25;
    //     if (projectV.length() > maxBoost) {
    //         projectV.normalize();
    //         projectV.scale(maxBoost, projectV);
    //     }
    //     this.player.velocity.copy(projectV);
    // }

    bladeMove(dt) {
        this.applyFriction(dt, this.values.blade.friction, false);

        let wishdir = this.player.controller.inputDirection();
        let wishspeed = this.values.blade.speed + this.momentumBooster.increaseBoost(dt);
        if (!wishdir || wishdir.length() === 0) return;

        const floorNorm = this.groundChecker.floorNormal();
        if (floorNorm) {
            wishdir = projectOnPlane(wishdir, floorNorm);
        }
        this.accelerate(
            //@ts-ignore
            wishdir,
            wishspeed,
            this.values.blade.accel,
            dt,
            this.values.blade.tap
        );
    }
    dashStart() {
        const dir = this.player.controller.inputDirection()
        if (dir) {
            this.direction.copy(dir);
        }
        this.dashValue = Math.max(this.values.dash.speed, this.player.velocity.length());
    }
    dashMove(dt, decay = 10, min = 6) {
        const d = this.tempVector.copy(this.direction)
        this.dashValue = Math.max(min, this.dashValue - decay * dt);
        this.player.velocity = d.multiplyScalar(this.dashValue);
    }
    dashStop() {
        const currentVel = this.player.velocity.clone();
        this.player.velocity = clampVector(currentVel, 12);
    }

    jumpStart(addJump = 4, maxJump = 8) {
        const v = this.player.velocity;
        const yv = Math.min(maxJump, Math.max(addJump, v.y + addJump))
        //@ts-ignore
        this.player.velocity = { x: v.x, y: yv, z: v.z };
    }

    jumpMove(dt, height = 8) {
        this.airMove(dt);
        const v = this.player.velocity;
        //@ts-ignore
        this.player.velocity = { x: v.x, y: v.y += height * dt, z: v.z };
    }

    applyFriction(dt, friction, expo = true) {
        const v = this.player.velocity;
        const speed = v.length();
        if (speed < 0.00001) return;
        const drop = expo ? speed * friction * dt : friction * dt;
        const newSpeed = Math.max(0, (speed - drop));
        const scale = newSpeed / speed;
        v.x *= scale;
        v.y *= scale;
        v.z *= scale;
        this.player.velocity = v;
    }
    /**@param {Vector3} wishdir */
    accelerate(wishdir, wishspeed, accel, dt, blendFactor = 0.01) {
        const v = this.player.velocity;
        const currentVelocity = this.tempVector.copy(this.player.velocity);
        currentVelocity.y = 0;

        const wishDirSpeed = currentVelocity.dot(wishdir);
        const addSpeed = (wishspeed - wishDirSpeed);

        if (addSpeed <= 0) return false;
        const accelSpeed = Math.min(accel * addSpeed * dt, addSpeed);
        v.add(wishdir.multiplyScalar(accelSpeed));
        this.player.velocity = v;

        if (wishDirSpeed > 0) {
            this.adjustVelocityDirection(wishdir, blendFactor);
        }
    }
    adjustVelocityDirection(wishdir, blendFactor = 0.01) {
        this.tempVector.copy(wishdir).normalize();
        if (wishdir.length() === 0) return;

        const v = this.player.velocity;
        const vy = v.y;
        v.y = 0;
        const speed = Math.hypot(v.x, v.z);
        if (speed < 0.0001) return;
        const vXZ = this.tempVector2.copy(v);
        vXZ.y = 0;

        this.tempVector.multiplyScalar(speed);

        v.lerp(this.tempVector, blendFactor);
        //@ts-ignore
        this.player.velocity = { x: v.x, y: vy, z: v.z };
    }
    clampHorizontalSpeed(maxSpeed) {
        const v = this.player.velocity;
        const horizSpeed = Math.hypot(v.x, v.z);
        if (horizSpeed > maxSpeed) {
            const scale = maxSpeed / horizSpeed;
            //@ts-ignore
            this.player.velocity = { x: v.x *= scale, y: v.y, z: v.z *= scale }
        }
    }
}