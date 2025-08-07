import * as THREE from 'three';

export default class Player {
    constructor(x, y, z) {
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({color: 0xffff00})
        );
        this.mesh.position.set(x, y, z);
    }

    update(dt) {
        this.mesh.rotation.y += dt * 0.1;
    }
}