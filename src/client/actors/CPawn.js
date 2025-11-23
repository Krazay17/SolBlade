import * as THREE from "three";
import Pawn from "../../core/actors/Pawn";
import AnimationManager from "./components/AnimationManager";
import CSolWorld from "../../xotherOld/client/worlds/CSolWorld";

export default class CPawn extends Pawn {
    /**
     * 
     * @param {CSolWorld} world 
     * @param {*} data 
     */
    constructor(world, data) {
        super(world, data);
        this.world = world;

        this.isRemote = data.isRemote ?? false;
        this.meshName = data.meshName ?? "spikeMan";

        this.graphics = new THREE.Group();
        this.world.graphics.add(this.graphics);

        this.animation = null;

        this.upVec = new THREE.Vector3(0, 1, 0);

        //this.testCube();
        this.makeMesh();
    }

    get vecPos() {
        if (!this._vecPos) this._vecPos = new THREE.Vector3();
        return this._vecPos;
    }
    set vecPos(v) {
        if (!this._vecPos) this._vecPos = new THREE.Vector3();
        this._vecPos.copy(v);
        this.pos[0] = v.x;
        this.pos[1] = v.y;
        this.pos[2] = v.z;
    }
    /**@type {THREE.Quaternion} */
    get quatRot() {
        if (!this._quatRot) this._quatRot = new THREE.Quaternion();
        return this._quatRot;
    }
    /**@type {THREE.Quaternion} */
    set quatRot(v) {
        if (!this._quatRot) this._quatRot = new THREE.Quaternion();
        this._quatRot.copy(v);
        this.rot[0] = v.x;
        this.rot[1] = v.y;
        this.rot[2] = v.z;
        this.rot[3] = v.w;
    }
    get yaw() { return this._yaw }
    set yaw(v) {
        this._yaw = v;
        this.quatRot.setFromAxisAngle(this.upVec, v)
        this.body.setRotation(this.quatRot, true);
    }
    get velocity() {
        if (!this._vecVel) this._vecVel = new THREE.Vector3();

        return this._vecVel.copy(this.body.linvel());
    }
    set velocity(v) {
        this._vecVel.copy(v);
        this.body.setLinvel(this._vecVel, true)
    }
    testCube() {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: "red" })
        )
        this.graphics.add(mesh);
    }
    makeMesh(callback) {
        this.world.meshManager.makeMesh(this.meshName).then(({ animations, scene }) => {
            this.mesh = scene;
            this.animation = new AnimationManager(this, scene, animations);
            this.mesh.position.set(0, -1, 0)
            this.graphics.add(this.mesh);
            if (callback) callback();
        });
    }
    tick(dt) {
        if(!this.active)return;
        if (this.controller) this.controller.update(dt);
        if (this.fsm) this.fsm.update(dt);
        if (this.movement) this.movement.update(dt);
        if (this.animation) this.animation.update(dt);
        if (this.body) {
            if (this.isRemote) {
                this.graphics.position.lerp(this.body.translation(), dt * 60);
                this.graphics.quaternion.slerp(this.body.rotation(), dt * 60);
            } else {
                const pos = this.body.translation();
                const rot = this.body.rotation();
                this.vecPos = pos;
                this.quatRot = rot;
                this.graphics.position.copy(pos);
                this.graphics.quaternion.copy(rot);
            }
        }
    }
}