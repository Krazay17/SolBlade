import * as THREE from 'three';
import LocalData from "../core/LocalData";
import MyEventEmitter from "@solblade/common/core/MyEventEmitter"

/**@type {SoundPlayer} */
export default class SoundPlayer {
    static instance = null;
    constructor(game, listener) {
        this.game = game;
        this.audioListener = listener;

        this.sounds = new Map();
        this.masterVolume = LocalData.masterVolume;
        this.musicVolume = LocalData.musicVolume;
        this.sfxVolume = LocalData.sfxVolume;
        this.micVolume = LocalData.micVolume;
        this.voicesVolume = LocalData.voicesVolume;
        this.musics = [];
        this.sfx = [];
        this.musicPlaying = null;
        this.posSoundPools = new Map();
        this.threeAudioLoader = new THREE.AudioLoader();

        this.loadSfx('hit', '/assets/hit.mp3');
        this.loadSfx('badHit', '/assets/badHit.mp3');

        this.init();
        SoundPlayer.instance = this;
    }
    init() {
        this.loadMusic('music1', '/assets/Music1.mp3');
        const playMusiconFirstClick = () => {
            document.removeEventListener('mousedown', playMusiconFirstClick);
            this.playMusic(0);
            this.loadAllMusic();
        }
        document.addEventListener('mousedown', playMusiconFirstClick);
    }

    setMicVolume(value) {
        this.micVolume = value;
        MyEventEmitter.emit('micVolumeChanged', value * this.masterVolume);
    }

    setVoicesVolume(value) {
        this.voicesVolume = value;
        MyEventEmitter.emit('voicesVolumeChanged', value * this.masterVolume);
    }

    playTTS(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = this.masterVolume;
            window.speechSynthesis.speak(utterance);
        }
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
        this.setMicVolume(LocalData.micVolume);
        this.setVoicesVolume(LocalData.voicesVolume);
    }

    getCurrentTrackName() {
        return this.musicPlaying ? this.musicPlaying.src : 'No Track Playing';
    }

    async loadAllMusic() {
        this.loadMusic('music2', '/assets/Music2.mp3');
        this.loadMusic('music3', '/assets/Music3.mp3');
        this.loadMusic('music4', '/assets/Music4.mp3');
    }

    setPosAudio(listener) {
        this.audioListener = listener;
    }
    loadPosAudio(name, url, poolSize = 5, onLoad = null) {
        if (!this.posSoundPools.has(name)) {
            this.posSoundPools.set(name, []);
        }

        const pool = this.posSoundPools.get(name);

        for (let i = 0; i < poolSize; i++) {
            const posAudio = new THREE.PositionalAudio(this.audioListener);

            this.threeAudioLoader.load(url, (buffer) => {
                posAudio.setBuffer(buffer);
                posAudio.setRefDistance(10);
                posAudio.setMaxDistance(100);
                posAudio.setRolloffFactor(2);
                posAudio.setVolume(this.sfxVolume * this.masterVolume);
                this.game.add(posAudio);
                if (onLoad) onLoad(posAudio);
            });

            pool.push(posAudio);
        }
    }
    playPosSound(name, pos) {
        this.applyPosSound(name, pos);
        MyEventEmitter.emit('playPosSound', { name, pos })
    }

    applyPosSound(name, position) {
        const url = `/assets/${name}.mp3`;
        // ensure pool exists
        let pool = this.posSoundPools.get(name);
        if (!pool) {
            if (url !== `/assets/.mp3`) {
                this.loadPosAudio(name, url, 1, (audio) => {
                    // play immediately after load
                    if (position) audio.position.copy(position);
                    audio.setVolume(this.sfxVolume * this.masterVolume);
                    audio.play();
                });
                pool = this.posSoundPools.get(name);
            } else {
                console.warn(`No positional audio pool for "${name}" and no URL provided.`);
                return;
            }
        }

        // find an available audio instance
        const audio = pool.find(a => !a.isPlaying && a.buffer);
        if (audio) {
            if (position) audio.position.copy(position);
            audio.setVolume(this.sfxVolume * this.masterVolume);
            audio.play();
            return;
        }

        // fallback: create one extra if pool exhausted
        if (url) {
            this.loadPosAudio(name, url, 1);
        } else {
            console.warn(`No free audio instance available for "${name}" and no URL to load more.`);
        }
    }

    stopPosAudio(name) {
        const pool = this.posSoundPools.get(name);
        if (!pool) return;
        const audio = pool.find(a => a.isPlaying);
        if (audio) {
            audio.stop();
        }
    }
}

export function playPosSound(name, pos) {
    if (currentInstance) currentInstance.playPosSound(name, pos);
}


export function getSoundPlayer() {
    if (SoundPlayer.instance) return SoundPlayer.instance;
    else throw new Error('SoundPlayer not initialized');
}