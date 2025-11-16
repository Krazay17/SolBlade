import FXExplosion from "./FXExplosion";
import MyEventEmitter from "../MyEventEmitter";
import FXLine from "./FXLine";
import { Vector3 } from "three";
import FXTornado from "./FXTornado";
import FXAttackTrail from "./FXAttackTrail";
import FXSwordSpell from "./FXSwordSpell";
import FX from "./FX";


const FXRegistry = {
    explosion: FXExplosion,
    line: FXLine,
    tornado: FXTornado,
    attackTrail: FXAttackTrail,
    swordSpell: FXSwordSpell,
}

export default class FXManager {
    constructor(game) {
        this.game = game;
        this.activeFX = [];
    }
    update(dt, time) {
        for (const f of this.activeFX) { if (f.active) f.update(dt, time) }
    }
    spawnFX(type = 'explosion', data, local = true) {
        const obj = FXRegistry[type];
        if (!obj) return;
        data = local ? data : this.deserialize(data);
        /**@type {FX} */
        const fx = new obj(this.game, data);
        if (!fx) return;
        this.activeFX.push(fx);

        if (local) MyEventEmitter.emit('spawnFX', { type, data: this.serialize(data) });

        return fx;
    }
    serialize(data) {
        return {
            ...data,
            pos: data.pos && data.pos.toArray ? data.pos.toArray() : data.pos,
            dir: data.dir && data.dir.toArray ? data.dir.toArray() : data.dir,
        }
    }
    deserialize(data) {
        return {
            ...data,
            pos: Array.isArray(data.pos) ? new Vector3(data.pos[0], data.pos[1], data.pos[2]) : data.pos,
            dir: Array.isArray(data.dir) ? new Vector3(data.dir[0], data.dir[1], data.dir[2]) : data.dir,
        }
    }
}