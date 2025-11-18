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
            actions = ['fireball', 'melee']
        } = data;
        /**@type {SGame} */
        this.game = game;
        /**@type {SActor} */
        this.actor = actor;
        this.data = data;

        this.abilities = {};
        this.actions = []
        this.action = null;

        for (const a of actions) {
            this.actions.push(new actionRegistry[a]());
        }
    }
    doAction(range) {
        for (const a of this.actions) {
            if (a && a.canUse(range)) {
                a.start?.(this.actor);
                return true;
            }
        }
        return false;
    }
}