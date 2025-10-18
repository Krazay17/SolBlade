import { netSocket } from "../../core/NetManager";
import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.cd = 400;
        this.duration = 300
    }
    enter() {
        super.enter()
        this.actor.animationManager?.playAnimation('dash', false);
        const pos = { x: this.actor.position.x, y: this.actor.position.y, z: this.actor.position.z };
        netSocket.emit('playerAudio', { name: 'dash', pos, url: 'assets/Dash.mp3' });
        this.actor.movement.dashStart();
        this.actor.energyRegen = 0;
        this.movement.momentumBooster.increaseBoost(2);
    }
    update(dt) {
        this.actor.movement.dashMove(dt, 10, 7);
        if (this.exitTimer < performance.now()) {
            if (this.input.actionStates.blade) {
                this.manager.setState('blade');
                return;

            } else {
                this.actor.energyRegen = 25;
                this.manager.setState('idle');
                return;
            }
        }
    }
    exit() {
        //this.actor.movement.dashStop();
        this.actor.energyRegen = 25;
    }
}