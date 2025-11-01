import LocalData from "./core/LocalData";
import Game from "./Game";
import Menu from "./ui/Menu";
import './ui/StyleUI.css';
import { setupDiscordWindow } from "./ui/DiscordStuff";
import setupChat from "./ui/Chat";

async function main() {
    LocalData.load();
    setupChat();
    const canvas = document.getElementById('webgl');
    const game = new Game(canvas);
    const menu = new Menu(game);

}
main()

setupDiscordWindow();

window.addEventListener('beforeunload', () => {
    LocalData.save();
});
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});