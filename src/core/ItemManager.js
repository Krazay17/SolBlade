import Item from "./Item";

export default class ItemManager {
    constructor() {
        this.items = {
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
        }
        this.itemsAvailable = [
            this.items.fireball,
            this.items.sword,
        ];
        this.itemsOwned = [];

    }

    addItem(item) {
        const itemObj = typeof item === "string" ? this.items[item] : item;
        if (!this.itemsAvailable.includes(itemObj)) {
            this.itemsAvailable.push(itemObj);
        }
    }

    makeItem(name) {
        return new Item(this.items[name]);
    }

    makeRandomItem() {
        return new Item(this._getRandomItem())
    }

    addOwnedItem(item) {
        this.itemsOwned.push(item)
    }

    _getRandomItem(luck = 0) {
        const totalWeight = this.itemsAvailable.reduce((sum, item) => sum + item.weight + luck, 0);
        let random = Math.random() * totalWeight;

        for (const item of this.itemsAvailable) {
            const adjustedWeight = item.weight + luck;
            if (random < adjustedWeight) {
                return item;
            }
            random -= adjustedWeight;
        }
    }
}