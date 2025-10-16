import * as THREE from 'three';
import World from '../scenes/World';
import { CSM } from 'three/examples/jsm/Addons.js';
import Game from '../Game';

export default {
    /**@type {Game} */
    game: null,
    /**@type {THREE.Scene} */
    graphicsWorld: null,
    player: null,
    playerInfo: null,
    /**@type {World} */
    scene: null,
    input: null,
    camera: null,
    DEBUG: false,
    socket: null,
    enemyActors: [],
    mapWalls: [],
    /**@type {CSM} */
    csm: null,
}