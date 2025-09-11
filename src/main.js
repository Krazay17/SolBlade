import LocalData from "./core/LocalData";
import Game from "./core/Game";
import GameScene from "./scenes/GameScene";
import { initSocket } from "./core/NetManager";
import Menu from "./ui/Menu";
import soundPlayer from "./core/SoundPlayer";
import './ui/StyleUI.css';
import { setupDiscordWindow } from "./ui/DiscordStuff";
import setupChat from "./ui/Chat";
import voiceChat from "./core/VoiceChat";

LocalData.load();
soundPlayer.setInitVolume();
initSocket();
setupChat();
voiceChat.createButton();
const canvas = document.getElementById('webgl');
const game = new Game(canvas);
const gameScene = new GameScene(game);
const menu = new Menu();

game.setScene(gameScene);
game.start();


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