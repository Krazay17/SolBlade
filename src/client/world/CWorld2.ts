import type { CGame } from "../core/CGame";
import { CWorld } from "./CWorld";

export class CWorld2 extends CWorld {
    constructor(game: CGame) {
        super("world2", game);
    }
}