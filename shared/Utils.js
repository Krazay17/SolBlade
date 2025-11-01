export function randomPos(maxHoriz, maxHeight) {
    const x = (Math.random() * 2 - 1) * maxHoriz;
    const z = (Math.random() * 2 - 1) * maxHoriz;
    const y = Math.random() * maxHeight;

    return { x, y, z };
}

export function sharedTest() {
  console.log('shared folder import test!');
}