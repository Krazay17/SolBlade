import Globals from "../utils/Globals";
import { lerp } from "three/src/math/MathUtils.js";

export default class DevMenu {
    constructor(actor, movementComp) {
        this.actor = actor;
        this.movementComp = movementComp;

        this.isOpen = false;

        this.section = document.createElement('div');
        this.section.id = 'devSection';
        this.groundGrid = document.createElement('div');
        this.groundGrid.classList.add('devGrid');
        this.airGrid = document.createElement('div');
        this.airGrid.classList.add('devGrid');
        this.bladeGrid = document.createElement('div');
        this.bladeGrid.classList.add('devGrid');
        this.attackGrid = document.createElement('div');
        this.attackGrid.classList.add('devGrid');

        window.addEventListener('keydown', (event) => {
            if (Globals.input.inputBlocked) return;
            if (event.code === 'KeyN') {
                this.isOpen = !this.isOpen;
                if (this.isOpen) {
                    this.open();
                    document.exitPointerLock();
                } else {
                    this.close();
                }
            }
        });

        const frictionMax = 20;
        const accelMax = 15;
        const speedMax = 20;
        const tapMax = 1;
        this.movementSliders = {
            idle: {
                friction: this.createSlider('Idle Friction', this.groundGrid, this.movementComp.values.idle.friction, frictionMax,
                    (value) => {
                        this.movementComp.values.idle.friction = value;
                        return this.movementComp.values.idle.friction;
                    }),
            },
            ground: {
                friction: this.createSlider('Ground Friction', this.groundGrid, this.movementComp.values.ground.friction, frictionMax,
                    (value) => {
                        this.movementComp.values.ground.friction = value;
                        return this.movementComp.values.ground.friction;
                    }),
                accel: this.createSlider('Ground Accel', this.groundGrid, this.movementComp.values.ground.accel, accelMax,
                    (value) => {
                        this.movementComp.values.ground.accel = value;
                        return this.movementComp.values.ground.accel;
                    }),
                speed: this.createSlider('Ground Speed', this.groundGrid, this.movementComp.values.ground.speed, speedMax,
                    (value) => {
                        this.movementComp.values.ground.speed = value;
                        return this.movementComp.values.ground.speed;
                    }),
                tap: this.createSlider('Ground Tap', this.groundGrid, this.movementComp.values.ground.tap, tapMax,
                    (value) => {
                        this.movementComp.values.ground.tap = value;
                        return this.movementComp.values.ground.tap;
                    }),
            },
            air: {
                friction: this.createSlider('Air Friction', this.airGrid, this.movementComp.values.air.friction, frictionMax,
                    (value) => {
                        this.movementComp.values.air.friction = value;
                        return this.movementComp.values.air.friction;
                    }),
                accel: this.createSlider('Air Accel', this.airGrid, this.movementComp.values.air.accel, accelMax,
                    (value) => {
                        this.movementComp.values.air.accel = value;
                        return this.movementComp.values.air.accel;
                    }),
                speed: this.createSlider('Air Speed', this.airGrid, this.movementComp.values.air.speed, speedMax,
                    (value) => {
                        this.movementComp.values.air.speed = value;
                        return this.movementComp.values.air.speed;
                    }),
                tap: this.createSlider('Air Tap', this.airGrid, this.movementComp.values.air.tap, tapMax,
                    (value) => {
                        this.movementComp.values.air.tap = value;
                        return this.movementComp.values.air.tap;
                    }),
            },
            blade: {
                friction: this.createSlider('Blade Friction', this.bladeGrid, this.movementComp.values.blade.friction, frictionMax,
                    (value) => {
                        this.movementComp.values.blade.friction = value;
                        return this.movementComp.values.blade.friction;
                    }),
                accel: this.createSlider('Blade Accel', this.bladeGrid, this.movementComp.values.blade.accel, accelMax,
                    (value) => {
                        this.movementComp.values.blade.accel = value;
                        return this.movementComp.values.blade.accel;
                    }),
                speed: this.createSlider('Blade Speed', this.bladeGrid, this.movementComp.values.blade.speed, speedMax,
                    (value) => {
                        this.movementComp.values.blade.speed = value;
                        return this.movementComp.values.blade.speed;
                    }),
                tap: this.createSlider('Blade Tap', this.bladeGrid, this.movementComp.values.blade.tap, tapMax,
                    (value) => {
                        this.movementComp.values.blade.tap = value;
                        return this.movementComp.values.blade.tap;
                    }),
            },
            attack: {
                friction: this.createSlider('Attack Friction', this.attackGrid, this.movementComp.values.attack.friction, frictionMax,
                    (value) => {
                        this.movementComp.values.attack.friction = value;
                        return this.movementComp.values.attack.friction;
                    }),
                accel: this.createSlider('Attack Accel', this.attackGrid, this.movementComp.values.attack.accel, accelMax,
                    (value) => {
                        this.movementComp.values.attack.accel = value;
                        return this.movementComp.values.attack.accel;
                    }),
                speed: this.createSlider('Attack Speed', this.attackGrid, this.movementComp.values.attack.speed, speedMax,
                    (value) => {
                        this.movementComp.values.attack.speed = value;
                        return this.movementComp.values.attack.speed;
                    }),
                tap: this.createSlider('Attack Tap', this.attackGrid, this.movementComp.values.attack.tap, tapMax,
                    (value) => {
                        this.movementComp.values.attack.tap = value;
                        return this.movementComp.values.attack.tap;
                    }),
            },
        };

        const resetButton = this.createButton('Reset to Default', () => {
            this.resetMovementDefaults();
        })

        this.section.appendChild(this.groundGrid);
        this.section.appendChild(this.airGrid);
        this.section.appendChild(this.bladeGrid);
        this.section.appendChild(this.attackGrid);
        this.section.appendChild(resetButton);
        document.body.appendChild(this.section);
    }

    open() {
        this.section.style.display = 'grid';
    }

    close() {
        this.section.style.display = 'none';
    }

    resetMovementDefaults() {
        const newValues = this.movementComp.resetDefaultValues();
        for (const [key, value] of Object.entries(this.movementSliders)) {
            for (const [key2, elements] of Object.entries(value)) {
                const {slider, valueDisplay} = elements;
                slider.value = newValues[key][key2];
                valueDisplay.value = newValues[key][key2];
            }
        }
    }

    createButton(label, callback) {
        const button = document.createElement('button');
        button.classList.add('devButton');
        button.innerText = label;
        button.onclick = callback;
        return button;
    }

    createSlider(name, grid, initialValue, maxValue, callback) {
        const labelGrid = document.createElement('div');
        const label = document.createElement('label');
        label.classList.add('devLabel');
        label.innerText = `${name}: `;
        const valueDisplay = document.createElement('input');
        valueDisplay.classList.add('devLabel');
        valueDisplay.value = `${initialValue}`;
        const slider = document.createElement('input');
        slider.classList.add('devSlider');
        slider.type = 'range';
        slider.step = '0.01';
        slider.min = 0;
        slider.max = maxValue;
        slider.value = initialValue;
        labelGrid.appendChild(label);
        labelGrid.appendChild(valueDisplay);
        grid.appendChild(labelGrid);
        grid.appendChild(slider);

        valueDisplay.onchange = () => {
            const value = parseFloat(valueDisplay.value);
            if (!isNaN(value) && typeof value === 'number') {
                slider.value = callback(value);
            }
        };

        slider.oninput = () => {
            const value = parseFloat(slider.value);
            valueDisplay.value = callback(value);
        };
        return { slider, valueDisplay };
    }

}