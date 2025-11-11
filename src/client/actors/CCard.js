import CPickup from "./CPickup";

export default class CCard extends CPickup {
    init() {
        this.build();
    }
    async build() {
        const mesh = await this.createMesh('item');
        mesh.scale.x = .5;
        mesh.scale.y = .5;
        mesh.scale.z = .5;
        const tex = await this.makeTexture(mesh);
        const geom = mesh.children[0].geometry;
        this.createBody(null, geom);
    }
    update(dt, time){
        super.update(dt, time);
        this.rotY += dt
    }
    async makeTexture(mesh) {
        await this.game.meshManager?.getTex(this.data.itemData.name + '.png').then((tex) => {
            if (!mesh || !mesh.children) return;

            const mesh1 = mesh.children[0];
            if (mesh1) {
                mesh1.material = mesh1.material.clone();
                mesh1.material.map = tex;
                mesh1.material.emissiveMap = tex;
                mesh1.material.color.set(0xffffff);
                mesh1.material.emissive.set(0xffffff);
                mesh1.material.emissiveIntensity = 1;
                mesh1.material.needsUpdate = true;
            }

            const beam = mesh.children[1];
            if (beam) {
                beam.material.opacity = .6;
                beam.material.emissiveIntensity = 1;
                beam.material.emissive.set(0xffffff);
                beam.material.transparent = true;
            }

        })
    }
}