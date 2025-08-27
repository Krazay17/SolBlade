const CURRENT_VERSION = 0.01;

export default {
    version: CURRENT_VERSION,
    name: "Player",
    money: 0,
    health: 100,
    mana: 50,
    scene: 1,
    position: { x: 0, y: 5, z: 0 },

    save() {
        const data = {
            version: this.version,
            name: this.name,
            money: this.money,
            scene: this.scene,
            position: this.position,
        }
        localStorage.setItem('SolBladeSave', JSON.stringify(data));
    },

    load() {
        const data = localStorage.getItem('SolBladeSave');
        if (!data) return;
        const parsed = JSON.parse(data);
        if (parsed.version !== CURRENT_VERSION) {
            this.reset();
            console.warn('Version mismatch: ' + parsed.version + ' current: ' + CURRENT_VERSION);
        }
        this.money = parsed.money ?? this.money;
        this.name = parsed.name ?? this.name;
        this.scene = parsed.scene ?? this.scene;
        this.position = parsed.position ?? this.position;
    },

    reset() {
        localStorage.removeItem('SolBladeSave');
    }
}