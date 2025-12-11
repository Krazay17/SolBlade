import { Actor } from "@solblade/common/actors/Actor";
import { CNet } from "@solblade/client/core/CNet";
import { NET } from "@solblade/common/net/NetProtocol";

export class ClientReplication {
    actor: Actor
    net: CNet
    lastPos: number[] = [0, 0, 0];
    lastRot: number[] = [0, 0, 0, 0];
    constructor(actor: Actor, net: CNet) {
        this.actor = actor;
        this.net = net;
    }
    tick(dt: number) {
        let update: any = {};
        const { pos, rot } = this.actor;

        if (!this.lastPos.every((v, i) => v === pos[i])) {
            this.lastPos = [...pos];
            update.pos = pos;
        }
        if (!this.lastRot.every((v, i) => v === rot[i])) {
            this.lastRot = [...rot];
            update.rot = rot;
        }
        if (update.pos || update.rot) {
            this.net.emit(NET.CLIENT.PLAYER_MOVED, update);
        }
    }
}