import RAPIER from "@dimforge/rapier3d-compat";
import GameCore from "./GameCore.js";
import { SOL_PHYSICS_SETTINGS } from "./SolConstants.js";

export default class SolWorld {
    /**
     * 
     * @param {GameCore} game 
     */
    constructor(game, name = "scene2") {
        this.game = game;
        this.name = name;

        this.ready = false;

        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
        this.physics.timestep = SOL_PHYSICS_SETTINGS.timeStep;
        this.actors = [];
    }
    enter(callback) { }
    exit() {
        // remove actors
        for (const actor of this.actors) {
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
        for (let i = 0; i < SOL_PHYSICS_SETTINGS.substeps; i++) {
            this.physics?.step();
        }
    }
}