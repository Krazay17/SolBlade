import { Object3D, Raycaster, Vector3 } from "three";

export default class MeshTrace {
    constructor(scene) {
        this.scene = scene;
        this.raycaster = new Raycaster();
        this.raycaster2 = new Raycaster();
        this.tempVector = new Vector3();
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
        const actorMeshes = this.scene.actorMeshes;

        if (actorMeshes.length === 0) {
            return;
        }
        actorMeshes.forEach(mesh => {
            mesh.updateWorldMatrix(true, false);
            const distance = mesh.position.distanceTo(savedStart);
            if (distance > length) {
                return;
            }
        });

        this.raycaster.set(savedStart, savedDir);
        const intersects = this.raycaster.intersectObjects(actorMeshes, false);
        for (const hit of intersects) {
            if (hit.distance <= length) {
                const losDir = hit.point.clone().sub(losStart);
                const losLength = losDir.length();
                losDir.normalize();
                this.raycaster2.set(losStart, losDir);
                const losIntersects = this.raycaster2.intersectObjects(this.scene.mapWalls, false);
                if (losIntersects.length > 0) {
                    for (const losHit of losIntersects) {
                        if (losHit.distance < hit.distance) return;
                    }
                }
                hits.push(hit);
            }
        }
        if (hits.length > 0) {
            callback(hits);
        }
    }
}
