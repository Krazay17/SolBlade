import CPawn from "./CPawn";

export default class CWizard extends CPawn {
    constructor(world, data){
        super(world, {
            ...data,
            meshName: "Wizard",
        });

        console.log('WIZARD', this);
    }
}