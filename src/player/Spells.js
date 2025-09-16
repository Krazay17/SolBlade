import Projectile from "../actors/Projectile";
import MyEventEmitter from "../core/MyEventEmitter";
import Globals from "../utils/Globals";

export default class Spells {
    constructor(actor) {
        this.actor = actor;
        this.spell1 = {
            name: '100',
            img: 'assets/Fireball.png',
            use: () => {
                const position = this.actor.getShootData().position;
                const direction = this.actor.getShootData().direction;
                const spell = new Projectile(
                    position,
                    direction,
                    20,
                    5000
                )
                Globals.graphicsWorld.add(spell);
            },
        };
        this.spell2 = null;
        this.spell3 = null;
        this.spell4 = null;

        this.createSpellUI();
        this.bindEvents();
    }
    bindEvents() {
        MyEventEmitter.on('castSpell1', () => {
            this.spell1?.use?.();
        });
        MyEventEmitter.on('castSpell2', () => {
            this.spell2?.use?.();
        });
        MyEventEmitter.on('castSpell3', () => {
            this.spell3?.use?.();
        });
        MyEventEmitter.on('castSpell4', () => {
            this.spell4?.use?.();
        });
    }

    createSpellUI() {
        this.spellUI = document.createElement('div');
        this.spellUI.id = 'spell-ui';
        document.body.appendChild(this.spellUI);

        this.spell1DOM = this.createSpell(this.spell1?.name, 1, this.spell1?.img);
        this.spellUI.appendChild(this.spell1DOM);
        this.spell2DOM = this.createSpell(this.spell2?.name, 2, this.spell2?.img);
        this.spellUI.appendChild(this.spell2DOM);
        this.spell3DOM = this.createSpell(this.spell3?.name, 3, this.spell3?.img);
        this.spellUI.appendChild(this.spell3DOM);
        this.spell4DOM = this.createSpell(this.spell4?.name, 4, this.spell4?.img);
        this.spellUI.appendChild(this.spell4DOM);
    }

    createSpell(name, slot, url) {
        const spell = document.createElement('div');
        spell.className = 'spell-ui-slot';
        spell.id = `spell-slot-${slot}`;

        const spellImage = document.createElement('div');
        spellImage.className = 'spell-ui-img';
        if (url) {
            spellImage.style.backgroundImage = `url(${url})`;
        }
        spell.appendChild(spellImage);

        const spellLabel = document.createElement('div');
        spellLabel.className = 'spell-ui-label';
        spellLabel.innerText = name || 'Empty';

        spell.appendChild(spellLabel);
        spell.draggable = true;
        spell.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', spell.id);
            spell.classList.add('dragging');
        });
        spell.addEventListener('dragend', (e) => {
            spell.classList.remove('dragging');
        });
        spell.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        spell.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedSpell = document.getElementById(draggedId);
            if (draggedSpell) {
                const draggedParent = draggedSpell.parentNode;
                const targetParent = spell.parentNode;

                // If same parent, we have to account for index shift
                if (draggedParent === targetParent) {
                    const draggedIndex = Array.from(targetParent.children).indexOf(draggedSpell);
                    const targetIndex = Array.from(targetParent.children).indexOf(spell);

                    if (draggedIndex < targetIndex) {
                        // moving right: insert after targetSlot
                        targetParent.insertBefore(draggedSpell, spell.nextSibling);
                    } else {
                        // moving left: insert before targetSlot
                        targetParent.insertBefore(draggedSpell, spell);
                    }
                } else {
                    // different parents: normal swap
                    targetParent.replaceChild(draggedSpell, spell);
                    draggedParent.appendChild(spell);
                }
            }
        });
        return spell;
    }
}
