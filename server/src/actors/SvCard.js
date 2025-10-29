import { io } from "../../server.js";
import SvActor from "./SvActor.js";

export default class SvCard extends SvActor{
    touch(data) {
        if(!this.active)return;
        io.emit('actorTouch', {id: this.netId, data});
        this.die();
    }
    die(){
        super.die();
        this.respawn(5000);
    }
}