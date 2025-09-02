import LocalData from "./LocalData";
import MyEventEmitter from "./MyEventEmitter";

class SoundPlayer {
    constructor() {
        this.sounds = new Map();
        this.masterVolume = LocalData.masterVolume;
        this.musicVolume = LocalData.musicVolume;
        this.sfxVolume = LocalData.sfxVolume;
        this.musics = [];
        this.sfx = [];
        this.musicPlaying = null;
    }

    loadSound(name, url) {
        const audio = new Audio(url);
        this.sounds.set(name, audio);
        return audio;
    }

    loadSfx(name, url) {
        this.sfx.push(this.loadSound(name, url));
    }

    loadMusic(name, url) {
        this.musics.push(this.loadSound(name, url));
    }

    playMusic(track = 0) {
        this.musicPlaying = this.musics[track];
        if (this.musicPlaying) {
            this.musicPlaying.volume = this.musicVolume * this.masterVolume;
            this.musicPlaying.currentTime = 0;
            this.musicPlaying.play();
            this.musicPlaying.onended = () => {
                const currentIndex = this.musics.indexOf(this.musicPlaying);
                const nextIndex = currentIndex + 1 < this.musics.length ? currentIndex + 1 : 0;
                this.playMusic(nextIndex);
                MyEventEmitter.emit('musicChanged', this.getCurrentTrackName());
            }
        }
    }

    setSeek(value) {
        if (this.musicPlaying) {
            const seekAmount = this.musicPlaying.duration * (value / 100);
            this.musicPlaying.currentTime = seekAmount;
        }
    }

    skipTrack() {
        const currentIndex = this.musics.indexOf(this.musicPlaying);
        const nextIndex = currentIndex + 1 < this.musics.length ? currentIndex + 1 : 0;
        if (this.musicPlaying) {
            this.musicPlaying.pause();
        }
        this.playMusic(nextIndex);
        return this.musicPlaying;
    }

    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.currentTime = 0;
            sound.volume = this.sfxVolume * this.masterVolume;
            sound.play();
        }
    }

    setMasterVolume(value) {
        this.masterVolume = value;
        this.sfx.forEach((sound) => {
            sound.volume = this.sfxVolume * this.masterVolume;
        });
        if (this.musicPlaying) {
            this.musicPlaying.volume = this.musicVolume * this.masterVolume;
        }
    }

    setMusicVolume(value) {
        this.musicVolume = value;
        if (this.musicPlaying) {
            this.musicPlaying.volume = this.musicVolume * this.masterVolume;
        }
    }

    setSfxVolume(value) {
        this.sfxVolume = value;
        this.sfx.forEach((sound) => {
            sound.volume = sound.volume * this.sfxVolume;
        });
    }

    setInitVolume() {
        this.setMasterVolume(LocalData.masterVolume);
        this.setMusicVolume(LocalData.musicVolume);
        this.setSfxVolume(LocalData.sfxVolume);
    }

    getCurrentTrackName() {
        return this.musicPlaying ? this.musicPlaying.src : 'No Track Playing';
    }

    async loadAllMusic() {
        this.loadMusic('music2', 'assets/Music2.mp3');
        this.loadMusic('music3', 'assets/Music3.mp3');
        this.loadMusic('music4', 'assets/Music4.mp3');
    }

    static getSoundInstance() {
        if (!SoundPlayer.instance) {
            SoundPlayer.instance = new SoundPlayer();
        }
        return SoundPlayer.instance;
    }
}
const soundPlayer = SoundPlayer.getSoundInstance();
export default soundPlayer;