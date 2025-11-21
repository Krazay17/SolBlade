import State from "./State.js";

export default class RunState extends State {
    constructor(game, pawn, data) {
        super(game, pawn, {
            ...data,
            name: "run",
        });
    }
    enter(prevState) {
        super.enter(prevState);
        
    }
}