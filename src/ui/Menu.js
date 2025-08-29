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
            <p>Sound Volume</p>
            </div>
        `;

        window.addEventListener('keydown', (event) => {
            if (Globals.input.inputBlocked) return;
            if (event.code === 'KeyB') {
                this.isOpen = !this.isOpen;
                if (this.isOpen) {
                    this.open();
                    document.exitPointerLock();
                } else {
                    this.close();
                }
            }
        });

        this.createAudioSection();
        this.sensitivitySlider = this.createSlider(Globals.input.sensitivity * 5000);
        this.sensitivitySlider.addEventListener('input', (event) => {
            Globals.input.sensitivity = event.target.value / 5000;
            this.sensitivityText.innerText = 'Mouse Sensitivity: ' + Globals.input.sensitivity;
        });
        this.sensitivityText = document.createElement('p');
        this.sensitivityText.innerText = 'Mouse Sensitivity: ' + Globals.input.sensitivity;
        this.menuElement.appendChild(this.sensitivityText);
    }

    createAudioSection() {
        this.soundSlider = this.createSlider(LocalData.masterVolume * 100);
        this.soundSlider.addEventListener('input', (event) => {
            soundPlayer.setMasterVolume(event.target.value / 100);
            LocalData.masterVolume = event.target.value / 100;
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

    createSlider(start = 50) {
        const slider = document.createElement('input');
        slider.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        })
        slider.classList.add('menu-slider');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = start;
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