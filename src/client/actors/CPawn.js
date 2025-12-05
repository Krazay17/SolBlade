import * as THREE from "three";
import Pawn from "@solblade/common/actors/Pawn.js";

export default class CPawn extends Pawn {
    /**
     * @param {*} data 
     */
    constructor(world, data) {
        super(world, data);

        this.meshName = data.meshName ?? "spikeMan";

        this.graphics = new THREE.Group();
        this.graphics.position.set(this.pos[0], this.pos[1], this.pos[2]);
        this.animation = null;
        this.upVec = new THREE.Vector3(0, 1, 0);
    }
    init() {
        //@ts-ignore
        this.world.graphics.add(this.graphics);
    }
    testCube() {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: "red" })
        )
        this.graphics.add(mesh);
    }
    activate() {
        console.log(`Activate pawn: ${this.id}`);
    }
    makeMesh(meshManager, callback) {
        meshManager.makeMesh(this.meshName).then(({ mesh, animations }) => {
            this.mesh = mesh;
            //@ts-ignore
            this.mesh.position.set(0, -1, 0)
            //@ts-ignore
            this.graphics.add(this.mesh);
            if (callback) callback();
        });
    }
    tick(dt) {
        if (!this.active) return;
        super.tick(dt);

        if (this.body) {
            if (this.isRemote) {
                this.body.setTranslation(this.vecPos, true);
                this.body.setRotation(this.quatRot, true);
                this.graphics.position.lerp(this.vecPos, dt * 60);
                //@ts-ignore
                this.graphics.quaternion.slerp(this.quatRot, dt * 60);
            } else {
                const pos = this.body.translation();
                const rot = this.body.rotation();
                //@ts-ignore
                this.vecPos = pos;
                //@ts-ignore
                this.quatRot = rot;

                this.graphics.position.copy(pos);
                this.graphics.quaternion.copy(rot);
            }
        }
    }
}