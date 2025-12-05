const CURRENT_VERSION = 0.01;
class SolSave {
    version = CURRENT_VERSION;
    name = "Player";
    worldName = "world1";
    money = 100;
    save() {
        const data = {
            version: this.version,
            worldName: this.worldName,
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
        this.worldName = parsed.worldName ?? this.worldName;
    }
    reset(keep) {
        this.name = keep.name ?? this.name;
    }
}
const solSave = new SolSave();
solSave.load();
export default solSave;