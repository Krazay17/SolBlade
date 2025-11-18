import SAbility from "./SAbility.js";

export default class SFireball extends SAbility {
    constructor(data) {
        super({
            ...data,
            name: 'fireball',
            cd: 3000,
            delay: 500,
            anim: "Attack1",
        });
    }
    start(actor) {
        super.start(actor);
        actor.setState?.('attack', this);
    }
    execute() {
        console.log('fireball');
    }
}