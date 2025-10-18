import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(game, manager, actor, options = {}) {
        super(game, manager, actor,options);
        this.cd = 400;
        this.duration = 300
    }
    enter() {
        super.enter()
        this.actor.movement.dashStart();
        this.actor.energyRegen = 0;
        this.movement.momentumBooster.increaseBoost(2);

        this.actor.animationManager?.playAnimation('dash', false);
        this.game.soundPlayer.playPosSound('dash', this.actor.position);
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