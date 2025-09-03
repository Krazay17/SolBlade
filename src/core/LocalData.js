const CURRENT_VERSION = 0.074;

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
            console.warn('Version mismatch: ' + parsed.version + ' current: ' + CURRENT_VERSION);

            this.reset(
                {
                    money: parsed.money,
                    name: parsed.name,
                    masterVolume: parsed.masterVolume,
                    musicVolume: parsed.musicVolume,
                    sfxVolume: parsed.sfxVolume,
                });
            return;
        }
        this.money = parsed.money ?? this.money;
        this.name = parsed.name ?? this.name;
        this.scene = parsed.scene ?? this.scene;
        this.position = parsed.position ?? this.position;
        this.masterVolume = parsed.masterVolume ?? this.masterVolume;
        this.musicVolume = parsed.musicVolume ?? this.musicVolume;
        this.sfxVolume = parsed.sfxVolume ?? this.sfxVolume;
        this.movementValues = parsed.movementValues ?? null;
        console.log('Loaded local data:', this);

    },

    reset(keep = {}) {
        this.money = keep.money ?? 0;
        this.health = keep.health ?? 100;
        this.mana = keep.mana ?? 50;
        this.scene = keep.scene ?? 1;
        this.position = keep.position ?? { x: 0, y: 5, z: 0 };
        this.masterVolume = keep.masterVolume ?? 1;
        this.musicVolume = keep.musicVolume ?? 1;
        this.sfxVolume = keep.sfxVolume ?? 1;
        this.movementValues = keep.movementValues ?? null;
    }
}