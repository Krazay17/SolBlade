export default class Crosshair {
    constructor(scene) {
        this.scene = scene;
        this.crosshair = this.createCrosshair();
        this.section = document.createElement('img');
        this.section.id = 'crosshair';
        this.section.src = '/assets/CrossHair.png';
        document.body.appendChild(this.section);
    }
    createCrosshair() {

    }
}
