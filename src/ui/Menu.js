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

        this.skinButton = document.createElement('button');
        this.skinButton.innerText = 'Ninja';
        this.menuElement.appendChild(this.skinButton);
        this.skinButton.classList.add('menu-button');
        this.skinButton.addEventListener('click', () => {
            Globals.player.setMesh('NinjaDude');
        });
        this.skinButton2 = document.createElement('button');
        this.skinButton2.innerText = 'Girl';
        this.menuElement.appendChild(this.skinButton2);
        this.skinButton2.classList.add('menu-button');
        this.skinButton2.addEventListener('click', () => {
            Globals.player.setMesh('KnightGirl');
        });
    }

    createAudioSection() {
        this.volumeSlider = this.createSlider(LocalData.masterVolume * 100);
        this.volumeSlider.addEventListener('input', (event) => {
            soundPlayer.setMasterVolume(event.target.value / 100);
            LocalData.masterVolume = event.target.value / 100;
            this.volumeLabel.innerText = 'Master Volume: ' + LocalData.masterVolume;
        });
        this.volumeLabel = document.createElement('p');
        this.volumeLabel.innerText = 'Master Volume: ' + LocalData.masterVolume;

        this.menuElement.appendChild(this.volumeLabel);

        let seekValue = 0;
        this.seekSlider = this.createSlider(0);
        this.seekSlider.addEventListener('input', (event) => {
            soundPlayer.setSeek(event.target.value);
        });

        this.seekLabel = document.createElement('p');
        this.seekLabel.innerText = 'Seek: 0';
        this.menuElement.appendChild(this.seekLabel);
        setInterval(() => {
            if (soundPlayer.musicPlaying) {
                this.seekSlider.value = (soundPlayer.musicPlaying.currentTime / soundPlayer.musicPlaying.duration) * 100;
                this.seekLabel.innerText = 'Seek: ' + soundPlayer.musicPlaying.currentTime.toFixed(2) + ' / ' + soundPlayer.musicPlaying.duration.toFixed(2);
            }
        }, 10);

        const buttonGrid = document.createElement('div');
        buttonGrid.classList.add('menu-music-button-grid');
        this.menuElement.appendChild(buttonGrid);

        const playButton = document.createElement('button');
        playButton.classList.add('menu-button');
        playButton.innerText = "Play/Pause";
        buttonGrid.appendChild(playButton);
        const skipButton = document.createElement('button');
        skipButton.classList.add('menu-button');
        skipButton.innerText = "Skip";
        buttonGrid.appendChild(skipButton);

        playButton.addEventListener('click', () => {
            if (soundPlayer.musicPlaying.paused) {
                soundPlayer.musicPlaying.play();
            } else {
                soundPlayer.musicPlaying.pause();
            }
            playButton.blur();
        });

        skipButton.addEventListener('click', () => {
            soundPlayer.skipTrack();
            this.trackName.innerText = 'Current Track: ' + soundPlayer.getCurrentTrackName();
            skipButton.blur();
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