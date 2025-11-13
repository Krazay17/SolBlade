import { rawTrimeshFromVerts } from "@solblade/shared";
import MyEventEmitter from "../core/MyEventEmitter";
import CProjectile from "./CProjectile";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export default class CScythe extends CProjectile {
    constructor(game, data) {
        super(game, {
            ...data,
            speed: 15,
            gravity: 0,
        });
        this.createMesh("4Scythe").then((m) => {
            m.scale.set(.7, .7, .7);
            m.updateMatrixWorld(true);
            /**@type {THREE.Group} */
            this.mesh = m
            if (!CScythe.body) {
                const child = m.children[0];
                child.castShadow = false;
                const scaleMatrix = new THREE.Matrix4().makeScale(
                    m.scale.x,
                    m.scale.y,
                    m.scale.z,
                );
                child.geometry.applyMatrix4(scaleMatrix);

                child.geometry.computeVertexNormals();

                // Reset group scale since it's now baked in
                m.scale.set(1, 1, 1);
                m.updateMatrixWorld(true);

                const { vertices, indices } = rawTrimeshFromVerts(child.geometry)

                CScythe.body = new RAPIER.Polyline(vertices, indices);
            }
            this.body = CScythe.body;
        });

        this.hitActors = [];
    }
    update(dt, time) {
        super.update(dt, time);
        this.graphics.rotateY(-dt * 10);

    }
    onHit(id) {
        if (!this.isRemote) {
            Object.assign(this.hitData, { target: id, impulse: this.veloctiy, stun: 500 });
            const target = this.game.getActorById(id)
            if (!target) return;
            if (this.hitActors.includes(target)) return;
            this.hitActors.push(target);
            target.hit?.(this.hitData);
            MyEventEmitter.emit('actorMulticast', { id: this.id, event: "onHit" })
        }
    }
    onCollide() { };
}