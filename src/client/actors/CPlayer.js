import CPawn from "./CPawn.js";
import PlayerMovement from "./components/PlayerMovement.js";
import FSM from "@solblade/common/actors/states/FSM.js";
import { Group, Vector3 } from "three";
import { Actions } from "../input/Actions.js";

export default class CPlayer extends CPawn {
    /**
     * 
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
        this.camera = this.game.camera;
        this.camera.position.set(.333, .666, 1.333);
        this.camera.quaternion.copy(this.quatRot);
        this.cameraArm.add(this.camera);

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);
        this.movement = new PlayerMovement(this);
        this.fsm = new FSM(this, [
            "run", "fall"
        ]);

        this.tempVec = new Vector3();
    }
    init(world) {
        this.world = world;
        this.game.scene.add(this.graphics);
        this.makeBody(this.world.physics.world);
    }
    setWorld(world) {
        this.world = world;
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
        if (this.controller.actionStates[Actions.DEVFLY]) {
            if (this.body) {
                this.body.setTranslation(this.vecPos.add(this.getAim().dir), true);
                this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            }
        }
    }

}