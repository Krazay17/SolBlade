import Pawn from "./Pawn";
import * as THREE from "three";

export default class Enemy extends Pawn {
    constructor(scene: any, pos: THREE.Vector3, meshName: string,
        net: { isRemote: boolean, netId: string | null } = { isRemote: false, netId: null }) {
        super(scene, pos, meshName, net);

        console.log("Enemy created at", pos);
    }
}