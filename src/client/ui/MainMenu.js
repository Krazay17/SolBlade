import "../css/StyleMenu.css";

import Input from "../input/UserInput";

export default class MainMenu {
    /**
     * 
     * @param {Input} input 
     */
    static ui = null;
    static buttonGrid = null;
    constructor(input) {
        this.input = input;

        this.active = false;
        this.ui = this.init();
        MainMenu.ui = this.ui;
        this.toggle();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggle();
            }
        })
    }
    init() {
        const root = document.createElement('div');
        root.id = 'menu-section';
        document.body.appendChild(root);

        const buttonGrid = document.createElement('div');
        buttonGrid.classList.add('menu-button-grid');
        MainMenu.buttonGrid = buttonGrid;
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');

        root.append(buttonGrid, closeButton);
        return root;
    }
    toggle() {
        if (!this.active) {
            this.ui.style.display = 'grid';
        } else {
            this.ui.style.display = 'none';
        }
        this.active = !this.active;
    }
}

export function menuButton(text = 'Button', callback = () => { }) {
    const button = document.createElement('button');
    button.classList.add('menu-button');
    button.innerText = text;
    button.addEventListener('click', callback);
    MainMenu.buttonGrid.appendChild(button);
    return button;
}
export function menuSlider(text = 'Slider', min = '0', max = '1', step = '0.1', callback = (v) => { }) {
    const slider = document.createElement('input');
    slider.classList.add('menu-slider');
    slider.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    })
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = min;
    const label = document.createElement('p');
    label.innerText = text;
    slider.addEventListener('input', (e) => {
        const target = /** @type {HTMLInputElement} */ (e.currentTarget);
        const value = target.value;
        if (!value) return;
        label.innerText = `${text}: ${value}`;
        callback(value);
    });

    MainMenu.ui.appendChild(slider);
    MainMenu.ui.appendChild(label);
    return { slider, label };
}