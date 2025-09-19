export default class Item {
    constructor({
        name = '',
        imgUrl = '',
        weight = 1,
        min = 1,
        max = 10,
        extra = {},
    } = {}) {
        this.name = name;
        this.imgUrl = imgUrl;
        this.weight = weight;
        this.min = min;
        this.max = max;
        this.extra = extra;
    }

    rollValue() {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    }
}