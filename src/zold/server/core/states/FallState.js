import State from "./State.js";

export default class FallState extends State {
    constructor(game, pawn, data){
        super(game, pawn, {
            ...data,
            name: "fall",
        })
    }
    enter(prevState){
        super.enter(prevState);

    }
}