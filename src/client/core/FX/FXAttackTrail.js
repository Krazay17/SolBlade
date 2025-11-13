import { AdditiveBlending, DoubleSide, MeshBasicMaterial, RepeatWrapping, Vector3 } from "three";
import FX from "./FX";

export default class FXAttackTrail extends FX {
    constructor(game, data) {
        super(game, {
            ...data,
            meshName: data.meshName ?? "AttackTrail",
            color: data.color ?? 0x22ff22,
            offset: data.offset?? null,
        });
        this.duration = 300;
        this.actor = this.game.getActorById(data.actor);
        this.graphics.position.copy(this.actor.pos);
    }
    async init() {
        const mesh = await this.game.meshManager.getMesh(this.meshName);
        this.mesh = mesh.children[0];
        this.mesh.castShadow = false;
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        this.mesh.position.copy(this.offset);
        this.graphics.add(this.mesh);

        const tex = await this.game.meshManager.getTex("Beam.webp");
        tex.wrapS = tex.wrapT = RepeatWrapping;
        tex.offset.set(0, 0);
        tex.repeat.set(1, 1);

        this.mesh.material = new MeshBasicMaterial({
            map: tex,
            side: DoubleSide,
            transparent: true,
            color: this.color,
        });

        this.tex = tex;
    }
    update(dt, time) {
        super.update(dt, time);
        if (this.mesh) {
            this.graphics.position.copy(this.actor.pos);
            this.graphics.quaternion.copy(this.actor.rot);
        }
        if (this.tex) {
            this.tex.offset.y += dt * 4;
        }
    }
}