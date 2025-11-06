import { Box3, Object3D, Raycaster, Sphere, Vector3 } from "three";
import Pawn from "../actors/CPawn";
import Game from "../CGame.js";
import RAPIER from "@dimforge/rapier3d-compat";

export default class MeshTrace {
    constructor(game, actor) {
        /**@type {Game} */
        this.game = game;
        this.actor = actor;
        this.mapWalls = null;
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
    shapeTrace(start, dir, length, radius = 0.1, callback) {
        const shape = new RAPIER.Ball(radius);
        const cloneStart = start.clone()
        const direction = dir.clone().normalize();
        const rotation = new RAPIER.Quaternion(1, 0, 0, 0); // identity rotation
        const result = this.game.physicsWorld.castShape(
            cloneStart,
            rotation,
            direction,
            shape,
            0,
            length,
            undefined,
            undefined,
            undefined,
            this.actor.body.body,
        );

        if (result) {
            console.log(result.time_of_impact);
            if (callback) callback(result);
        }
    }
    lineTrace(start, direction, length, losStart, callback) {
        let savedStart = start instanceof Object3D ? start.position.clone() : start.clone();
        let savedDir = direction instanceof Object3D ? direction.position.clone().sub(savedStart).normalize() : direction.clone().normalize();
        let hits = [];

        // const actors = this.game.getOtherActors().filter(a => {
        //     const direction = a.position.clone().sub(start);
        //     direction.normalize();
        //     return savedDir.dot(direction) > .33 && a.position.distanceTo(start) < length && !a.isDead;
        // });
        // if (actors.length === 0) return;
        // this.actorMeshes = this.game.getOtherActorMeshes();
        // if (this.actorMeshes.length === 0) return;

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
    /**@param {Pawn[]} hostiles */
    multiLineTrace(start, dir, hostiles, length, actorEyes, callback, numRays = 5, radius = .1) {
        if (hostiles.length === 0) return;
        let savedStart = start instanceof Object3D ? start.position.clone() : start.clone();
        let savedDir = dir instanceof Object3D ? dir.position.clone().sub(savedStart).normalize() : dir.clone().normalize();

        hostiles = hostiles.filter(h => {
            const targetPos = this.tempVector5.copy(h.position)
            const dot = targetPos.sub(actorEyes).normalize().dot(dir);
            return dot > 0.5;
        });
        let hostileMeshes = hostiles.map(pawn => pawn?.getMeshBody?.()).filter(Boolean);

        const right = this.tempVector.crossVectors(this.worldUp, savedDir).normalize();
        if (right.length() === 0) right.set(1, 0, 0);
        const up = this.tempVector2.crossVectors(savedDir, right).normalize();
        if (up.length() === 0) up.set(0, 1, 0);

        this.raycaster.far = length;
        this.raycaster2.far = length;

        for (let i = 0; i < numRays; i++) {
            if (hostileMeshes.length === 0) break; // nothing left to hit
            let offset = this.tempVector3.set(0, 0, 0);

            if (i > 0) {
                const angle = (i - 1) / (numRays - 1) * Math.PI * 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                offset.copy(right).multiplyScalar(cos * radius)
                    .addScaledVector(up, sin * radius);
            }
            const startPos = this.tempVector4.copy(savedStart).add(offset);

            this.raycaster.set(startPos, dir);
            const hit = this.raycaster.intersectObjects(hostileMeshes, false)[0];
            if (hit) {
                const indx = hostileMeshes.indexOf(hit.object)
                hostileMeshes.splice(indx, 1); // remove so we don't hit same actor multiple times

                // LOS check...
                const losDir = this.tempVector5.copy(hit.point).sub(actorEyes).normalize();
                this.raycaster2.set(actorEyes, losDir);
                this.raycaster2.far = actorEyes.distanceTo(hit.point);

                const losHit = this.raycaster2.intersectObject(this.game.levelLOS);
                if (losHit[0] && losHit[0].distance < hit.distance) return;
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