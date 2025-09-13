import { Box3, BufferGeometry, Line, LineBasicMaterial, Mesh, Object3D, Raycaster, Sphere, Vector3 } from "three";
import Globals from "../utils/Globals";
import { Capsule } from "three/examples/jsm/Addons.js";
import { MeshBVH } from "three-mesh-bvh";
import { MeshBVHHelper } from "three-mesh-bvh";
import * as THREE from 'three';
import { int } from "three/tsl";

export default class MeshTrace {
    constructor(scene) {
        this.scene = scene;
        this.actorMeshes = this.scene.actorMeshes;
        this.mapWalls = this.scene.mapWalls;
        this.raycaster = new Raycaster();
        this.raycaster2 = new Raycaster();
        this.tempVector = new Vector3();
        this.tempVector2 = new Vector3();
        this.tempVector3 = new Vector3();
        this.tempVector4 = new Vector3();
        this.tempVector5 = new Vector3();
        this.worldUp = new Vector3(0, 1, 0);
        this.tempClosest = new Vector3();
        this.tempBox = new Box3();
        this.tempSphere = new Sphere();
    }

    lineTrace(start, direction, length, losStart, callback, numRays = 1, radius = 0) {
        let savedStart = start instanceof Object3D ? start.position.clone() : start.clone();
        let savedDir = direction instanceof Object3D ? direction.position.clone().sub(savedStart).normalize() : direction.clone().normalize();
        let hits = [];

        if (this.actorMeshes.length === 0) {
            return;
        }
        this.actorMeshes.forEach(mesh => {
            mesh.updateWorldMatrix(true, false);
            const distance = mesh.position.distanceTo(savedStart);
            if (distance > length) {
                return;
            }
        });

        this.raycaster.set(savedStart, savedDir);
        this.raycaster.far = length;
        const intersects = this.raycaster.intersectObjects(this.actorMeshes, false);
        if (intersects.length === 0) {
            return hits;
        }
        for (const hit of intersects) {
            const losDir = hit.point.clone().sub(losStart);
            losDir.normalize();
            this.raycaster2.set(losStart, losDir);
            this.raycaster2.far = losStart.distanceTo(hit.point);
            const losIntersects = this.raycaster2.intersectObjects(this.mapWalls, false);
            if (losIntersects.length > 0) {
                for (const losHit of losIntersects) {
                    if (losHit.distance < hit.distance) return;
                }
            }
            hits.push(hit);
            callback(hit);
        }
        return hits;
    }

    multiLineTrace(start, dir, length, actorEyes, callback, numRays = 3, radius = .05) {
        let savedStart = start instanceof Object3D ? start.position.clone() : start.clone();
        let savedDir = dir instanceof Object3D ? dir.position.clone().sub(savedStart).normalize() : dir.clone().normalize();

        const actors = this.scene.getOtherActors().filter(a => {
            const direction = a.position.clone().sub(actorEyes);
            direction.normalize();
            return savedDir.dot(direction) > .33 && a.position.distanceTo(actorEyes) < length && !a.isDead;
        });
        if (actors.length === 0) return;
        this.actorMeshes = this.scene.getOtherActorMeshes();
        if (this.actorMeshes.length === 0) return;

        const right = this.tempVector.crossVectors(this.worldUp, savedDir).normalize();
        if (right.length() === 0) right.set(1, 0, 0);
        const up = this.tempVector2.crossVectors(savedDir, right).normalize();
        if (up.length() === 0) up.set(0, 1, 0);


        this.raycaster.far = length;
        for (let i = 0; i < numRays; i++) {
            let offset = this.tempVector3.set(0, 0, 0);

            if (i > 0) {
                const angle = (i - 1) / (numRays - 1) * Math.PI * 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                offset.copy(right).multiplyScalar(cos * radius)
                    .addScaledVector(up, sin * radius);
            }

            const startPos = savedStart.clone().add(offset);

            if (Globals.DEBUG) {
                const debugLine = new Line(
                    new BufferGeometry().setFromPoints([
                        startPos,
                        startPos.clone().add(savedDir.clone().multiplyScalar(length)),
                    ]),
                    new LineBasicMaterial({ color: 0x00ff00 })
                );
                Globals.graphicsWorld.add(debugLine);
            }


            this.raycaster.set(startPos, dir);
            const intersects = this.raycaster.intersectObjects(this.actorMeshes, false);
            if (intersects.length === 0) continue;
            for (const hit of intersects) {
                const losDir = hit.point.clone().sub(actorEyes);
                losDir.normalize();
                this.raycaster2.set(actorEyes, losDir);
                this.raycaster2.far = actorEyes.distanceTo(hit.point);
                const losIntersects = this.raycaster2.intersectObjects(this.mapWalls, false);
                if (losIntersects.length > 0) {
                    for (const losHit of losIntersects) {
                        if (losHit.distance < hit.distance) return;
                    }
                }
                callback(hit);
            }
        }
    }

    losCheck(origin, target, obstacles) {
        const dir = target.sub(origin);
        const distance = dir.length();
        if (distance === 0) return false; // nothing to check
        dir.normalize();

        this.raycaster2.set(origin, dir);
        this.raycaster2.far = distance;

        const hits = this.raycaster2.intersectObjects(obstacles, false);
        for (const hit of hits) {
            if (hit.distance < distance) return true; // blocked
        }
        return false; // clear
    }

}