import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import Crosshair from './ui/Crosshair';
import Input from './core/Input';
import PlayerInfo from './ui/PlayerUI';
import MyEventEmitter from './core/MyEventEmitter';
import Globals from './utils/Globals';
import soundPlayer from './core/SoundPlayer';
import LoadingManager from './core/LoadingManager';
import World1 from './scenes/World1';
import World2 from './scenes/World2';
import LocalData from './core/LocalData';
import World3 from './scenes/World3';
import MeshManager from './core/MeshManager';
import SolRenderPass from './core/SolRenderPass';
import World from './scenes/World';
import ActorManager from './core/ActorManager';
import DebugData from './ui/DebugData';
import PartyFrame from './ui/PartyFrame';
import QuestManager from './core/QuestManager';
import { setNetScene } from './core/NetManager';
import Player from './player/Player';
import LightManager from './core/LightManager';

await RAPIER.init();

const worldRegistry = {
  world1: World1,
  world2: World2,
  world3: World3,
}

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;

    /**@type {World} */
    this.world = null;

    this.settings = {
      timeStep: 1 / 120,
      subStep: 6,
    }

    this.initWindow();
    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1 / 120;

    this.renderer = new THREE.WebGLRenderer({ alpha: 0, antialias: true });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild(this.renderer.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.graphicsWorld = new THREE.Scene();

    this.physicsWorld = new RAPIER.World({ x: 0, y: -6, z: 0 });

    this.loadingManager = new LoadingManager();
    this.meshManager = new MeshManager(this);

    this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 5000);

    this.solRender = new SolRenderPass(this.renderer, this.graphicsWorld, this.camera);
    this.worldLight();

    soundPlayer.init();
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    soundPlayer.setPosAudio(this.audioListener);

    this.input = new Input(canvas);

    Globals.game = this;
    Globals.graphicsWorld = this.graphicsWorld;
    Globals.physicsWorld = this.physicsWorld;
    Globals.camera = this.camera;
    Globals.input = this.input;

    this.actorManager = new ActorManager(this);
    this.player = this.actorManager.player;
    Globals.player = this.player;
    this.crosshair = new Crosshair(this.graphicsWorld);
    this.playerInfo = new PlayerInfo(this.player);
    Globals.playerInfo = this.playerInfo;
    this.partyFrame = new PartyFrame();
    this.questManager = new QuestManager(this, this.player);
    const newQuest = this.questManager.addQuest('playerKill');
    this.debugData = new DebugData(this.player);
    this.lightManager = new LightManager(this);

    this.worldReady = () => {
      this.player.setWorld(this.world);
      console.log(this.world.map);
      this.solRender.outlineObject = this.world.map;
    }
    this.setWorld(LocalData.solWorld || 'world2');

    this.bindings();
    this.start();
  }
  initWindow() {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }
  bindings() {
    MyEventEmitter.on('goHome', () => {
      this.setWorld('world1');
    });
    MyEventEmitter.on('goCrown', () => {
      this.setWorld('world2');
    });
    MyEventEmitter.on('world3', () => {
      this.setWorld('world3');
    })
  }
  setWorld(world) {
    const newWorld = new worldRegistry[world](this);
    if (!newWorld) return;
    if (this.world && !this.world.levelLoaded) return;
    this.player.tick = false;

    this.actorManager.clearActors();
    this.lightManager.destroy();

    if (this.world?.onExit) this.world.onExit();
    this.world = newWorld;
    if (this.world?.onEnter) this.world.onEnter(this.worldReady);
    setNetScene(this.world);
  }
  start() {
    requestAnimationFrame(this.loop.bind(this));
  }
  loop(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.running && this.world) {
      MyEventEmitter.emit('preUpdate', dt, time);

      this.accumulator += dt;
      while (this.accumulator >= this.timeStep) {
        this.physicsWorld.step();
        this.world?.fixedUpdate?.(this.timeStep, time);
        this.accumulator -= this.timeStep;
      }

      this.world?.update?.(dt, time);
      this.actorManager?.update(dt, time);
      this.questManager?.update(dt, time);
      this.debugData?.update(dt, time);

      MyEventEmitter.emit('update', dt, time);
      //this.renderer.render(this.graphicsWorld, this.camera);
      this.solRender.composer.render(dt);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
  worldLight() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const dirLight = new THREE.DirectionalLight(0xffeeee, .77);

    dirLight.position.set(50, 100, 50);
    const target = new THREE.Vector3().addVectors(dirLight.position, new THREE.Vector3(1, -1, 1).normalize())
    dirLight.lookAt(target);

    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.02;

    dirLight.castShadow = true;
    this.graphicsWorld.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, .2);
    this.graphicsWorld.add(ambientLight);

    // const rimLight = new THREE.DirectionalLight(0xffffff, 1);
    // rimLight.position.set(-1, 1, 1);
    // this.graphicsWorld.add(rimLight);
  }
  add(obj) {
    this.graphicsWorld.add(obj);
  }
  remove(obj) {
    this.graphicsWorld.remove(obj);
  }
  get solWorld() {
    return this.world.solWorld || LocalData.solWorld;
  }
  get physics() {
    return this.physicsWorld;
  }
  get graphics() {
    return this.graphicsWorld;
  }
  /**@type {Player[]} */
  get players() {
    return this.actorManager.players;
  }
  get hostiles() {
    return this.actorManager.hostiles;
  }
  get levelLOS() {
    return this.world.mergedLevel;
  }
}
