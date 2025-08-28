import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
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

        this.createAudioSection();
    }

    createAudioSection() {
        this.soundSlider = this.createSlider();
        this.soundSlider.addEventListener('input', (event) => {
            soundPlayer.setMasterVolume(event.target.value / 100);
            LocalData.masterVolume = event.target.value / 100;
            // Handle volume change
        });

        this.skipButton = this.createButton();
        this.skipButton.addEventListener('click', () => {
            soundPlayer.skipTrack();
            this.trackName.innerText = 'Current Track: ' + soundPlayer.getCurrentTrackName();
            this.skipButton.blur();
        });

        this.trackName = document.createElement('p');
        this.trackName.innerText = 'Current Track: ' + soundPlayer.getCurrentTrackName();
        this.menuElement.appendChild(this.trackName);
        MyEventEmitter.on('musicChanged', (trackName) => {
            this.trackName.innerText = 'Current Track: ' + trackName;
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

    createButton(text = 'Skip Track') {
        const button = document.createElement('button');
        button.classList.add('menu-button');
        button.innerText = text;
        this.menuElement.appendChild(button);
        return button;
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