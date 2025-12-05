import CPawn from "./CPawn.js";
import FSM from "@solblade/common/actors/states/FSM.js";
import { Group, PerspectiveCamera, Vector3 } from "three";
import { ACTIONS } from "../config/Actions.js";
import { CGame } from "@solblade/client/core/CGame.js";
import { Movement } from "@solblade/common/actors/components/Movement.js";

export default class CPlayer extends CPawn {
    /**
     * @param {CGame}game
     * @param {*} data 
     */
    constructor(game, data) {
        super(game.world, {
            ...data,
            name: "player",
            type: 'player',
            isRemote: false,
        });
        this.game = game;
        this.cameraArm = new Group();
        this.graphics.add(this.cameraArm);
        /**@type {PerspectiveCamera} */
        this.camera = this.game.camera;
        this.camera.position.set(.333, .666, 1.333);
        this.camera.quaternion.copy(this.quatRot);
        this.cameraArm.add(this.camera);

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);
        this.movement = new Movement(this);
        this.fsm = new FSM(this, [
            "run", "fall"
        ]);

        this.tempVec = new Vector3();
        this.tempVec2 = new Vector3();
    }
    init() {
        this.game.scene.add(this.graphics);
        this.makeMesh(this.game.loader.meshManager);
    }
    setWorld(world) {
        this.world = world;
        this.movement.body = this.body;
    }
    look(yaw, pitch) {
        this.yaw = yaw;
        this.cameraArm.rotation.x = pitch;
    }
    getAim() {
        const dir = this.camera.getWorldDirection(this.tempVec)
        return { dir };
    }
    tick(dt) {
        super.tick(dt);
        if (this.controller.actionStates[ACTIONS.DEVFLY]) {
            if (this.body) {
                this.body.setTranslation(this.vecPos.add(this.getAim().dir), true);
                this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            }
        }
    }
    aim(){
        const d = this.camera.getWorldDirection(this.tempVec2);
        return {
            dir: d,
            camDir: d,
        }
    }
}