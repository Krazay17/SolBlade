import FX from "./FX";
import * as THREE from 'three'

export default class FXExplosion extends FX {
    init() {
        this.duration = 200;
        this.ball = new THREE.Mesh(
            new THREE.SphereGeometry(.5),
            new THREE.MeshBasicMaterial({ color: this.color })
        )
        this.graphics.add(this.ball);
        this.explosionSize = this.data.explosionSize;
    }
    update(dt, time) {
        super.update(dt, time)
        const scaledt = dt *20;
        if (this.ball) {
            this.ball.scale.add(new THREE.Vector3(scaledt, scaledt, scaledt));
        }
    }
}