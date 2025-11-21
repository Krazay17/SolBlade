import RAPIER from "@dimforge/rapier3d-compat";
import GameCore from "../GameCore.js";
import { Server } from "socket.io";

await RAPIER.init();

export default class SGame extends GameCore {
    /**
     * 
     * @param {Server} io 
     */
    constructor(io) {
        super();
        this.io = io;
    }
}