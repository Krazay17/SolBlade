
import SNetManager from "../managers/SNetManager.js";
import GameServer from "./GameServer.js";

const net = new SNetManager();
const remoteTransport = null;
const game = new GameServer(remoteTransport);
