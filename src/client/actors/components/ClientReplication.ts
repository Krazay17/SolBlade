import { Actor } from "@solblade/common/actors/Actor";
import { CNet } from "@solblade/client/core/CNet";
import { NET } from "@solblade/common/net/NetProtocol";
import { Quaternion, Vector3 } from "three";

export class ClientReplication {
    sendRate: number = 10;

    private actor: Actor
    private net: CNet
    private lastPos: number[];
    private lastRot: number[];
    private lastAnim: string = "";
    private lastSent: number = 0;

    private targetPos: number[];
    private targetRot: number[];
    private tempVec: Vector3 = new Vector3();
    private tempQuat: Quaternion = new Quaternion();

    constructor(actor: Actor, net?: CNet) {
        this.actor = actor;
        this.net = net;

        this.targetPos = actor.pos;
        this.targetRot = actor.rot;
    }
    tick(dt: number) {
        if (this.net) {
            this._handleSending(dt);
        } else {
            this._handleReceiving(dt);
        }
    }
    private _handleSending(dt: number) {
        const now = performance.now();
        if (now - this.lastSent < this.sendRate) return;
        let update: any = {};
        const { pos, rot } = this.actor;
        const anim = this.actor.mesh.getAnim()

        if (!this.lastPos || !this.lastPos.every((v, i) => v === pos[i])) {
            this.lastPos = [...pos];
            update.pos = pos;
        }
        if (!this.lastRot || !this.lastRot.every((v, i) => v === rot[i])) {
            this.lastRot = [...rot];
            update.rot = rot;
        }
        if (this.lastAnim !== anim.name) {
            this.lastAnim = anim.name;
            update.anim = anim;
        }
        if (update.pos || update.rot || update.anim) {
            this.lastSent = now;
            this.net.emit(NET.CLIENT.PLAYER_SENDUPDATE, update);
        }
    }
    private _handleReceiving(dt: number) {
        const pos = this.tempVec.set(
            this.targetPos[0],
            this.targetPos[1],
            this.targetPos[2]
        );
        const rot = this.tempQuat.set(
            this.targetRot[0],
            this.targetRot[1],
            this.targetRot[2],
            this.targetRot[3]
        )
        if (this.actor.body) {
            this.actor.body.setTranslation(pos, true);
            this.actor.body.setRotation(rot, true);
        }
        if (this.actor.graphics) {
            this.actor.graphics.position.lerp(pos, dt * 60);
            this.actor.graphics.quaternion.slerp(rot, dt * 60);
        }
    }
    serverUpdate(data) {
        if (data.pos) this.targetPos = data.pos;
        if (data.rot) this.targetRot = data.rot;
        if (data.anim) this.actor.anim = data.anim;
    }
}