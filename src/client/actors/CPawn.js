import * as THREE from "three";
import CGame from "../CGame";
import Pawn from "../../core/actors/Pawn";
import AnimationManager from "./components/AnimationManager";

export default class CPawn extends Pawn {
    /**
     * 
     * @param {CGame} game 
     * @param {*} data 
     */
    constructor(game, data) {
        super(game, data);
        this.game = game;

        this.isRemote = data.isRemote ?? false;
        this.meshName = data.meshName ?? "spikeMan";

        this.graphics = new THREE.Group();
        this.game.graphics.add(this.graphics);

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
        this._vecPos = v;
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
        this._quatRot = v;
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
    testCube() {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: "red" })
        )
        this.graphics.add(mesh);
    }
    makeMesh(callback) {
        this.game.meshManager.makeMesh(this.meshName).then(({ animations, scene }) => {
            this.mesh = scene;
            this.animation = new AnimationManager(this, scene, animations);
            this.mesh.position.set(0, -1, 0)
            this.graphics.add(this.mesh);
            if (callback) callback();
        });
    }
    move(dir) {

    }
    look(yaw, pitch) {
        this.yaw = yaw;
    }
    tick(dt) {
        if (this.controller) this.controller.update(dt);
        if (this.fsm) this.fsm.update(dt);
        if (this.animation) this.animation.update(dt);
        if (this.body) {
            if (this.isRemote) {
                this.graphics.position.lerp(this.body.translation(), dt * 60);
                this.graphics.quaternion.slerp(this.body.rotation(), dt * 60);
            } else {
                this.graphics.position.copy(this.body.translation());
                this.graphics.quaternion.copy(this.body.rotation());
            }
        }
    }
}