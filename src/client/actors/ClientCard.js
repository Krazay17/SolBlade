import ClientPickup from "./ClientPickup";

export default class ClientCard extends ClientPickup {
    init() {
        this.itemData = this.data.itemData;
        this.build();
    }
    async build() {
        const mesh = await this.createMesh('item');
        const tex = await this.makeTexture(mesh);
        const geom = mesh.children[0].geometry;
        this.createBody(null, geom);
    }
    async makeTexture(mesh) {
        await this.game.meshManager?.getTex(this.itemData.name + '.png').then((tex) => {
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