export default class Crosshair {
    constructor(scene) {
        this.scene = scene;
        this.crosshair = this.createCrosshair();
        this.section = document.createElement('div');
        this.section.id = 'crosshair';
        document.body.appendChild(this.section);
    }
    createCrosshair() {

    }
}
