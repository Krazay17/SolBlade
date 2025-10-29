import FX from "./FX";
import * as THREE from 'three'

export default class FXExplosion extends FX {
    init() {
        this.ball = new THREE.Mesh(
            new THREE.SphereGeometry(.5),
            new THREE.MeshBasicMaterial({ color: 'white' })
        )
        this.graphics.add(this.ball);
    }
    update(dt, time) {
        super.update(dt, time)
        if (this.ball) {
            this.ball.scale.add(new THREE.Vector3(dt, dt, dt));
        }
    }
}