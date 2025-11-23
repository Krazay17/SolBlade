import GameCore from "../../../common/core/GameCore.js";
import { Server } from "socket.io";

export default class SGame extends GameCore {
    /**
     * 
     * @param {Server} io 
     */
    constructor(io) {
        super();
        this.io = io;
        
        this.solWorlds = [];
    }
}