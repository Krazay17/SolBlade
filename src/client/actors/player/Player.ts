import { CGame } from "@solblade/client/core/CGame.js";
import { Group, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { ACTIONS } from "../../config/Actions.js";
import { UserInput } from "../../core/UserInput.js";
import { CWorld } from "../../world/CWorld.js";
import { SkeleSystem } from "../components/SkeleSystem.js";
import FSM from "@solblade/common/actors/states/FSM.js";
import { playerStateRegistry } from "./states/StateReg.js";
import { Movement } from "@solblade/common/actors/components/Movement.js";
import { Actor, ActorInint } from "@solblade/common/actors/Actor.js";
import { CNet } from "@solblade/client/core/CNet.js";
import { ClientReplication } from "../components/ClientReplication.js";

export class Player extends Actor {
    declare controller?: UserInput;
    declare world?: CWorld;
    game: CGame;
    cameraArm: Group;
    camera: PerspectiveCamera;
    tempVec: Vector3 = new Vector3();
    tempQuat: Quaternion = new Quaternion();

    replicator?: ClientReplication;

    money: number;
    constructor(game: CGame, data: ActorInint = {}, net: CNet) {
        super({
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
        this.animation.addSkele(this.game.loader);

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);

        this.movement = new Movement(this);
        this.fsm = new FSM(this, playerStateRegistry);
        this.replication = new ClientReplication(this, net);

        this.tempVec = new Vector3();
    }
    setWorld(world: CWorld) {
        this.world = world;
        world.physics.makeBody(this, { remote: false });
    }
    look(yaw, pitch) {
        if (this.body) this.movement.yaw = yaw;
        this.cameraArm.rotation.x = pitch;
    }
    tick(dt: number) {
        super.tick(dt);
        if (!this.body) return;
        if (this.controller.actionStates[ACTIONS.DEVFLY]) {
            this.movement.devFly(this.aim().camDir);
        }
        this.graphics.position.set(this.pos[0], this.pos[1], this.pos[2]);
        this.graphics.quaternion.set(this.rot[0], this.rot[1], this.rot[2], this.rot[3]);
    }
    aim() {
        const d = this.camera.getWorldDirection(this.tempVec);
        return {
            dir: d,
            camDir: d,
        }
    }
}