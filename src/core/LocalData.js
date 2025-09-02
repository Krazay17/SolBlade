const CURRENT_VERSION = 0.05;

export default {
    version: CURRENT_VERSION,
    name: "Player",
    money: 0,
    health: 100,
    mana: 50,
    scene: 1,
    position: { x: 0, y: 5, z: 0 },
    masterVolume: 1,
    musicVolume: 1,
    sfxVolume: 1,
    movementValues: null,

    save() {
        const data = {
            version: this.version,
            name: this.name,
            money: this.money,
            scene: this.scene,
            position: this.position,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            movementValues: this.movementValues,
        }
        localStorage.setItem('SolBladeSave', JSON.stringify(data));
    },

    load() {
        const data = localStorage.getItem('SolBladeSave');
        if (!data) return;
        const parsed = JSON.parse(data);
        if (parsed.version !== CURRENT_VERSION) {
            //this.reset();
            this.movementValues = null;
            console.warn('Version mismatch: ' + parsed.version + ' current: ' + CURRENT_VERSION);
            return;
        }
        this.money = parsed.money ?? this.money;
        this.name = parsed.name ?? this.name;
        this.scene = parsed.scene ?? this.scene;
        this.position = parsed.position ?? this.position;
        this.masterVolume = parsed.masterVolume ?? this.masterVolume;
        this.musicVolume = parsed.musicVolume ?? this.musicVolume;
        this.sfxVolume = parsed.sfxVolume ?? this.sfxVolume;
        this.movementValues = parsed.movementValues ?? this.movementValues;
        console.log('Loaded local data:', this);

    },

    reset() {
        localStorage.removeItem('SolBladeSave');
    }
}