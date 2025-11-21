import Input from "./Input.js";
import LocalData from "./LocalData.js";
//import { setupDiscordWindow } from "./other/DiscordStuff.js";
//import Menu from "../client/ui/Menu.js";
import CGame from "./CGame.js";
import Net from "./Net.js";

LocalData.load();
//setupDiscordWindow();

const canvas = document.getElementById("webgl");
const input = new Input(canvas);
const net = new Net();
const game = new CGame(canvas, input, net);
//const menu = new Menu(game, net, input);

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