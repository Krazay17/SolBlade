import { setupKeybindWindow, addButton } from "../ui/KeyUI.js";
import MyEventEmitter from "@solblade/common/core/GlobalEventEmitter.js"
import { ACTIONS, defaultBinds } from "../config/Actions.js";
import { rotateInputAroundYaw } from "../../common/utils/Utils.js";
import { Vector3 } from "three";
import Controller from "@solblade/common/actors/components/Controller.js";


export class UserInput extends Controller {
  constructor(gameElement) {
    super();
    this.gameElement = gameElement;

    this.sensitivity = 0.0016;
    this.actionKeys = defaultBinds;

    this.actionStates = {};
    for (const key in ACTIONS) {
      this.actionStates[ACTIONS[key]] = false;
    }

    this.pointerLocked = false;
    this.yaw = 0
    this.pitch = 0;
    this.direction = new Vector3();
    this.keys = {};
    this.mice = {};
    this.look = null;
    this.lockMouse = false;
    this.inputBlocked = false;

    this.testFunction = () => {
      console.log('Test function called');
    };


    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = (document.pointerLockElement === this.gameElement);
    });
    document.addEventListener('pointerlockerror', () => {
      console.error('Pointer lock failed');
    });

    this.bindings();
    setupKeybindWindow();
    addKeys();
  }
  bindings() {
    // document.addEventListener('keypress', (e) => {
    //   if (this.inputBlocked) return;
    //   MyEventEmitter.emit('KeyPressed', e.code);
    //   if (e.code === 'Digit5') {
    //     MyEventEmitter.emit('test');
    //   }
    //   const action = this.actionKeys[e.code];
    //   if (action) this.buttonPressed(action);
    // });
    document.addEventListener('keydown', (e) => {
      if (this.inputBlocked) return;
      this.keys[e.code] = true;
      const action = this.actionKeys[e.code];
      if (action) this.actionStates[action] = true;
      if (e.code === 'Digit5') {
        MyEventEmitter.emit('test');
      }
    });
    document.addEventListener('keyup', (e) => {
      if (this.inputBlocked) return;
      this.keys[e.code] = false;
      const action = this.actionKeys[e.code];
      if (action) this.actionStates[action] = false;
    });
    document.addEventListener('mousedown', (e) => {
      this.mice[e.button] = true;
      const action = this.actionKeys[e.button];
      if (action) this.actionStates[action] = true;
    });
    document.addEventListener('mouseup', (e) => {
      this.mice[e.button] = false;
      const action = this.actionKeys[e.button];
      if (action) this.actionStates[action] = false;
    });
    document.addEventListener('click', (e) => {
      if (this.pointerLocked) return;
      if (this.gameElement === e.target) {
        this.gameElement.requestPointerLock();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== this.gameElement) return;

      if (Math.abs(e.movementX) < 200 && Math.abs(e.movementY) < 200) {
        this.yaw -= e.movementX * this.sensitivity;
        this.yaw = normalizeAngle(this.yaw);

        this.pitch = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.pitch - e.movementY * this.sensitivity)
        );
      }
      if (this.look) this.look(this.yaw, this.pitch);
    });

    window.addEventListener('blur', () => {
      Object.keys(this.keys).forEach(key => {
        this.keys[key] = false;
        const action = this.actionKeys[key];
        if (action) this.actionStates[action] = false;
      });
    });

    MyEventEmitter.on('itemDragStart', () => {
      for (const state of Object.keys(this.actionStates)) {
        this.actionStates[state] = false;
      }
    })
  }
  update(dt) { }
  buttonPressed(action) {
    MyEventEmitter.emit(action);
  }
  inputDirection() {
    let x = 0, z = 0;
    if (this.actionStates[ACTIONS['FWD']]) z -= 1;
    if (this.actionStates[ACTIONS['BWD']]) z += 1;
    if (this.actionStates[ACTIONS['LEFT']]) x -= 1;
    if (this.actionStates[ACTIONS['RIGHT']]) x += 1;

    if (x === 0 && z === 0) return false;

    const { rotatedX, rotatedZ } = rotateInputAroundYaw(x, z, this.yaw);
    this.direction.set(rotatedX, 0, rotatedZ).normalize();
    return this.direction;
  }

}
function addKeys() {
  addButton('KeyUnpressed', 'KeyW', 'Fwd', 1, 2);
  addButton('KeyUnpressed', 'KeyS', 'Bwd', 2, 2);
  addButton('KeyUnpressed', 'KeyA', 'Left', 2, 1);
  addButton('KeyUnpressed', 'KeyD', 'Right', 2, 3);
  addButton('KeyUnpressed', 'ShiftLeft', 'Blade', 2, 4, '100px', 'Shift');
  addButton('KeyUnpressed', 'Space', 'Jump', 2, 6, '140px');
  addButton('KeyUnpressed', 'KeyC', 'Inventory', 1, 7);
  addButton('KeyUnpressed', 'KeyB', 'Menu', 1, 6);
  addButton('KeyUnpressed', 'KeyT', 'Home', 1, 5);
  addButton('KeyUnpressed', 'KeyH', 'Sudoku', 1, 4);
};
function normalizeAngle(a) {
  a = a % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}