import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import Crosshair from './ui/Crosshair';
import Input from './core/Input';
import PlayerInfo from './ui/PlayerUI';
import MyEventEmitter from './core/MyEventEmitter';
import Globals from './utils/Globals';
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
import Inventory from './player/Inventory';
import SoundPlayer from './core/SoundPlayer';
import World4 from './scenes/World4';
import { menuSlider } from './ui/Menu';
import World5 from './scenes/World5';
import FXManager from './core/FXManager';
import SolPhysics from './core/SolPhysics';

await RAPIER.init();

const worldRegistry = {
  world1: World1,
  world2: World2,
  world3: World3,
  world4: World4,
  world5: World5,
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

    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timeStep = 1 / 120;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    document.body.appendChild(this.renderer.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.graphicsWorld = new THREE.Scene();

    this.physics = new SolPhysics();

    this.loadingManager = new LoadingManager();
    this.meshManager = new MeshManager(this);

    this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .8, 3000);

    this.solRender = new SolRenderPass(this.renderer, this.graphicsWorld, this.camera);
    this.worldLight();

    this.audioListener = new THREE.AudioListener();
    this.soundPlayer = new SoundPlayer(this, this.audioListener);
    this.camera.add(this.audioListener);

    this.input = new Input(canvas);

    Globals.game = this;
    Globals.graphicsWorld = this.graphicsWorld;
    Globals.physicsWorld = this.physics.world;
    Globals.camera = this.camera;
    Globals.input = this.input;

    this.actorManager = new ActorManager(this);
    this.initPlayer();
    this.partyFrame = new PartyFrame();
    //this.debugData = new DebugData();
    this.lightManager = new LightManager(this);
    this.fxManager = new FXManager(this);

    this.worldReady = () => {
      this.player.setWorld(this.world);
      setNetScene(this.world);
      this.solRender.outlineObject = this.world.map;
      this.running = true;
    }
    this.setWorld(LocalData.solWorld || 'world2');

    this.bindings();
    this.start();
  }
  get solWorld() {
    return this.world.solWorld || LocalData.solWorld;
  }
  get physicsWorld() {
    return this.physics.world;
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
  get time() { return this.lastTime }
  initWindow() {
  }
  initPlayer() {
    //this.player = this.actorManager.spawnLocalPlayer();
    this.player = this.actorManager.player;
    Globals.player = this.player;
    this.crosshair = new Crosshair(this.graphicsWorld);
    this.playerInfo = new PlayerInfo(this.player);
    Globals.playerInfo = this.playerInfo;
    this.inventory = new Inventory(this.player);
    this.questManager = new QuestManager(this, this.player);
    this.questManager.addQuest('playerKill');

  }
  bindings() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    MyEventEmitter.on('goHome', () => {
      this.setWorld('world1');
    });
    MyEventEmitter.on('goCrown', () => {
      this.setWorld('world2');
    });
    MyEventEmitter.on('world3', () => {
      this.setWorld('world3');
    });
    MyEventEmitter.on('world4', () => {
      this.setWorld('world4');
    })
    window.addEventListener('focus', () => {
      this.running = true;
      this.isFocused = true;
    });
    window.addEventListener('blur', () => {
      this.running = true;
      this.isFocused = false;
    });
    window.addEventListener('mousedown', () => {
      this.running = true;
    });
    MyEventEmitter.on('disconnect', () => {
      this.actorManager.clearRemoteActors();
    })
  }
  setWorld(world, pos) {
    const newWorld = new worldRegistry[world](this);
    if (!newWorld) return;
    if (this.world && !this.world.levelLoaded) return;
    this.running = false;

    if (this.world?.onExit) this.world.onExit();
    this.world = newWorld;

    this.actorManager.clearActors();
    this.lightManager.destroy();

    if(this.player) {
    this.player.portalPos = pos;
    this.player.solWorld = world;
    this.player.tick = false;
    }
      
    if (this.world?.onEnter) this.world.onEnter(this.worldReady);

  }
  start() {
    requestAnimationFrame(this.loop.bind(this));
  }
  handleSleep() {
    if (this.isFocused) return;
    this.running = false;
  }
  loop(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (dt > 1) {
      this.handleSleep();
    }

    if (this.running && this.world) {
      MyEventEmitter.emit('preUpdate', dt, time);

      this.accumulator += dt;
      this.accumulator = Math.min(this.accumulator, 0.25);
      while (this.running && (this.accumulator >= this.timeStep)) {
        this.physicsWorld.step();
        this.physics.remove();
        this.world?.fixedUpdate?.(this.timeStep, time);
        this.actorManager?.fixedUpdate(this.timeStep, time);

        this.accumulator -= this.timeStep;
      }
      this.fxManager?.update(dt, time);
      this.world?.update?.(dt, time);
      this.actorManager?.update(dt, time);
      this.questManager?.update(dt, time);
      this.debugData?.update(dt, time);

      MyEventEmitter.emit('update', dt, time);
      this.solRender.composer.render(dt);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
  worldLight() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const dirLight = new THREE.DirectionalLight(0xffeeee, .5);

    dirLight.position.set(0, 100, 0);
    const target = new THREE.Vector3().addVectors(dirLight.position, new THREE.Vector3(1, -1, 1).normalize())
    dirLight.lookAt(target);

    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;

    menuSlider('Shadow Quality', 1, 10, 1, (value) => {
      dirLight.shadow.mapSize.width = 1024 * value;
      dirLight.shadow.mapSize.height = 1024 * value;
      if (dirLight.shadow.map) {
        dirLight.shadow.map.dispose();
        dirLight.shadow.map = null;
      }
      dirLight.shadow.needsUpdate = true;
    })
    dirLight.shadow.mapSize.width = 1024 * 4;
    dirLight.shadow.mapSize.height = 1024 * 4;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.02;

    dirLight.castShadow = true;
    this.graphicsWorld.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, .03);
    this.graphicsWorld.add(ambientLight);

    // const rimLight = new THREE.DirectionalLight(0xffffff, 1);
    // rimLight.position.set(-1, 1, 1);
    // this.graphicsWorld.add(rimLight);
  }
  getActorById(id) {
    return this.actorManager.getActorById(id);
  }
  add(obj) {
    if (obj) this.graphicsWorld.add(obj);
  }
  remove(obj) {
    if (obj) this.graphicsWorld.remove(obj);
  }
}
