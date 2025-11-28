import CSolWorld1 from "../worlds/CSolWorld1.js"
import CSolWorld2 from "../worlds/CSolWorld2.js";
import CPlayer from "../actors/CPlayer.js";
import CWizard from "../actors/CWizard.js";

export const clientActors = {
    player: {
        class: CPlayer
    },
    wizard: {
        class: CWizard
    }
};

export const worldRegistry = {
    world1: CSolWorld1,
    world2: CSolWorld2,
};
