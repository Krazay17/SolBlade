import FXExplosion from "./FX/FXExplosion";
import MyEventEmitter from "./MyEventEmitter";


const FXRegistry = {
    explosion: FXExplosion,
}

export default class FXManager {
    constructor(game) {
        this.game = game;
        this.activeFX = [];
    }
    update(dt, time) {
        for (const f of this.activeFX) { if (f.active) f.update(dt, time) }
    }
    spawnFX(type, data, local = true) {
        console.log(data);
        const obj = FXRegistry[type];
        const fx = new obj(this.game, data);

        this.activeFX.push(fx);

        if (local) MyEventEmitter.emit('spawnFX', { type, data });
    }
}