import LocalData from "./core/LocalData";
import Game from "./Game";
import Menu from "./ui/Menu";
import './ui/StyleUI.css';
import { setupDiscordWindow } from "./ui/DiscordStuff";
import setupChat from "./ui/Chat";
import Input from "./core/Input";
import NetManager from "./core/NetManager";

LocalData.load();
const canvas = document.getElementById('webgl');

const input = new Input(canvas);
setupChat();
const game = new Game(canvas, input);
const menu = new Menu(game);
//const net = new NetManager(game);

setupDiscordWindow();

window.addEventListener('beforeunload', () => {
    LocalData.save();
});
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});