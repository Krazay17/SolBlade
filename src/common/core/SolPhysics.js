import RAPIER from "@dimforge/rapier3d-compat";
import SolWorld from "./SolWorld";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants";

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