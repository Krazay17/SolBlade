import SActor from "../../actors/SActor.js";
import SGame from "../../SGame.js";
import SFireball from "./SFireball.js";
import SMelee from "./SMelee.js";

const actionRegistry = {
    melee: SMelee,
    fireball: SFireball,
}

export default class SAbilityMan {
    constructor(game, actor, data = {}) {
        const {
            abilities = ['fireball', 'melee']
        } = data;
        /**@type {SGame} */
        this.game = game;
        /**@type {SActor} */
        this.actor = actor;
        this.data = data;

        this.abilities = []

        for (const a of abilities) {
            this.abilities.push(new actionRegistry[a]());
        }
    }
    doAction(range) {
        for (const a of this.abilities) {
            if (a && a.canUse(range)) {
                a.start?.(this.actor);
                return true;
            }
        }
        return false;
    }
}