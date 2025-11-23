import RAPIER from "@dimforge/rapier3d-compat";
import GameCore from "../../common/core/GameCore.js";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import Wizard from "./actors/Wizard.js";
import MyEventEmitter from "./MyEventEmitter.js";

export default class SolWorld {
    /**
     * 
     * @param {GameCore} game 
     */
    constructor(game, name = "world1") {
        this.game = game;
        this.name = name;

        this.ready = true;
        this.actorRegistry = {
            wizard: Wizard,

        }

        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
        this.physics.timestep = SOL_PHYSICS_SETTINGS.timeStep;
        this.actors = {
            players: [],
            enemies: [],
            others: []
        }
    }
    addActor(type, data) {
        let group;
        switch (type) {
            case "player":
                group = this.actors.players;
                break;
            case "enemy":
                group = this.actors.enemies;
                break;
            default:
                group = this.actors.others;
        }
        const aClass = this.actorRegistry[data.subtype];
        if (!aClass) return;
        const actor = new aClass(this, data);
        actor.makeBody?.(this.physics);
        group.push(actor);
    }
    enter(callback) { 
        const enemies = 2;

        for (let i = 0; i < enemies; i++) {
            this.addActor('enemy', { subtype: "wizard", pos: [0, 20, i] });
        }
    }
    exit() {
        // remove actors
        for (const actor of this.actors.enemies) {
            actor.removeBody(this.physics);
            actor.destroy?.();
        }
        for (const actor of this.actors.players) {
            actor.removeBody(this.physics);
            actor.destroy?.();
        }

        // remove graphics
        if (this.graphics) {
            this.game.graphics.remove(this.graphics);
            this.graphics.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }

        // free physics
        this.physics.free();
    }
    fixedStep(dt) {
        if (!this.ready) return;
        this.physics?.step();
    }
    tick(dt) {
        if (!this.ready) return;
        for (const a of this.actors.enemies) {
            a.tick?.(dt);
        }
    }
}