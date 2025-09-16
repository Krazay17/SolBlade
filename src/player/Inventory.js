import MyEventEmitter from "../core/MyEventEmitter";

export default class Inventory {
    constructor(actor) {
        this.actor = actor;
        this.items = [];
        this.active = false;

        this.createInventoryUI();

        MyEventEmitter.on('openInventory', () => {
            this.toggleInventory();
        })
    }

    toggleInventory() {
        this.active = !this.active;
        if (this.active) {
            document.exitPointerLock();
        }
        this.inventoryUI.style.display = this.active ? 'block' : 'none';
        MyEventEmitter.emit('inventoryToggled', this.active);

    }

    createInventoryUI() {
        this.inventoryUI = document.createElement('div');
        this.inventoryUI.id = 'inventory-ui';
        document.body.appendChild(this.inventoryUI);

        this.equippedUI = document.createElement('div');
        this.equippedUI.id = 'inventory-ui-equipped';
        this.inventoryUI.appendChild(this.equippedUI);

        this.itemsUI = document.createElement('div');
        this.itemsUI.id = 'inventory-ui-items';
        this.inventoryUI.appendChild(this.itemsUI);
    }

    addItem(card) {
        this.items.push(card);
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.innerText = card.name;
        this.itemsUI.appendChild(itemElement);
    }
}