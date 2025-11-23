import LocalData from "../../client/core/LocalData";
import CGame from "./CGame";
import Menu from "./ui/Menu";
import './ui/StyleUI.css';
import { setupDiscordWindow } from "../../client/ui/DiscordStuff";
import setupChat from "./ui/Chat";
import Input from "./core/Input";

LocalData.load();
const canvas = document.getElementById('webgl');

const input = new Input(canvas);
setupChat(input);
const game = new CGame(canvas, input);
const menu = new Menu(game);


setupDiscordWindow();

window.addEventListener('beforeunload', () => {
    game.savePlayerState();
    LocalData.save();
});
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
});
document.addEventListener('dragstart', (e) => {
    e.stopPropagation();
});
document.addEventListener('dragenter', (e) => {
    e.stopPropagation();
});
document.addEventListener('dragleave', (e) => {
    e.stopPropagation();
});
document.addEventListener('dragover', (e) => {
    e.stopPropagation();
});
document.addEventListener('dragend', (e) => {
    e.stopPropagation();
});