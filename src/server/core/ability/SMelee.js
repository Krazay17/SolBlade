import SAbility from "./SAbility.js";

export default class SMelee extends SAbility {
    constructor(data) {
        super({
            ...data,
            name: 'melee',
            cd: 1000,
            range: 5,
        })
    }
    execute() {
        super.execute();
        console.log('melee');
    }
}