function renderGantt() {
    const container = document.getElementById('gantt-chart');
    const timelineHeader = document.getElementById('gantt-timeline');
    const filterAreaGantt = document.getElementById('filter-area-gantt');
    const searchGantt = document.getElementById('search-gantt');

    container.innerHTML = '';
    timelineHeader.innerHTML = '';

    const selectedArea = filterAreaGantt ? filterAreaGantt.value : 'all';
    const searchQuery = searchGantt ? searchGantt.value.toLowerCase() : '';

    // Set timeline to the selected week based on offset
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + (window.ganttWeekOffset || 0) * 7);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    // Update week range display
    const weekRangeDisplay = document.getElementById('gantt-week-range');
    if (weekRangeDisplay) {
        const startStr = `${monday.getDate()}/${monday.getMonth() + 1}`;
        const endStr = `${friday.getDate()}/${friday.getMonth() + 1}`;
        weekRangeDisplay.textContent = `${startStr} - ${endStr}${window.ganttWeekOffset === 0 ? ' (Esta Semana)' : ''}`;
    }

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    timelineHeader.style.display = 'flex';
    timelineHeader.style.paddingLeft = '0'; // Reset padding, use flex layout
    timelineHeader.style.marginBottom = '1rem';

    // 1. Column Titles (Left Side)
    const colHeader = document.createElement('div');
    colHeader.style.width = '420px'; // Reduced width (120+200+100)
    colHeader.style.display = 'flex';
    colHeader.style.borderBottom = '1px solid var(--glass-border)';
    colHeader.style.marginRight = '10px'; // Spacing before timeline

    const h1 = document.createElement('div'); h1.textContent = 'Área'; h1.style.width = '120px'; h1.style.fontWeight = '700'; h1.style.fontSize = '0.75rem'; h1.style.color = 'var(--text-muted)';
    const h2 = document.createElement('div'); h2.textContent = 'Documento'; h2.style.width = '200px'; h2.style.fontWeight = '700'; h2.style.fontSize = '0.75rem'; h2.style.color = 'var(--text-muted)';
    const h3 = document.createElement('div'); h3.textContent = 'Duración'; h3.style.width = '100px'; h3.style.fontWeight = '700'; h3.style.fontSize = '0.75rem'; h3.style.color = 'var(--text-muted)';

    colHeader.appendChild(h1);
    colHeader.appendChild(h2);
    colHeader.appendChild(h3);
    timelineHeader.appendChild(colHeader);

    const todayStr = new Date().toLocaleDateString();

    // 2. Timeline Navigation & Days (Right Side Container)
    const timelineRightSide = document.createElement('div');
    timelineRightSide.style.flex = '1';
    timelineRightSide.style.display = 'flex';
    timelineRightSide.style.flexDirection = 'column';

    // Navigation Controls (Top)
    const navControls = document.createElement('div');
    navControls.style.display = 'flex';
    navControls.style.justifyContent = 'center';
    navControls.style.alignItems = 'center';
    navControls.style.gap = '1rem';
    navControls.style.marginBottom = '0.5rem';
    navControls.style.padding = '0.2rem';
    navControls.style.background = 'rgba(255,255,255,0.4)';
    navControls.style.borderRadius = '8px';
    navControls.style.alignSelf = 'center'; // Center horizontally

    const btnPrev = document.createElement('button');
    btnPrev.textContent = '◀';
    btnPrev.className = 'btn btn-secondary';
    btnPrev.style.padding = '0.2rem 0.6rem';
    btnPrev.style.fontSize = '0.8rem';
    btnPrev.onclick = () => { window.ganttWeekOffset--; renderGantt(); };

    const btnNext = document.createElement('button');
    btnNext.textContent = '▶';
    btnNext.className = 'btn btn-secondary';
    btnNext.style.padding = '0.2rem 0.6rem';
    btnNext.style.fontSize = '0.8rem';
    btnNext.onclick = () => { window.ganttWeekOffset++; renderGantt(); };

    const dateRangeLabel = document.createElement('span');
    dateRangeLabel.style.fontSize = '0.9rem';
    dateRangeLabel.style.fontWeight = '600';
    dateRangeLabel.style.minWidth = '150px';
    dateRangeLabel.style.textAlign = 'center';

    const startStr = `${monday.getDate()}/${monday.getMonth() + 1}`;
    const fridayDate = new Date(monday); fridayDate.setDate(monday.getDate() + 4);
    const endStr = `${fridayDate.getDate()}/${fridayDate.getMonth() + 1}`;
    dateRangeLabel.textContent = `${startStr} - ${endStr}${window.ganttWeekOffset === 0 ? ' (Esta Semana)' : ''}`;

    navControls.appendChild(btnPrev);
    navControls.appendChild(dateRangeLabel);
    navControls.appendChild(btnNext);
    timelineRightSide.appendChild(navControls);

    // Days Row (Bottom)
    const timelineDaysContainer = document.createElement('div');
    timelineDaysContainer.style.width = '100%';
    timelineDaysContainer.style.display = 'flex';

    days.forEach((day, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const headerCell = document.createElement('div');
        headerCell.style.flex = '1';
        headerCell.style.textAlign = 'center';
        headerCell.style.fontSize = '0.75rem';
        headerCell.style.color = 'var(--text-muted)';
        headerCell.style.padding = '5px 0';
        headerCell.style.transition = 'all 0.3s ease';

        if (d.toLocaleDateString() === todayStr) {
            headerCell.style.background = 'rgba(56, 189, 248, 0.15)';
            headerCell.style.borderTop = '3px solid var(--accent-primary)';
            headerCell.style.borderRadius = '4px 4px 0 0';
            headerCell.style.boxShadow = 'inset 0 0 10px rgba(56, 189, 248, 0.1)';
        }

        headerCell.innerHTML = `<div>${day}</div><div style="font-weight: 700; color: ${d.toLocaleDateString() === todayStr ? 'var(--accent-primary)' : 'var(--text-main)'};">${d.getDate()}/${d.getMonth() + 1}</div>`;
        timelineDaysContainer.appendChild(headerCell);
    });
    timelineRightSide.appendChild(timelineDaysContainer);
    timelineHeader.appendChild(timelineRightSide);


    const filteredDocs = documents.filter(doc => {
        const matchesArea = selectedArea === 'all' || doc.area === selectedArea;
        const name = doc.name || doc.nombre || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery);
        return matchesArea && matchesSearch;
    });

    // Helper to parse "YYYY-MM-DD" to local midnight date
    const parseLocalDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d); // Local midnight
    };

    filteredDocs.forEach((doc) => {
        const row = document.createElement('div');
        row.className = 'gantt-row';
        row.style.height = '50px';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '10px';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        // 3-Column Layout: Area, Document, Duration
        const areaCol = document.createElement('div');
        areaCol.style.width = '120px';
        areaCol.style.fontSize = '0.75rem';
        areaCol.style.color = 'var(--accent-primary)';
        areaCol.style.fontWeight = '600';
        areaCol.textContent = doc.area;

        const docCol = document.createElement('div');
        docCol.style.width = '200px';
        docCol.style.fontSize = '0.85rem';
        docCol.style.fontWeight = '600';
        docCol.style.whiteSpace = 'nowrap';
        docCol.style.overflow = 'hidden';
        docCol.style.textOverflow = 'ellipsis';
        docCol.textContent = doc.name;

        const durationCol = document.createElement('div');
        durationCol.style.width = '100px'; // Reduced width
        durationCol.style.fontSize = '0.75rem';
        durationCol.style.color = 'var(--text-muted)';

        const start = parseLocalDate(doc.startDate);
        const end = parseLocalDate(doc.targetDate);

        if (!start || !end) {
            durationCol.innerHTML = `<span style="color: var(--text-muted);">---</span>`;
        } else {
            // Difference in milliseconds
            const diffTime = end.getTime() - start.getTime();
            // Convert to days (inclusive +1 because if start=end it is 1 day of work)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // Ensure minimum 1 day if dates are valid
            const displayDays = Math.max(1, diffDays);

            durationCol.innerHTML = `<span style="color: var(--accent-secondary); font-weight: 600;">${displayDays} días</span><br><span style="font-size: 0.65rem;">(${doc.targetDate})</span>`;
        }

        row.appendChild(areaCol);
        row.appendChild(docCol);
        row.appendChild(durationCol);

        const timeline = document.createElement('div');
        timeline.style.flex = '1';
        timeline.style.height = '100%';
        timeline.style.background = 'rgba(255,255,255,0.02)';
        timeline.style.position = 'relative';
        timeline.style.display = 'flex';
        timeline.style.alignItems = 'center';

        // Add today highlighter overlay
        const todayInst = new Date();
        todayInst.setHours(0, 0, 0, 0);
        if (todayInst >= monday && todayInst <= friday) {
            const todayIndex = todayInst.getDay() === 0 ? 6 : todayInst.getDay() - 1;
            const todayHighlight = document.createElement('div');
            todayHighlight.style.position = 'absolute';
            todayHighlight.style.left = `${(todayIndex / 5) * 100}%`;
            todayHighlight.style.width = '20%';
            todayHighlight.style.height = '100%';
            todayHighlight.style.background = 'rgba(56, 189, 248, 0.08)';
            todayHighlight.style.borderLeft = '2px dashed rgba(56, 189, 248, 0.4)';
            todayHighlight.style.borderRight = '2px dashed rgba(56, 189, 248, 0.4)';
            todayHighlight.style.pointerEvents = 'none';
            todayHighlight.style.zIndex = '1';
            timeline.appendChild(todayHighlight);
        }

        if (start && end) {
            const overlapStart = new Date(Math.max(monday, start));
            const overlapEnd = new Date(Math.min(friday, end));

            // Only render if there is overlap
            if (overlapStart <= overlapEnd) {
                // Calculate position relative to Monday
                const startDiff = overlapStart - monday;
                const durationDiff = overlapEnd - overlapStart;

                const startOffset = startDiff / (24 * 60 * 60 * 1000);
                const duration = (durationDiff / (24 * 60 * 60 * 1000)) + 1; // +1 inclusive

                const bar = document.createElement('div');
                bar.className = 'gantt-bar';
                bar.style.position = 'absolute';
                bar.style.left = `${(startOffset / 5) * 100}%`;
                bar.style.width = `${(duration / 5) * 100}%`;
                bar.style.height = '14px';
                bar.style.borderRadius = '7px';

                // Dynamic Coloring Logic
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const diffMs = end - today;
                const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                let barColor = 'var(--accent-primary)';
                if (doc.status === 'released' || doc.status === 'intranet') {
                    barColor = '#10b981'; // Green
                } else if (daysLeft < 3) {
                    barColor = '#ef4444'; // Red
                } else if (daysLeft <= 7) {
                    barColor = '#eab308'; // Yellow
                }

                bar.style.backgroundColor = barColor;
                bar.style.boxShadow = `0 0 10px ${barColor}44`;
                timeline.appendChild(bar);
            }
        }

        row.appendChild(timeline);
        container.appendChild(row);
    });
}

// Week navigation logic
window.ganttWeekOffset = 0;

const prevWeekBtn = document.getElementById('gantt-prev-week');
const nextWeekBtn = document.getElementById('gantt-next-week');

if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
        window.ganttWeekOffset--;
        renderGantt();
    });
}

if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
        window.ganttWeekOffset++;
        renderGantt();
    });
}

// Search and filter listeners
const searchGanttInput = document.getElementById('search-gantt');
if (searchGanttInput) {
    searchGanttInput.addEventListener('input', renderGantt);
}

const filterAreaGanttSelect = document.getElementById('filter-area-gantt');
if (filterAreaGanttSelect) {
    filterAreaGanttSelect.addEventListener('change', renderGantt);
}
