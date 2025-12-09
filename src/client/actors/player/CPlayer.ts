import { CGame } from "@solblade/client/core/CGame.js";
import { Movement } from "@solblade/common/actors/components/Movement.js";
import { Group, PerspectiveCamera, Vector3 } from "three";
import { ACTIONS } from "../../config/Actions.js";
import { UserInput } from "../../core/UserInput.js";
import { CWorld } from "../../world/CWorld.js";
import { SkeleSystem } from "../components/SkeleSystem.js";
import FSM from "@solblade/common/actors/states/FSM.js";
import { CActor } from "../CActor.js";
import { playerStateRegistry } from "./states/StateReg.js";
import { PhysicsActor, Player } from "@solblade/common/core/Interfaces.js";

export default class CPlayer extends CActor implements Player {
    game: CGame;
    controller: UserInput;
    cameraArm: Group;
    camera: PerspectiveCamera;
    animation: SkeleSystem;
    fsm: FSM<Player>;
    actor: CActor
    tempVec: Vector3;
    physics: PhysicsActor;
    constructor(game: CGame, data: any = {}) {
        super(game.world, {
            ...data,
            type: "player",
        });
        this.game = game;

        this.graphics = new Group();
        this.game.scene.add(this.graphics);
        this.cameraArm = new Group();
        this.graphics.add(this.cameraArm);
        this.camera = this.game.camera;
        this.camera.position.set(.333, .666, 1.333);
        this.cameraArm.add(this.camera);
        this.animation = new SkeleSystem(this);

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);

        this.fsm = new FSM(this, playerStateRegistry);

        this.tempVec = new Vector3();
    }
    async init() {
        await this.animation.addSkele(this.game.loader);
    }
    setWorld(world: CWorld) {
        this.world = world;
        const { body, collider } = this.world.physics.makeCapsule();
        body.setTranslation({ x: this.pos[0], y: this.pos[1], z: this.pos[2] }, false);
        this.body = body;
        this.collider = collider;
    }
    look(yaw, pitch) {
        if (this.body) this.movement.yaw = yaw;
        this.cameraArm.rotation.x = pitch;
    }
    tick(dt) {
        if (!this.body) return;
        if (this.fsm) this.fsm.update(dt);
        if (this.controller.actionStates[ACTIONS.DEVFLY]) {
            this.movement.devFly(this.aim().camDir);
        }

        this.graphics.position.copy(this.body.translation());
        this.graphics.quaternion.copy(this.body.rotation())
        this.animation.update(dt);
    }
    aim() {
        const d = this.camera.getWorldDirection(this.tempVec);
        return {
            dir: d,
            camDir: d,
        }
    }
}