export default class Input {
  static keys = {};

  static init() {
    window.addEventListener('keydown', (e) => {
      Input.keys[e.code] = true;
      console.log(e.code);
    });
    window.addEventListener('keyup', (e) => Input.keys[e.code] = false);
    
    window.addEventListener('mousedown', (e) => {
      Input.keys[e.button] = true;
      console.log(e.button);
    });
    window.addEventListener('mouseup', (e) => Input.keys[e.button] = false);
  }

  static isHeld(key) {
    return !!Input.keys[key];
  }
}
