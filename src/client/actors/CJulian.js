import CEnemy from "./CEnemy";

export default class CJulian extends CEnemy {
    constructor(game, data) {
        super(game, {
            ...data,
            skin: "julian",
        });
    }
}