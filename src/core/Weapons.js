class Weapon {
    constructor(name, damage, range, cooldown) {
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown; // in seconds
        this.lastUsed = 0; // timestamp of last use
    }

    canUse(currentTime) {
        return (currentTime - this.lastUsed) >= this.cooldown * 1000;
    }

    use(currentTime) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }
}

export class Pistol extends Weapon {
    constructor() {
        super('Pistol', 10, 50, 0.5); // name, damage, range, cooldown
    }
    use(currentTime) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            console.log('Pistol fired!');
            return true;
        }
        return false;
    }
}