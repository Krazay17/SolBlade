import LocalData from "./core/LocalData";
import Game from "./scenes/Game";
import "./core/NetManager";
import Menu from "./ui/Menu";
import soundPlayer from "./core/SoundPlayer";
import './ui/StyleUI.css';
import { setupDiscordWindow } from "./ui/DiscordStuff";
import setupChat from "./ui/Chat";

LocalData.load();
soundPlayer.setInitVolume();
setupChat();
const canvas = document.getElementById('webgl');
const game = new Game(canvas);
const menu = new Menu();

setupDiscordWindow();

window.addEventListener('beforeunload', () => {
    LocalData.save();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Ctrl') {
        e.preventDefault();
        e.stopPropagation();
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'Ctrl') {
        e.preventDefault();
        e.stopPropagation();
    }
});
window.addEventListener('keypress', (e) => {
    if (e.key === 'Ctrl') {
        e.preventDefault();
        e.stopPropagation();
    }
});
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});
document.addEventListener('dragenter', (e) => {
    e.preventDefault();
});
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});