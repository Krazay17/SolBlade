import LocalData from "./LocalData";

class SoundPlayer {
    constructor() {
        this.sounds = new Map();
        this.masterVolume = LocalData.masterVolume;
    }

    loadSound(name, url) {
        const audio = new Audio(url);
        this.sounds.set(name, audio);
    }

    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.currentTime = 0;
            sound.volume = this.masterVolume;
            sound.play();
        }
    }

    setMasterVolume(value) {
        this.masterVolume = value;
        this.sounds.forEach((sound) => {
            sound.volume = value;
        });
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