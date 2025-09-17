export default class SpellDragManager {
    constructor(container) {
        this.container = container;
        this.dragged = null;
        this.offsetX = 0;
        this.offsetY = 0;

        // Bind handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }
    setContainer(container) {
        this.container = container;
    }

    makeDraggable(spellSlot) {
        spellSlot.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent text selection / native drag

            this.dragged = spellSlot;
            this.dragged.classList.add('dragging');

            // Get offset from click point
            const rect = spellSlot.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;

            // Absolutely position while dragging
            this.dragged.style.position = 'absolute';
            this.dragged.style.zIndex = 1000;

            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
        });
    }

    onMouseMove(e) {
        if (!this.dragged) return;
        this.dragged.style.left = e.pageX - this.offsetX + 'px';
        this.dragged.style.top = e.pageY - this.offsetY + 'px';
    }

    onMouseUp(e) {
        if (!this.dragged) return;

        // Find drop target
        const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        if (dropTarget && dropTarget.classList.contains('spell-ui-slot') && dropTarget !== this.dragged) {
            // Swap content
            const tmp = document.createElement('div');
            this.container.replaceChild(tmp, this.dragged);
            this.container.replaceChild(this.dragged, dropTarget);
            this.container.replaceChild(dropTarget, tmp);
        }

        // Reset dragged element
        this.dragged.style.position = '';
        this.dragged.style.left = '';
        this.dragged.style.top = '';
        this.dragged.style.zIndex = '';
        this.dragged.classList.remove('dragging');

        this.dragged = null;

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }
}
