import LocalData from '../core/LocalData';
import soundPlayer from '../core/SoundPlayer';
import Globals from '../utils/Globals';
import './StyleMenu.css';

export default class Menu {
    static instance;
    constructor() {
        if (Menu.instance) {
            return Menu.instance;
        }
        this.isOpen = false;

        this.menuElement = document.createElement('div');
        this.menuElement.id = 'menu-section';
        this.menuElement.innerHTML = `
            <h2>Menu</h2>
            <div id="menu-item-grid">
            <p>Sound Volume</p>
            </div>
        `;
        this.soundSlider = this.createSlider();
        this.soundSlider.addEventListener('input', (event) => {
            soundPlayer.setMasterVolume(event.target.value / 100);
            LocalData.masterVolume = event.target.value / 100;
            // Handle volume change
        });

        window.addEventListener('keydown', (event) => {
            if (Globals.input.inputBlocked) return;
            if (event.code === 'KeyB') {
                this.isOpen = !this.isOpen;
                if (this.isOpen) {
                    this.open();
                } else {
                    this.close();
                }
            }
        });
    }

    createSlider() {
        const slider = document.createElement('input');
        slider.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        })
        slider.classList.add('menu-slider');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = LocalData.masterVolume * 100;
        console.log(LocalData.masterVolume)
        this.menuElement.appendChild(slider);
        return slider;
    }

    open() {
        document.body.appendChild(this.menuElement);
        this.isOpen = true;
    }

    close() {
        document.body.removeChild(this.menuElement);
        this.isOpen = false;
    }
}