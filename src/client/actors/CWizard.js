import CEnemy from "./CEnemy";

export default class CWizard extends CEnemy {
    constructor(game, data) {
        super(game, {
            ...data,
            skin: "Wizard",
        });
    }
}