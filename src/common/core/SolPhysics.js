import RAPIER from "@dimforge/rapier3d-compat";
import SolWorld from "./SolWorld.js";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";

export default class SolPhysics {
    /**
     * 
     * @param {SolWorld} world 
     */
    constructor(world){
        this.world = world;

        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
    }
    tick(dt){
        this.physics.step();
    }
}