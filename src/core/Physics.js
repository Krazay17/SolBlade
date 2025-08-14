
import { Vector3, CapsuleGeometry } from "three";

const gravity = -29.8;
const physicsObjects = [];
let world;

export function updatePhysics(dt) {
    if (!world) return;
    for (const obj of physicsObjects) {
        if (!obj.velocity) obj.velocity = new Vector3();
        if (obj.grounded) continue;
        applyGravity(dt, obj);
        playerCollisions(obj)

        obj.position.addScaledVector(obj.velocity, dt)
    }
}

function applyGravity(dt, obj) {
    if (obj.usesGravity === false) return;
    obj.velocity.y = Math.min(200, obj.velocity.y += gravity * dt)
}

export function addWorld(obj) {
    world = obj;
}

export function addPhysics(obj) {
    if (!obj.velocity) obj.velocity = new Vector3();
    physicsObjects.push(obj);
}

export function playerMove(obj, attemptedMovement) {
    playerCollisions(obj, attemptedMovement)
}

function playerCollisions(obj, attemptedMovement) {
    let collision = false;
    let grounded = false;
    const newPos = obj.position.clone() + attemptedMovement;
    const geometry = world.geometry;
    const boundsTree = geometry.boundsTree;
    const triPoint = new Vector3();
    const capsulePoint = new Vector3();

    boundsTree.shapecast({
        intersectsBounds: (box) => {
            const hit = box.intersectsSphere(obj.tempSphere)
            return hit;
        },
        intersectsTriangle: (tri) => {
            tri.closestPointToSegment(obj.tempSegment, triPoint, capsulePoint);
            const distSq = triPoint.distanceToSquared(capsulePoint);
            if (distSq < obj.collider.radius * obj.collider.radius) {
                const depth = obj.collider.radius - Math.sqrt(distSq);
                const direction = capsulePoint.sub(triPoint).normalize();
                obj.position.addScaledVector(direction, depth);
                obj.velocity.y = direction.y > .5 ? 0 : obj.velocity.y;
                collision = true;
                grounded = direction.y > 0.66;
                console.log(direction, depth);
                return true; // hit, can stop searching further
            }
        }
    });
    obj.grounded = grounded;
    return collision;
}

import * as THREE from "three";

export class Physics {
    constructor(worldMesh) {
        this.worldMesh = worldMesh;
        this.bvh = worldMesh.geometry.boundsTree;
    }

    moveCapsule(capsule, movement) {
        const radius = capsule.collider.radius;
        const height = capsule.collider.height;

        // Desired new position
        const startPos = capsule.position.clone();
        const endPos = startPos.clone().add(movement);

        // Set temp segment for collision check
        const start = new THREE.Vector3(0, radius, 0).add(endPos);
        const end = new THREE.Vector3(0, height + radius, 0).add(endPos);

        capsule.tempSegment.set(start, end);
        capsule.tempSphere.center.copy(start).lerp(end, 0.5);
        capsule.tempSphere.radius = radius;

        const triPoint = new THREE.Vector3();
        const capsulePoint = new THREE.Vector3();
        const collisionNormal = new THREE.Vector3();

        let collided = false;
        let grounded = false;

        this.bvh.shapecast({
            intersectsBounds: (box) => box.intersectsSphere(capsule.tempSphere),
            intersectsTriangle: (tri) => {
                tri.closestPointToSegment(capsule.tempSegment, triPoint, capsulePoint);

                const distSq = triPoint.distanceToSquared(capsulePoint);
                if (distSq < radius * radius) {
                    const depth = radius - Math.sqrt(distSq);
                    collisionNormal.copy(capsulePoint).sub(triPoint).normalize();
                    endPos.addScaledVector(collisionNormal, depth);

                    if (collisionNormal.y > 0.5) grounded = true;

                    collided = true;
                    return true;
                }
            }
        });

        // Apply final resolved position
        capsule.position.copy(endPos);

        if (grounded) {
            capsule.velocity.y = 0;
        }

        return { collided, grounded };
    }
}
