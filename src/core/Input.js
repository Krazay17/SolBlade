export default class Input {
  static keys = {};

  static init() {
    window.addEventListener('keydown', (e) => Input.keys[e.code] = true);
    window.addEventListener('keyup', (e) => Input.keys[e.code] = false);
  }

  static isHeld(key) {
    return !!Input.keys[key];
  }
}
