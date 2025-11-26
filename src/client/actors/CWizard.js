import CPawn from "./CPawn";

export default class CWizard extends CPawn {
    constructor(game, data) {
        super(game, {
            ...data,
            name: "Wizard",
            meshName: "Wizard",
            isRemote: true,
        });

        this.init();
        this.makeMesh();
    }
}