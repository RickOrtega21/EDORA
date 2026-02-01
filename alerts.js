function updateAlerts() {
    const alertList = document.getElementById('alert-list-items');
    const alertsTrigger = document.getElementById('alerts-trigger');
    const alertsDropdown = document.getElementById('alerts-dropdown');
    const closeAlerts = document.getElementById('close-alerts');
    const alertsCountBadge = document.getElementById('alerts-count');

    if (!alertList || !alertsTrigger) return;

    // Toggle Logic
    const toggleDropdown = (e) => {
        e.stopPropagation();
        alertsDropdown.classList.toggle('hidden');
    };

    // Remove existing listener to avoid duplicates if re-run (simplified approach)
    alertsTrigger.onclick = toggleDropdown;
    if (closeAlerts) closeAlerts.onclick = (e) => {
        e.stopPropagation();
        alertsDropdown.classList.add('hidden');
    };

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (alertsDropdown && !alertsDropdown.contains(e.target) && !alertsTrigger.contains(e.target)) {
            alertsDropdown.classList.add('hidden');
        }
    });

    alertList.innerHTML = '';
    let alertCount = 0;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri

    // 1. Critical Deadline Alerts
    documents.forEach(doc => {
        // Skip completed
        if (doc.status === 'released' || doc.status === 'intranet') return;

        const targetDate = new Date(doc.targetDate);
        const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays <= 3) { // Critical alert if less than 5 days
            alertCount++;
            addAlertItem(alertList, `${doc.name}`, `Vence en ${diffDays} días`, 'critical');
        }
    });

    // 2. Area Fully Released Alert
    const areas = [...new Set(documents.map(doc => doc.area))];
    areas.forEach(area => {
        const areaDocs = documents.filter(doc => doc.area === area);
        if (areaDocs.length > 0) {
            const allReleased = areaDocs.every(doc => doc.status === 'released' || doc.status === 'intranet' || doc.status === 'signed');
            if (allReleased) {
                alertCount++;
                addAlertItem(alertList, 'Área Completada', `Haz liberado a ${area}`, 'reminder');
            }
        }
    });

    // 3. Monday (1) or Thursday (4) Reminders
    if (dayOfWeek === 1 || dayOfWeek === 4) {
        const pendingDocs = documents.filter(doc => doc.status !== 'released' && doc.status !== 'intranet').length;
        if (pendingDocs > 0) {
            alertCount++;
            const msg = dayOfWeek === 1 ? 'Planifica tu semana: ' : 'Recuerda acabar lo de esta semana: ';
            addAlertItem(alertList, 'Recordatorio Semanal', `${msg} ${pendingDocs} documentos pendientes.`, 'reminder');
        }
    }

    // Update Badge
    if (alertCount > 0) {
        alertsCountBadge.textContent = alertCount;
        alertsCountBadge.classList.remove('hidden');
    } else {
        alertsCountBadge.classList.add('hidden');
        // Add empty state
        alertList.innerHTML = '<li style="text-align:center; color:var(--text-muted); padding:1rem;">Sin notificaciones nuevas</li>';
    }
}

function addAlertItem(list, title, desc, type) {
    const li = document.createElement('li');
    li.classList.add(`alert-${type}`);
    li.innerHTML = `
        <div style="font-weight: 700; font-size: 0.85rem;">${title}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${desc}</div>
    `;
    list.appendChild(li);
}
