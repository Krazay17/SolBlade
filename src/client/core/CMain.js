import UserInput from "../input/UserInput.js";
import LocalData from "./LocalData.js";
import { NetworkManager } from "./NetworkManager.js";
import MainMenu from "../ui/MainMenu.js";
import GameClient from "./GameClient.js";
import RAPIER from "@dimforge/rapier3d-compat";

const url = location.hostname === "localhost"
    ? "ws://localhost:8080"
    : "wss://srv.solblade.online";
async function boot() {

    LocalData.load();
    await RAPIER.init();

    const canvas = document.getElementById("webgl");
    const userInput = new UserInput(canvas);
    const menu = new MainMenu(userInput);
    const net = new NetworkManager(url);
    const game = new GameClient(canvas, userInput, net);
    await game.start();
    await net.connect();

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