import * as THREE from "three";
import FX from "./FX";

export default class FXLine extends FX {
    init() {
        const length = this.data.length;
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 6, 1, false);
        geometry.translate(0, length * .5, 0); // move origin to one end

        const material = new THREE.MeshBasicMaterial({ color: 'red' });
        this.line = new THREE.Mesh(geometry, material);
        this.graphics.add(this.line);

        const dir = this.dir.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
        this.graphics.quaternion.copy(quaternion);

        // Base is now at `pos`, line extends forward along `dir`
        this.graphics.position.copy(this.pos);
    }
    update(dt, time) {
        this.line.scale.y = Math.max(0, this.line.scale.y - dt * 2)
        if (this.line.scale.y === 0) this.destroy()
    }
}