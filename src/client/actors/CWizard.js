import CPawn from "./CPawn";

export default class CWizard extends CPawn {
    constructor(game, data){
        super(game, {
            ...data,
            meshName: "Wizard",
        });

        console.log('WIZARD', this, this.pos);
    }
}