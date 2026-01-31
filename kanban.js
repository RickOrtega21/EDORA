function renderKanban() {
    const board = document.getElementById('kanban-board');
    const filterAreaKanban = document.getElementById('filter-area-kanban');
    const searchKanban = document.getElementById('search-kanban');

    const selectedArea = filterAreaKanban ? filterAreaKanban.value : 'all';
    const searchQuery = searchKanban ? searchKanban.value.toLowerCase() : '';

    const columns = board.querySelectorAll('.column-cards');
    columns.forEach(col => col.innerHTML = '');

    const filteredDocs = documents.filter(doc => {
        const matchesArea = selectedArea === 'all' || doc.area === selectedArea;
        const name = doc.name || doc.nombre || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery);
        return matchesArea && matchesSearch;
    });

    filteredDocs.forEach(doc => {
        const column = board.querySelector(`[data-status="${doc.status}"] .column-cards`);
        if (column) {
            const card = document.createElement('div');
            card.className = 'doc-card glass';
            card.draggable = true;
            card.dataset.id = doc.id;
            card.innerHTML = `
                <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">${doc.name}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                    <span>${doc.area}</span>
                    <span style="color: var(--accent-primary); font-weight: 600;">${doc.targetDate}</span>
                </div>
            `;

            // Right-click logic
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(e.pageX, e.pageY, doc.id);
            });

            // Drag and drop events
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', doc.id);
            });

            card.addEventListener('dragend', () => card.classList.remove('dragging'));

            column.appendChild(card);
        }
    });

    setupDragAndDrop();
}

function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => column.classList.remove('drag-over'));

        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const docId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;

            const doc = documents.find(d => d.id.toString() === docId);
            if (doc && doc.status !== newStatus) {
                doc.status = newStatus;
                await saveDocs(doc); // Re-sync the updated status
                renderKanban();
                updateDashboard();
            }
        });
    });
}

// Add event listener for Kanban search
const searchKanbanInput = document.getElementById('search-kanban');
if (searchKanbanInput) {
    searchKanbanInput.addEventListener('input', renderKanban);
}

const filterAreaKanbanSelect = document.getElementById('filter-area-kanban');
if (filterAreaKanbanSelect) {
    filterAreaKanbanSelect.addEventListener('change', renderKanban);
}

// Initial call
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('view-kanban').classList.contains('hidden')) {
        renderKanban();
    }
});
