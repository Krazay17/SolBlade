import { io } from "../../server.js";
import SvEnergy from "../SvEnergy.js";
import SvActor from "./SvActor.js";
import { COLLISION_GROUPS } from '@solblade/shared/SolConstants.js';

export default class SvPlayer extends SvActor {
    constructor(actorManager, data = {}) {
        data.type = 'player';
        super(actorManager, data);
        this.energy = new SvEnergy(this, 100);
        const collideGroup = (COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.ENEMY) << 16 | COLLISION_GROUPS.PLAYER;
        this.createCapsule(1, .5, collideGroup);
    }
    hit(data) {
        const { amount, dealer } = data;
        const dealerActor = this.actorManager.getActorById(dealer);
        if (amount > 0 && this.parry) {
            io.emit('playerParried', { target: this.netId, dealer });
            if (dealerActor.parry) io.emit('playerParried', { target: dealer, dealer: this.netId })
            return;
        }
        super.hit(data);
    }
}