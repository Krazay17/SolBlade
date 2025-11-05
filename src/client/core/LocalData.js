const CURRENT_VERSION = 0.091;

export default {
    version: CURRENT_VERSION,
    name: "Player",
    money: 0,
    health: 100,
    sceneName: 'scene2',
    position: [0, 1, 0],
    rotation: [],
    masterVolume: 1,
    musicVolume: 1,
    sfxVolume: 1,
    micVolume: 1,
    voicesVolume: 1,
    movementValues: null,
    flags: {},
    items: [],

    addItem(item) {
        this.items.push(item);
        this.save();
    },
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.save();
        }
    },

    save() {
        const data = {
            version: this.version,
            name: this.name,
            money: this.money,
            health: this.health,
            scene: this.scene,
            sceneName: this.sceneName,
            position: this.position,
            rotation: this.rotation,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            micVolume: this.micVolume,
            voicesVolume: this.voicesVolume,
            sfxVolume: this.sfxVolume,
            movementValues: this.movementValues,
            flags: this.flags,
            items: this.items,
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
                    // Dont reset these values on version change
                    money: parsed.money,
                    name: parsed.name,
                    masterVolume: parsed.masterVolume,
                    musicVolume: parsed.musicVolume,
                    sfxVolume: parsed.sfxVolume,
                    micVolume: parsed.micVolume,
                    voicesVolume: parsed.voicesVolume,
                    flags: parsed.flags,
                    //items: parsed.items,
                });
            return;
        }
        this.name = parsed.name ?? this.name;
        this.money = parsed.money ?? this.money;
        this.health = parsed.health ?? this.health;
        this.scene = parsed.scene ?? this.scene;
        this.sceneName = parsed.sceneName ?? this.sceneName;
        this.position = parsed.position ?? this.position;
        this.rotation = parsed.rotation ?? this.rotation;
        this.masterVolume = parsed.masterVolume ?? this.masterVolume;
        this.musicVolume = parsed.musicVolume ?? this.musicVolume;
        this.sfxVolume = parsed.sfxVolume ?? this.sfxVolume;
        this.micVolume = parsed.micVolume ?? this.micVolume;
        this.voicesVolume = parsed.voicesVolume ?? this.voicesVolume;
        this.movementValues = parsed.movementValues ?? null;
        this.flags = parsed.flags ?? {};
        this.items = parsed.items ?? [];
        console.log('Loaded local data:', this);

    },

    reset(keep = {}) {
        this.name = keep.name ?? this.name;
        this.money = keep.money ?? this.money;
        this.health = keep.health ?? this.health;
        this.scene = keep.scene ?? this.scene;
        this.sceneName = keep.sceneName ?? this.sceneName;
        this.position = keep.position ?? this.position;
        this.rotation = keep.rotation ?? this.rotation;
        this.masterVolume = keep.masterVolume ?? this.masterVolume;
        this.musicVolume = keep.musicVolume ?? this.musicVolume;
        this.sfxVolume = keep.sfxVolume ?? this.sfxVolume;
        this.micVolume = keep.micVolume ?? this.micVolume;
        this.voicesVolume = keep.voicesVolume ?? this.voicesVolume;
        this.movementValues = keep.movementValues ?? null;
        this.flags = keep.flags ?? {};
        this.items = keep.items ?? [];
        console.log('Reset local data:', this);
        this.save();
    },
}