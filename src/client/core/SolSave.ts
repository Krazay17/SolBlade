const CURRENT_VERSION = 0.01;

interface SaveData {
    version?: number;
    name?: string;
    worldName?: string;
    money?: number;
}

class SolSave implements SaveData {
    version = CURRENT_VERSION;
    name = "Player";
    worldName = "world2";
    money = 100;
    save(newData: SaveData = {}) {
        const data = {
            version: newData.version ?? this.version,
            name: newData.name ?? this.name,
            worldName: newData.worldName ?? this.worldName,
            money: newData.money ?? this.money,
        }
        localStorage.setItem("SolBladeSave", JSON.stringify(data))
    }
    load() {
        const data = localStorage.getItem("SolBladeSave");
        if (!data) return;
        const parsed = JSON.parse(data);
        if (parsed.version !== this.version) {
            const keep = {
                name: this.name,
            }
            this.reset(keep)
            return;
        }
        this.version = CURRENT_VERSION;
        this.name = parsed.name ?? this.name;
        this.worldName = parsed.worldName ?? this.worldName;
        this.money = parsed.money ?? this.money;
    }
    reset(keep) {
        this.name = keep.name ?? this.name;
    }
}
const solSave = new SolSave();
solSave.load();
export default solSave;