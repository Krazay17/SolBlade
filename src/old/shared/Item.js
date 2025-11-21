const itemRegister = {
    fireball: {
        name: 'Fireball',
        imgUrl: 'assets/Fireball.png',
        weight: 1,
        min: 1,
        max: 10,
    },
    sword: {
        name: 'Sword',
        imgUrl: 'assets/Sword.png',
        weight: 0.5,
        min: 5,
        max: 15,
    },
    scythe: {
        name: 'Scythe',
        imgUrl: 'assets/Scythe.png',
        weight: .02,
        min: 5,
        max: 15,
        pickupSound: 'pickup7',
    },
    pistol: {
        name: 'Pistol',
        imgUrl: 'assets/Pistol.png',
        weight: 1,
        min: 5,
        max: 15,
    },
    blade: {
        name: 'Blade',
        imgUrl: 'assets/Blade.png',
        weight: 1,
        min: 5,
        max: 15,
    }
}
const itemPool1 = [
    itemRegister.fireball,
    itemRegister.sword,
    itemRegister.scythe,
    itemRegister.pistol,
    itemRegister.blade,
]
export function makeItem(item) {
    return new Item(itemRegister[item]);
}
export function makeRandomItem(itemPool = itemPool1, luck = 0) {
    return new Item(getRandomItem(itemPool, luck));
}
function getRandomItem(itemPool, luck = 0) {
    const totalWeight = itemPool.reduce((sum, item) => sum + item.weight + luck, 0);
    let random = Math.random() * totalWeight;

    for (const item of itemPool) {
        const weight = item.weight
        if (random < weight) {
            return item
        }
        random -= weight;
    }
}

export default class Item {
    constructor({
        name = '',
        imgUrl = '',
        weight = 1,
        min = 1,
        max = 10,
        pickupSound = 'pickup',
    } = {}
    ) {
        this.name = name;
        this.imgUrl = imgUrl;
        this.weight = weight;
        this.min = min;
        this.max = max;
        this.pickupSound = pickupSound;
    }

    rollValue() {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    }
}