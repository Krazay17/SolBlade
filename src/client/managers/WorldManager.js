import ActorManager from "@solblade/common/core/ActorManager";
import GameClient from "../core/GameClient";
import { menuButton } from "../ui/MainMenu";
import CSolWorld1 from "../worlds/CSolWorld1";
import CSolWorld2 from "../worlds/CSolWorld2";

const worldRegistry = {
    world1: CSolWorld1,
    world2: CSolWorld2,
}

export default class WorldManager {
    /**
     * 
     * @param {GameClient} game 
     * @param {String} worldName
     */
    constructor(game, worldName) {
        this.game = game;
        this.worldName = worldName;

        this.newWorld(worldName);
        
        menuButton('world1', () => {
            this.newWorld('world1');
        })
        menuButton('world2', () => {
            this.newWorld('world2');
        })
    }
    step(dt){

    }
    newWorld(name) {
        const worldClass = worldRegistry[name];
        if (worldClass) {
            this.world = new worldClass(this.game);
        } else {
            this.world = null
        }
        if(this.world)this.world.enter();
        this.worldName = this.world.name;
    }
}