import { randomIntFromRange } from "../utils/Utils";

export default class ItemRandomizer {
    constructor() {
        this.items = []
        this.addItem('Fireball', 2);
        this.addItem('Sword', 1);
    }

    setItems(items) {
        this.items = items
    }

    addItem(name = 'Fireball', weight = 1, valueMin = 1, valueMax = 10, data = {}) {
        const imgUrl = `assets/${name}.png`;
        this.items.push({ name, weight, valueMin, valueMax, imgUrl, data });
    }

    getRandomItem(luck = 0) {
        const totalWeight = this.items.reduce((sum, item) => sum + item.weight, 0);
        let random = (Math.random() * totalWeight) - luck;

        for (const item of this.items) {
            if (random < item.weight) {
                const value = randomIntFromRange(item.valueMin, item.valueMax);
                return { ...item, value };
            }
            random -= item.weight;
        }
    }
}