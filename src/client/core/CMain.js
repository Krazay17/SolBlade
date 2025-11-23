import Input from "./Input.js";
import LocalData from "./LocalData.js";
//import { setupDiscordWindow } from "./other/DiscordStuff.js";
import CGame from "./GameClient.js";
import NetManager from "../managers/NetManager.js";
import MainMenu from "../ui/MainMenu.js";

LocalData.load();
//setupDiscordWindow();

const canvas = document.getElementById("webgl");
const input = new Input(canvas);
const menu = new MainMenu(input);
const net = new NetManager();
const game = new CGame(canvas, input, net);

// bind global menu toggle
// input.onKeyDown("Escape", () => {
//     menu.toggle();
// });

game.start();

window.addEventListener('beforeunload', () => {
    //game.savePlayerState();
    LocalData.save();
});
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

window.devMode = () => {
    LocalData.flags.dev = true;
}