import * as THREE from "three";
import Pawn from "@solblade/common/actors/Pawn";
import AnimationManager from "./components/AnimationManager";
import GameClient from "@solblade/client/core/GameClient";

export default class CPawn extends Pawn {
    /**
     * 
     * @param {GameClient} game
     * @param {*} data 
     */
    constructor(game, data) {
        super(game.solWorld, data);
        this.game = game;

        this.isRemote = data.isRemote ?? false;
        this.meshName = data.meshName ?? "spikeMan";

        this.graphics = new THREE.Group();

        this.animation = null;

        this.upVec = new THREE.Vector3(0, 1, 0);

        //this.testCube();
        this.makeMesh();
        
        this.init();
    }
    init() {
        this.game.solWorld.graphics.add(this.graphics);
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
            //@ts-ignore
            this.animation = new AnimationManager(this, scene, animations);
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
                this.graphics.position.lerp(this.body.translation(), dt * 60);
                //@ts-ignore
                this.graphics.quaternion.slerp(this.body.rotation(), dt * 60);
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