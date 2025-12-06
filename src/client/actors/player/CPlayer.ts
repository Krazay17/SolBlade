import { CGame } from "@solblade/client/core/CGame.js";
import { Movement } from "@solblade/common/actors/components/Movement.js";
import { Group, PerspectiveCamera, Vector3 } from "three";
import { ACTIONS } from "../../config/Actions.js";
import { UserInput } from "../../core/UserInput.js";
import { CWorld } from "../../world/CWorld.js";
import { SkeleSystem } from "../components/SkeleSystem.js";
import FSM from "@solblade/common/actors/states/FSM.js";
import IdleState from "./states/IdleState.js";
import RunState from "./states/RunState.js";
import FallState from "./states/FallState.js";
import AttackState from "./states/AttackState.js";
import DeadState from "./states/DeadState.js";
import { CActor } from "../CActor.js";
import { playerStateRegistry } from "./states/StateReg.js";

export default class CPlayer {
    game: CGame;
    meshName: string;
    graphics: Group;
    cameraArm: Group;
    camera: PerspectiveCamera;
    animation: SkeleSystem;
    controller: UserInput;
    movement: Movement;
    fsm: FSM;
    world: CWorld;
    actor: CActor
    tempVec: Vector3;
    constructor(game: CGame, data: any = {}) {
        const {
            meshName = "spikeMan",
            pos = [0, 1, 0],
            rot = [0, 0, 0, 1],
        } = data;
        this.game = game;
        this.meshName = meshName;

        this.graphics = new Group();
        this.game.scene.add(this.graphics);
        this.cameraArm = new Group();
        this.graphics.add(this.cameraArm);
        /**@type {PerspectiveCamera} */
        this.camera = this.game.camera;
        this.camera.position.set(.333, .666, 1.333);
        this.cameraArm.add(this.camera);
        this.animation = new SkeleSystem();

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);

        this.fsm = new FSM(this, playerStateRegistry);

        this.tempVec = new Vector3();
    }
    get body(){return this.actor.body}
    get collider(){return this.actor.collider}
    async init() {
        const { mesh, animations } = await this.game.loader.meshManager.makeMesh(this.meshName);
        await this.animation.addSkele(mesh, animations);

        this.graphics.add(mesh);
    }
    setWorld(world) {
        this.world = world;
        this.actor = new CActor(world);
        this.movement = new Movement(this.actor);
    }
    look(yaw, pitch) {
        if (this.actor) this.movement.yaw = yaw;
        this.cameraArm.rotation.x = pitch;
    }
    tick(dt) {
        if (!this.actor) return;
        if(this.fsm)this.fsm.update(dt);
        if (this.controller.actionStates[ACTIONS.DEVFLY]) {
            this.movement.devFly(this.aim().camDir);
        }

        this.graphics.position.copy(this.actor.body.translation());
        this.graphics.quaternion.copy(this.actor.body.rotation())
    }
    aim() {
        const d = this.camera.getWorldDirection(this.tempVec);
        return {
            dir: d,
            camDir: d,
        }
    }
}