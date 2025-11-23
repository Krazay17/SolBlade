import GameCore from "../../common/core/GameCore.js";
import WorldManager from "../managers/WorldManager.js";

export default class GameServer extends GameCore {
    constructor(net) {
        super(net);
        this.worldManager = new WorldManager(this);
    }
}