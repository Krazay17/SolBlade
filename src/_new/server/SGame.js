import Game from "./Game.js";
import { Server } from "socket.io";

export default class SGame extends Game {
    /**
     * 
     * @param {Server} io 
     */
    constructor(io) {
        this.io = io;
    }
}