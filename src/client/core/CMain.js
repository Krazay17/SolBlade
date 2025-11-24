import UserInput from "../input/UserInput.js";
import LocalData from "./LocalData.js";
import CNetManager from "../net/CNetManager.js";
import MainMenu from "../ui/MainMenu.js";
import { NETPROTO } from "@common/net/NetProtocols.js";
import NetEvents from "../net/NetEvents.js";
import GameClient from "./GameClient.js";
import RAPIER from "@dimforge/rapier3d-compat";

async function boot() {

    LocalData.load();
    await RAPIER.init();

    const canvas = document.getElementById("webgl");
    const userInput = new UserInput(canvas);
    const menu = new MainMenu(userInput);
    const net = new CNetManager();
    await net.ready;
    const game = new GameClient(canvas, userInput, net);
    const netEvents = new NetEvents(game, net);
    await game.start();
    net.transport.emit(NETPROTO.PLAYER_JOINED, { name: "playername" });

    window.addEventListener('beforeunload', () => {
        //game.savePlayerState();
        LocalData.save();
    });
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}
boot();

window.devMode = () => {
    LocalData.flags.dev = true;
}