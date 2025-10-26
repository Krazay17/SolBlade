import * as THREE from "three";
import { Capsule } from "three/examples/jsm/Addons.js";

export class Physics {
    constructor(scene, actor, worldMesh) {
        this.scene = scene;
        this.actor = actor;

        this.worldMesh = worldMesh;
        this.bvh = worldMesh.geometry.boundsTree;

        this.velocity = new THREE.Vector3();
        this.startVector = new THREE.Vector3();
        this.endVector = new THREE.Vector3();
        this.tmpVector = new THREE.Vector3();

        this.collisionCapsule = this.syncCapsule(actor.height, actor.radius);
        this.collisionSegment = new THREE.Line3();


        this.gravity = -25;
        this.airFriction = .9;
        this.groundFriction = .5;
        this.radius = actor.radius;
        this.height = actor.height;

        this.debugObjects = [];
        this.debugGroup = new THREE.Group();
        scene.add(this.debugGroup);

    }

    update(dt) {
        if (this.velocity.length() > 0) {
            if ((this.gravity !== 0) && !this.grounded) {
                this.velocity.y += this.gravity * dt;
            }

            this.velocity.x *= this.grounded ? this.groundFriction : this.airFriction;
            this.velocity.z *= this.grounded ? this.groundFriction : this.airFriction;
            const deltaVelocity = this.velocity.clone().multiplyScalar(dt);
            this.moveBody(deltaVelocity);
        }
        this.syncCapsule();
    }

    moveBody(movement) {
        const radius = this.radius;
        const height = this.height;

        const maxIterations = 5; // how many passes we’ll allow per frame
        let startPos = this.actor.position.clone();
        let endPos = startPos.clone().add(movement);

        let grounded = false;

        for (let i = 0; i < maxIterations; i++) {
            let collided = false;
            let correction = new THREE.Vector3();
            let maxDepth = 0;

            // Setup capsule at this iteration’s end position
            const start = new THREE.Vector3(0, height, 0).add(endPos);
            const end = new THREE.Vector3(0, -height, 0).add(endPos);
            this.collisionSegment.set(start, end);

            const triPoint = new THREE.Vector3();
            const capsulePoint = new THREE.Vector3();

            this.bvh.shapecast({
                intersectsBounds: (box) => this.collisionCapsule.intersectsBox(box),
                intersectsTriangle: (tri) => {
                    tri.closestPointToSegment(this.collisionSegment, triPoint, capsulePoint);
                    const distSq = triPoint.distanceToSquared(capsulePoint);

                    if (distSq < radius * radius) {
                        const depth = radius - Math.sqrt(distSq);
                        const normal = capsulePoint.clone().sub(triPoint).normalize();

                        correction.addScaledVector(normal, depth);
                        maxDepth = Math.max(maxDepth, depth);

                        if (normal.y > 0.2) grounded = true;
                        collided = true;
                        return true;
                    }
                }
            });

            if (!collided) break; // we’re good, stop iterating

            // Apply correction
            endPos.add(correction);

            // If the correction is very small, stop early (avoids jittering)
            if (correction.lengthSq() < 1e-6) break;
        }

        // Apply resolved position
        this.actor.position.copy(endPos);

        this.grounded = grounded;
        if (grounded) this.velocity.y = 0;

        return { grounded };
    }


    setVelocity(x, y, z) {
        x = x !== undefined ? x : this.velocity.x;
        y = y !== undefined ? y : this.velocity.y;
        z = z !== undefined ? z : this.velocity.z;
        this.velocity.x = x;
        this.velocity.y = y;
        this.velocity.z = z;
    }

    syncCapsule() {
        this.startVector.copy(this.actor.position).add(this.tmpVector.set(0, -this.height, 0));
        this.endVector.copy(this.actor.position).add(this.tmpVector.set(0, this.height, 0));

        if (!this.collisionCapsule) {
            return this.collisionCapsule = new Capsule(
                this.startVector.clone(),
                this.endVector.clone(),
                this.radius
            );
        } else {
            this.collisionCapsule.set(this.startVector, this.endVector, this.radius);

        }
    }
}