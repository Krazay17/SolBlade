import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(game, manager, actor, options = {}) {
        super(game, manager, actor, options);
        this.cd = 400;
        this.duration = 400
    }
    enter() {
        super.enter()
        this.actor.movement.dashStart();
        this.actor.energyRegen = 0;
        this.movement.momentumBooster.increaseBoost(2);
        this.game.soundPlayer.playPosSound('dash', this.actor.position);

        switch (this.pivot()) {
            case 'Front':
                this.animationManager?.playAnimation('dash', false);
                break;
            case 'Left':
                this.animationManager?.playAnimation('dashLeft', false) || this.animationManager?.playAnimation('dash', false);
                break;
            case 'Right':
                this.animationManager?.playAnimation('dashRight', false) || this.animationManager?.playAnimation('dash', false);
                break;
            case 'Back':
                this.animationManager?.playAnimation('dashBwd', false) || this.animationManager?.playAnimation('dash', false);
                break;
            default:
                this.animationManager?.playAnimation('dash', false) || this.animationManager?.playAnimation('dash', false);
        }
    }
    update(dt) {
        this.actor.movement.dashMove(dt, 8, 5.5);
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