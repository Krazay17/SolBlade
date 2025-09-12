import { Box3, BufferGeometry, Line, LineBasicMaterial, Mesh, Object3D, Raycaster, Sphere, Vector3 } from "three";
import Globals from "../utils/Globals";
import { Capsule } from "three/examples/jsm/Addons.js";
import { MeshBVH } from "three-mesh-bvh";
import * as THREE from 'three';

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
        this.tempBox = new Box3();
        this.tempSphere = new Sphere();
        this.tempCapsule = new Capsule();
    }

    lineTrace(start, direction, length, losStart, callback) {
        let savedStart = start;
        if (savedStart instanceof Object3D) {
            savedStart = savedStart.position.clone();
        }
        let savedDir = direction;
        if (savedDir instanceof Object3D) {
            savedDir = savedDir.position.clone().sub(savedStart).normalize();
        } else {
            savedDir = direction.clone().normalize();
        }
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
        const intersects = this.raycaster.intersectObjects(this.actorMeshes, false);
        for (const hit of intersects) {
            if (hit.distance <= length) {
                const losDir = hit.point.clone().sub(losStart);
                const losLength = losDir.length();
                losDir.normalize();
                this.raycaster2.set(losStart, losDir);
                const losIntersects = this.raycaster2.intersectObjects(this.mapWalls, false);
                if (losIntersects.length > 0) {
                    for (const losHit of losIntersects) {
                        if (losHit.distance < hit.distance) return;
                    }
                }
                hits.push(hit);

                callback(hits);
            }
        }
    }

    sphereTraceOld(start, direction, length, losStart, callback, radius = 0.5, rays = 4) {
        let savedStart = start instanceof Object3D ? start.position.clone() : start.clone();
        let savedDir = direction instanceof Object3D
            ? direction.position.clone().sub(savedStart).normalize()
            : direction.clone().normalize();

        if (this.actorMeshes.length === 0) return;

        let hits = [];

        // ---- Main center ray ----
        hits.push(...this._castRay(savedStart, savedDir, length, losStart, this.actorMeshes));

        // ---- Build perpendicular vectors to spread rays around ----
        const up = new Vector3(0, 1, 0);
        if (Math.abs(savedDir.dot(up)) > 0.9) up.set(1, 0, 0); // avoid colinearity

        const right = new Vector3().crossVectors(savedDir, up).normalize();
        const upVec = new Vector3().crossVectors(right, savedDir).normalize();

        // ---- Extra offset rays around in a circle ----
        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            const offset = right.clone().multiplyScalar(Math.cos(angle) * radius)
                .add(upVec.clone().multiplyScalar(Math.sin(angle) * radius));

            const offsetStart = savedStart.clone().add(offset);
            hits.push(...this._castRay(offsetStart, savedDir, length, losStart, this.actorMeshes));

            callback(hits);
        }
    }

    // helper to reduce duplication
    _castRay(start, dir, length, losStart, actorMeshes) {
        this.raycaster.set(start, dir);

        // Only check actor meshes
        const intersects = this.raycaster.intersectObjects(actorMeshes, false);

        for (const hit of intersects) {
            if (hit.distance <= length) {
                // ---- LOS check (only when we actually hit an actor) ----
                const losDir = hit.point.clone().sub(losStart);
                const losLength = losDir.length();
                losDir.normalize();

                this.raycaster2.set(losStart, losDir);
                const losIntersects = this.raycaster2.intersectObjects(this.mapWalls, false);

                for (const losHit of losIntersects) {
                    if (losHit.distance < losLength) {
                        // Blocked → bail out of whole function immediately
                        return [];
                    }
                }

                // LOS is clear → return this hit (stop after first actor hit)
                return [hit];
            }
        }

        // Nothing hit
        return [];
    }

    // line + radius “bullet sweep”
    sphereSweep(start, end, radius = 0.2, callback) {
        const lineStart = start instanceof Object3D ? start.position : start.clone();
        const lineEnd = end instanceof Object3D ? end.position : end.clone();

        // --- STATIC MESHES (walls, level) ---
        for (const mesh of this.scene.mapWalls) {
            if (!mesh.geometry.boundsTree) continue;

            // fast broadphase: bounding box check
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            const box = mesh.geometry.boundingBox;
            if (!this._lineIntersectsBox(lineStart, lineEnd, box)) continue;

            // accurate capsule intersection
            // create a capsule around the line
            const capsule = {
                start: lineStart.clone(),
                end: lineEnd.clone(),
                radius: radius
            };

            if (mesh.geometry.boundsTree.intersectsCapsule(capsule)) {
                callback(mesh, "static");
            }
        }

        // --- SKINNED MESHES (actors) ---
        for (const mesh of this.actorMeshes) {
            if (!mesh.visible) continue;

            // approximate with bounding sphere
            let sphere = mesh.geometry.boundingSphere;
            if (!sphere) {
                mesh.geometry.computeBoundingSphere();
                sphere = mesh.geometry.boundingSphere;
            }

            const distance = this._distancePointToLine(sphere.center.clone().applyMatrix4(mesh.matrixWorld), lineStart, lineEnd);
            if (distance <= radius + sphere.radius) {
                callback(mesh, "actor");
            }
        }
    }

    // --- helper: distance from point to line segment ---
    _distancePointToLine(point, lineStart, lineEnd) {
        const ab = lineEnd.clone().sub(lineStart);
        const ap = point.clone().sub(lineStart);
        let t = ap.dot(ab) / ab.lengthSq();
        t = Math.max(0, Math.min(1, t));
        this.tempClosest.copy(lineStart).add(ab.multiplyScalar(t));
        return point.distanceTo(this.tempClosest);
    }

    // --- helper: basic AABB line-box intersection ---
    _lineIntersectsBox(start, end, box) {
        const line = new THREE.Line3(start, end);
        return box.intersectsLine(line);
    }
}