import { AdditiveBlending, DoubleSide, MeshBasicMaterial, Quaternion, RepeatWrapping, Vector3 } from "three";
import FX from "./FX";
import { lerp } from "three/src/math/MathUtils";

export default class FXSwordSpell extends FX {
    constructor(game, data) {
        super(game, {
            ...data,
            meshName: data.meshName ?? "GreatSwordFX",
            color: data.color ?? 0x22ff22,
        });
        this.duration = 1300;
        this.actor = this.game.getActorById(data.actor);
        this.graphics.position.copy(this.actor.pos);
    }
    async init() {
        const mesh = await this.game.meshManager.getMesh(this.meshName);
        this.mesh = mesh.children[0];
        this.graphics.add(this.mesh);

        const tex = await this.game.meshManager.getTex("Beam.webp");
        tex.wrapS = tex.wrapT = RepeatWrapping;
        tex.offset.set(0, 0);
        tex.repeat.set(1, 1);

        this.mesh.material = new MeshBasicMaterial({
            map: tex,
            side: DoubleSide,
            transparent: true,
            blending: AdditiveBlending,
            depthWrite: false,
            color: this.color,
        });

        this.tex = tex;
    }
    update(dt, time) {
        super.update(dt, time);
        if (this.mesh) {
            this.graphics.position.copy(this.actor.pos);
            this.graphics.quaternion.copy(this.actor.rot);

            this.mesh.rotation.x = lerp(0, -Math.PI * 2, easinQuad(this.delta));
        }
        if (this.tex) {
            this.tex.offset.y += dt * 4;
        }
    }
}

function easinQuad(t) {
    return t ** 4;
}