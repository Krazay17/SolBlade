import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import Crosshair from './ui/Crosshair';
import MyEventEmitter from './core/MyEventEmitter';
import LoadingManager from './core/LoadingManager';
import Scene from './scenes/Scene';
import Scene1 from './scenes/Scene1';
import Scene2 from './scenes/Scene2';
import Scene3 from './scenes/Scene3';
import Scene4 from './scenes/Scene4';
import Scene5 from './scenes/Scene5';
import LocalData from './core/LocalData';
import MeshManager from './core/MeshManager';
import SolRenderPass from './core/SolRenderPass';
import QuestManager from './core/QuestManager';
import { setNetScene } from './core/NetManager';
import Player from './player/Player';
import LightManager from './core/LightManager';
import Inventory from './player/Inventory';
import SoundPlayer from './core/SoundPlayer';
import { menuSlider } from './ui/Menu';
import FXManager from './core/FX/FXManager';
import SolPhysics from './core/SolPhysics';
import DebugData from './ui/DebugData';
import DPSMeter from './core/DPSMeter';
import LobbyStats from './core/LobbyStats';
import PlayerFrames from './ui/newHealthUi/PlayerFrames';
import SolWorld from './core/SolWorld.js';

await RAPIER.init();

const sceneRegistry = {
  scene1: Scene1,
  scene2: Scene2,
  scene3: Scene3,
  scene4: Scene4,
  scene5: Scene5,
}

export default class CGame {
  static instance = null;
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;

    /**@type {Scene} */
    this.scene = null;

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

    this.physics = new SolPhysics(this);

    this.loadingManager = new LoadingManager();
    this.meshManager = new MeshManager(this);

    this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .8, 3000);

    this.solRender = new SolRenderPass(this.renderer, this.graphicsWorld, this.camera);
    this.worldLight();

    this.audioListener = new THREE.AudioListener();
    this.soundPlayer = new SoundPlayer(this, this.audioListener);
    this.camera.add(this.audioListener);


    this.solWorld = new SolW
    
    this.crosshair = new Crosshair(this.graphicsWorld);
    this.inventory = new Inventory(this.player);
    this.playerFrames = new PlayerFrames(this, this.player);
    this.dpsmeter = new DPSMeter(this);
    this.lobbyStats = new LobbyStats(this);
    this.debugData = new DebugData();
    this.lightManager = new LightManager(this);
    this.fxManager = new FXManager(this);
    this.questManager = new QuestManager(this, this.player);
    this.questManager.addQuest('playerKill');

    this.sceneReady = () => {
      this.player.sceneReady();
      setNetScene(this.scene);
      this.running = true;
      if (this.onSceneChange) this.onSceneChange(this.scene);
    }
    this.setScene(LocalData.sceneName || 'scene2');

    this.bindings();
    this.start();

    CGame.instance = this;
  }
  /**@returns {Game} */
  static getGame(canvas) {
    if (CGame.instance) return CGame.instance;
    else if (canvas) return new CGame(canvas);
    else throw new Error("Initialize Game with canvas first!")
  }
  get sceneName() {
    return this.scene.sceneName || LocalData.sceneName;
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
    return this.scene.mergedLevel;
  }
  get time() { return this.lastTime }

  initPlayer() {
    this.player = this.actorManager.player;
  }
  savePlayerState() {
    LocalData.position = this.player.pos;
    LocalData.rotation = this.player.rot;
    LocalData.weapons.left = this.player.data.leftWeapon;
    LocalData.weapons.right = this.player.data.rightWeapon;
    LocalData.sceneName = this.sceneName;
  }
  bindings() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    MyEventEmitter.on('scene1', () => {
      this.setScene('scene1');
    });
    MyEventEmitter.on('scene2', () => {
      this.setScene('scene2');
    });
    MyEventEmitter.on('scene3', () => {
      this.setScene('scene3');
    });
    MyEventEmitter.on('scene4', () => {
      this.setScene('scene4');
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
  setScene(scene) {
    const newScene = new sceneRegistry[scene](this);
    if (!newScene) return;
    if (this.scene && !this.scene.levelLoaded) return;
    this.running = false;

    if (this.scene?.onExit) this.scene.onExit();
    this.scene = newScene;

    this.actorManager.clearActors();
    this.lightManager.destroy();

    if (this.player) {
      this.player.tick = false;
    }
    this.player.setScene(this.scene);
    if (this.scene?.onEnter) this.scene.onEnter(this.sceneReady);
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

    if (this.running && this.scene) {
      MyEventEmitter.emit('preUpdate', dt, time);

      this.accumulator += dt;
      this.accumulator = Math.min(this.accumulator, 0.25);
      while (this.running && (this.accumulator >= this.timeStep)) {
        this.physics.step();
        this.scene?.fixedUpdate?.(this.timeStep, time);
        this.actorManager?.fixedUpdate(this.timeStep, time);

        this.accumulator -= this.timeStep;
      }
      this.scene?.update?.(dt, time);
      this.actorManager?.update(dt, time);
      this.questManager?.update(dt, time);
      this.debugData?.update(dt, time);
      this.fxManager?.update(dt, time);

      MyEventEmitter.emit('update', dt, time);
      this.solRender.composer.render(dt);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
  worldLight() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const dirLight = new THREE.DirectionalLight(0xffeeee, .4);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, .05);
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
