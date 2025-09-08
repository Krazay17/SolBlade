export default class Pickup extends THREE.Object3D {
    constructor(type, position) {
        super();
        this.type = type;
        this.position.set(position.x, position.y, position.z);
        this.createPickupMesh();
    }

    createPickupMesh() {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.add(this.mesh);
    }
}