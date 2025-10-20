import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import Globals from '../utils/Globals';
import './StyleMenu.css';

const menuSection = document.createElement('div');
menuSection.id = 'menu-section';
menuSection.innerHTML = `
            <h1>Menu <button class="close-button">X</button></h1>
        `;
document.body.appendChild(menuSection);
const menuElement = document.createElement('div');
menuElement.classList.add('menu-element');
menuSection.appendChild(menuElement);
const menuElement2 = document.createElement('div');
menuElement2.classList.add('menu-element');
menuSection.appendChild(menuElement2);

export default class Menu {
    static instance;
    constructor(game) {
        this.game = game
        this.isOpen = false;


        menuSection.querySelector('.close-button').addEventListener('click', () => {
            this.close();
        });

        window.addEventListener('keydown', (event) => {
            if (Globals.input.inputBlocked) return;
            if (event.code === 'KeyB' || event.code === 'Escape') {
                this.isOpen = !this.isOpen;
                if (this.isOpen) {
                    this.open();
                    document.exitPointerLock();
                } else {
                    this.close();
                }
            }
        });
        window.addEventListener('keydown', (event) => {
            if (Globals.input.inputBlocked) return;
            if (event.code === 'KeyM') {
                document.exitPointerLock();
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
        menuElement.appendChild(this.sensitivityText);

        const skinGrid = document.createElement('div');
        skinGrid.classList.add('menu-button-grid');
        menuElement.appendChild(skinGrid);
        this.skinButton = document.createElement('button');
        this.skinButton.innerText = 'Ninja';
        this.skinButton.classList.add('menu-button');
        skinGrid.appendChild(this.skinButton);
        this.skinButton.addEventListener('click', () => {
            Globals.player.setMesh('NinjaDude');
        });
        this.skinButton2 = document.createElement('button');
        this.skinButton2.innerText = 'Girl';
        this.skinButton2.classList.add('menu-button');
        skinGrid.appendChild(this.skinButton2);
        this.skinButton2.addEventListener('click', () => {
            Globals.player.setMesh('KnightGirl');
        });
    }

    createAudioSection() {
        this.masterVolumeSlider = this.createSlider(LocalData.masterVolume * 100);
        this.masterVolumeSlider.addEventListener('input', (event) => {
            const scaledValue = event.target.value / 100;
            this.game.soundPlayer.setMasterVolume(scaledValue);
            LocalData.masterVolume = scaledValue;
            this.masterVolumeLabel.innerText = 'Master Volume: ' + LocalData.masterVolume;
        });
        this.masterVolumeLabel = document.createElement('p');
        this.masterVolumeLabel.innerText = 'Master Volume: ' + LocalData.masterVolume;
        menuElement.appendChild(this.masterVolumeLabel);

        this.musicVolumeSlider = this.createSlider(LocalData.musicVolume * 100);
        this.musicVolumeSlider.addEventListener('input', (event) => {
            const scaledValue = event.target.value / 100;
            this.game.soundPlayer.setMusicVolume(scaledValue);
            LocalData.musicVolume = scaledValue;
            this.musicVolumeLabel.innerText = 'Music Volume: ' + LocalData.musicVolume;
        });
        this.musicVolumeLabel = document.createElement('p');
        this.musicVolumeLabel.innerText = 'Music Volume: ' + LocalData.musicVolume;
        menuElement.appendChild(this.musicVolumeLabel);

        this.sfxVolumeSlider = this.createSlider(LocalData.sfxVolume * 100);
        this.sfxVolumeSlider.addEventListener('input', (event) => {
            const scaledValue = event.target.value / 100;
            this.game.soundPlayer.setSfxVolume(scaledValue);
            LocalData.sfxVolume = scaledValue;
            this.sfxVolumeLabel.innerText = 'SFX Volume: ' + LocalData.sfxVolume;
        });
        this.sfxVolumeLabel = document.createElement('p');
        this.sfxVolumeLabel.innerText = 'SFX Volume: ' + LocalData.sfxVolume;
        menuElement.appendChild(this.sfxVolumeLabel);

        this.micVolumeSlider = this.createSlider(LocalData.micVolume * 100);
        this.micVolumeSlider.addEventListener('input', (event) => {
            const scaledValue = event.target.value / 100;
            this.game.soundPlayer.setMicVolume(scaledValue);
            LocalData.micVolume = scaledValue;
            this.micVolumeLabel.innerText = 'Microphone: ' + LocalData.micVolume;
        });
        this.micVolumeLabel = document.createElement('p');
        this.micVolumeLabel.innerText = 'Microphone: ' + LocalData.micVolume;
        menuElement.appendChild(this.micVolumeLabel);

        this.voiceVolumeSlider = this.createSlider(LocalData.voicesVolume * 100);
        this.voiceVolumeSlider.addEventListener('input', (event) => {
            const scaledValue = event.target.value / 100;
            this.game.soundPlayer.setVoicesVolume(scaledValue);
            LocalData.voicesVolume = scaledValue;
            this.voiceVolumeLabel.innerText = 'Voices: ' + LocalData.voicesVolume;
        });
        this.voiceVolumeLabel = document.createElement('p');
        this.voiceVolumeLabel.innerText = 'Voices: ' + LocalData.voicesVolume;
        menuElement.appendChild(this.voiceVolumeLabel);

        let seekValue = 0;
        this.seekSlider = this.createSlider(0);
        this.seekSlider.addEventListener('input', (event) => {
            this.game.soundPlayer.setSeek(event.target.value);
        });

        this.seekLabel = document.createElement('p');
        this.seekLabel.innerText = 'Music Seek: 0';
        menuElement.appendChild(this.seekLabel);
        setInterval(() => {
            if (this.game.soundPlayer.musicPlaying) {
                this.seekSlider.value = (this.game.soundPlayer.musicPlaying.currentTime / this.game.soundPlayer.musicPlaying.duration) * 100;
                this.seekLabel.innerText = 'Music Seek: ' + this.game.soundPlayer.musicPlaying.currentTime.toFixed(2) + ' / ' + this.game.soundPlayer.musicPlaying.duration.toFixed(2);
            }
        }, 10);

        const buttonGrid = document.createElement('div');
        buttonGrid.classList.add('menu-button-grid');
        menuElement.appendChild(buttonGrid);

        const playButton = document.createElement('button');
        playButton.classList.add('menu-button');
        playButton.innerText = "Play/Pause";
        buttonGrid.appendChild(playButton);
        const skipButton = document.createElement('button');
        skipButton.classList.add('menu-button');
        skipButton.innerText = "Skip";
        buttonGrid.appendChild(skipButton);

        playButton.addEventListener('click', () => {
            if (this.game.soundPlayer.musicPlaying.paused) {
                this.game.soundPlayer.musicPlaying.play();
            } else {
                this.game.soundPlayer.musicPlaying.pause();
            }
            playButton.blur();
        });

        skipButton.addEventListener('click', () => {
            this.game.soundPlayer.skipTrack();
            this.trackName.innerText = 'Current Track: ' + this.game.soundPlayer.getCurrentTrackName();
            skipButton.blur();
        });

        this.trackName = document.createElement('p');
        this.trackName.innerText = 'Current Track: ' + this.game.soundPlayer.getCurrentTrackName();
        menuElement.appendChild(this.trackName);
        MyEventEmitter.on('musicChanged', (trackName) => {
            this.trackName.innerText = 'Current Track: ' + trackName;
        });
    }

    createSlider(start = 50, min = 0, max = 100) {
        const slider = document.createElement('input');
        slider.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        })
        slider.classList.add('menu-slider');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = start;
        menuElement.appendChild(slider);
        return slider;
    }

    createButton(text = 'Skip Track') {
        const button = document.createElement('button');
        button.classList.add('menu-button');
        button.innerText = text;
        menuElement.appendChild(button);
        return button;
    }


    open() {
        menuSection.style.display = 'grid';
        this.isOpen = true;
    }

    close() {
        menuSection.style.display = 'none';
        this.isOpen = false;
    }
}
export function menuButton(text = 'Button', callback = () => { }) {
    const button = document.createElement('button');
    button.classList.add('menu-button');
    button.innerText = text;
    button.addEventListener('click', callback);
    menuElement2.appendChild(button);
    return button;
}
export function menuSlider(text = 'Slider', min = 0, max = 1, step = 0.1, callback = () => { }) {
    const slider = document.createElement('input');
    slider.classList.add('menu-slider');
    slider.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    })
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = min;
    const label = document.createElement('p');
    label.innerText = text;
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        label.innerText = `${text}: ${value}`;
        callback(value);
    });

    menuElement2.appendChild(slider);
    menuElement2.appendChild(label);
    return { slider, label };
}