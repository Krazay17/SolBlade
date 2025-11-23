import UserInput from "../input/UserInput.js";
import LocalData from "./LocalData.js";
//import { setupDiscordWindow } from "./other/DiscordStuff.js";
import CGame from "./GameClient.js";
import NetManager from "../managers/NetManager.js";
import MainMenu from "../ui/MainMenu.js";

async function boot() {

    LocalData.load();
    //setupDiscordWindow();

    const canvas = document.getElementById("webgl");
    const userInput = new UserInput(canvas);
    const menu = new MainMenu(userInput);
    const net = new NetManager();
    await net.ready;
    net.bindEvents();

    const game = new CGame(canvas, userInput, net);
    await game.start();

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