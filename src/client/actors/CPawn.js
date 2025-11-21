import * as THREE from "three";
import CGame from "../CGame";
import Pawn from "../../core/actors/Pawn";

export default class CPawn extends Pawn {
    /**
     * 
     * @param {CGame} game 
     * @param {*} data 
     */
    constructor(game, data) {
        super(game, data);
        this.game = game;

        this.isRemote = false;

        this.graphics = new THREE.Group();
        this.game.graphics.add(this.graphics);

        this.animation = null;

        this.testCube();
    }
    get vecPos() {
        if (!this._vecPos) this._vecPos = new THREE.Vector3();
        return this._vecPos.set(...this.pos);
    }
    set vecPos(v) {
        this.pos[0] = v.x;
        this.pos[1] = v.y;
        this.pos[2] = v.z;
        this._vecPos = v;
    }
    testCube() {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: "red" })
        )
        this.graphics.add(mesh);
    }
    makeMesh(callback) {
        const mesh = new THREE.SkinnedMesh(
            
        )
        if (callback) callback(mesh);
    }
    tick(dt) {
        this.graphics.position.lerp(this.body.translation(), dt * 60);
    }
}