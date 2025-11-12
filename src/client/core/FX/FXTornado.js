import * as THREE from "three";
import FX from "./FX";

export default class FXTornado extends FX {
    constructor(game, data) {
        super(game, data);
        this.actor = this.game.getActorById(data.actor);
        this.color = data.color ?? 0xff3333;
    }
    async init() {
        const mesh = await this.game.meshManager.getMesh('Tornado');
        this.mesh = mesh.children[0];
        this.mesh.position.copy(this.actor.pos);
        this.graphics.add(this.mesh);

        const tex = await this.game.meshManager.getTex('Beam.webp');
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.offset.set(0, 0);
        tex.repeat.set(1, 1);

        this.mesh.material = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: this.color,
        });
        this.tex = tex;
    }
    update(dt, time) {
        super.update(dt, time);
        if (this.mesh) {
            this.mesh.position.copy(this.actor.pos);
            this.mesh.rotateZ(-dt * 10);
        }
        if (this.tex) {
            this.tex.offset.y += dt * 2;
        }
    }
}