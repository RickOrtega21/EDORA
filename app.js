// State management for Documents
let documents = []; // Will be populated from Supabase or LocalStorage
let currentUser = null;

let barChart = null;
let pieChart = null;
let intranetPieChart = null;
let selectedDocId = null;
let regBarChart = null;

// Registry of the 23 Regulatory Documents and their Delivery Quarters
const REGULATORY_DOCUMENTS = {
    "manual de crédito": "Entrega en 3 Q",
    "política para el adecuado empleo y aprovechamiento de los recursos": "Entrega en 3 Q",
    "política de contratación de servicios con terceros": "Entrega en 3 Q",
    "política general en materia de prestaciones de servicios y atención": "Entrega en 3 Q",
    "política general de suscripción personas": "Entrega en 3 Q",
    "política para el desarrollo y aprobación de nuevos productos": "Entrega en 3 Q",
    "política de auditoría interna": "Entrega en 4 Q",
    "estatutos comité de auditoría": "Entrega en 4 Q",
    "política de inversiones": "Entrega en 4 Q",
    "conflicto de interes": "Entrega en 4 Q",
    "conflicto de interes ": "Entrega en 4 Q",
    "código de conducta": "Entrega en 4 Q",
    "política de evaluación a miembros del consejo de admon": "Entrega en 4 Q",
    "manual de cumplimiento": "Entrega en 1 Q",
    "manual de administración integral de riesgos (mair)": "Entrega en 1 Q",
    "política de sostenibilidad": "Entrega en 1 Q",
    "manual del sistema de gobierno corporativo": "Entrega en 1 Q",
    "política de control interno": "Entrega en 1 Q",
    "manual de reaseguro": "Entrega en 1 Q",
    "política de precios de transferencia": "Entrega en 2 Q",
    "política de la función actuarial": "Entrega en 2 Q",
    "política de revelación de información": "Entrega en 2 Q",
    "política de remuneraciones de directivos relevantes": "Entrega en 2 Q",
    "política general de suscripción daños-autos": "Entrega en 2 Q"
};

// Register Chart.js plugin globally
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

// DOM Elements
const viewButtons = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const addDocBtn = document.getElementById('add-doc-btn');
const importExcelBtn = document.getElementById('import-excel-btn');
const excelInput = document.getElementById('excel-input');
const docModal = document.getElementById('doc-modal');
const closeModal = document.getElementById('close-modal');
const docForm = document.getElementById('doc-form');

const filterArea = document.getElementById('filter-area');
const filterStage = document.getElementById('filter-stage');
const filterAreaGantt = document.getElementById('filter-area-gantt');
const filterAreaKanban = document.getElementById('filter-area-kanban');

const contextMenu = document.getElementById('context-menu');
const menuDeleteTrigger = document.getElementById('menu-delete-trigger');
const deleteConfirmBox = document.getElementById('delete-confirm-box');
const deleteYes = document.getElementById('delete-yes');
const deleteNo = document.getElementById('delete-no');

// View Switching Logic
viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewId = `view-${btn.dataset.view}`;
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        views.forEach(v => v.id === viewId ? v.classList.remove('hidden') : v.classList.add('hidden'));

        // Update Header Title
        const viewTitle = document.getElementById('view-title');
        if (viewTitle) {
            viewTitle.textContent = btn.textContent.replace(/[^\w\s]/gi, '').trim();
        }

        if (btn.dataset.view === 'dashboard') updateDashboard();
        if (btn.dataset.view === 'kanban') renderKanban();
        if (btn.dataset.view === 'regulatorio') updateRegulatorio();
        if (btn.dataset.view === 'gantt') renderGantt();
    });
});

// Helper functions
async function saveDocs(newDoc = null, isDelete = false) {
    // Only use local storage as a temporary cache, not the source of truth
    localStorage.setItem('documentos', JSON.stringify(documents));

    if (window.supabaseClient && currentUser) {
        try {
            if (isDelete && newDoc) {
                // Global Delete - Accessible to all
                console.log('Eliminando de forma global:', newDoc.id);
                const { error } = await window.supabaseClient.from('documents').delete().eq('id', newDoc.id);
                if (error) console.error('Error al eliminar:', error.message);
            } else if (newDoc) {
                // Global Upsert - Shared History
                const docToUpload = {
                    id: newDoc.id,
                    user_id: currentUser.id, // ID of who added it, but policy allows global view
                    filename: newDoc.name,
                    area: newDoc.area,
                    start_date: newDoc.startDate,
                    target_date: newDoc.targetDate,
                    status: newDoc.status,
                    source_type: 'upload'
                };

                console.log('Sincronizando con base global:', docToUpload.filename);
                const { error } = await window.supabaseClient.from('documents').upsert(docToUpload);
                if (error) {
                    console.error('ERROR CRÍTICO SUPABASE:', error.message);
                    console.warn('¿Ya ejecutaste el script SQL en el editor de Supabase?');
                } else {
                    console.log('Sincronización Exitosa ✅');
                }
            }
        } catch (err) {
            console.error('Fallo de red al sincronizar:', err);
        }
    }
}

async function initApp() {
    // Check for session
    if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        currentUser = session?.user;

        // Redirect if not authenticated and not on login page
        if (!currentUser && !window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
            return;
        }

        if (currentUser) {
            console.log('Sesión activa:', currentUser.email);
            // FETCH GLOBAL HISTORY (Force sync from Supabase)
            try {
                const { data, error } = await window.supabaseClient.from('documents').select('*');
                if (error) {
                    console.error('Error cargando historial global:', error.message);
                    // If error (like RLS blocked), attempt local fallback
                    documents = JSON.parse(localStorage.getItem('documentos')) || [];
                } else if (data && data.length > 0) {
                    console.log('Historial Global Recuperado:', data.length, 'documentos');
                    documents = data.map(d => ({
                        id: d.id,
                        name: d.filename,
                        area: d.area,
                        startDate: d.start_date,
                        targetDate: d.target_date,
                        status: d.status
                    }));
                } else if (data && data.length === 0) {
                    console.log('La base global está vacía. Usando local temporal para migración...');
                    documents = JSON.parse(localStorage.getItem('documentos')) || [];
                }
            } catch (err) {
                console.error('Fallo crítico de conexión:', err);
                documents = JSON.parse(localStorage.getItem('documentos')) || [];
            }
        }
    } else {
        // No Supabase client, static mode
        documents = JSON.parse(localStorage.getItem('documentos')) || [];
    }

    updateDashboard();
    setupLogout();
    checkRegulatoryAlerts();
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
                window.location.href = 'login.html';
            }
        });
    }
}

function formatDate(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    let d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

    // Adjust for time zone offset to prevent "day before" error
    const offset = d.getTimezoneOffset() * 60000;
    d = new Date(d.getTime() - offset);
    return d.toISOString().split('T')[0];
}

// Excel Import
importExcelBtn.addEventListener('click', () => excelInput.click());
excelInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        json.forEach(row => {
            // Normalize keys to find matches case-insensitively
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            });

            const newDoc = {
                id: crypto.randomUUID(), // Use UUID for Supabase compatibility
                name: normalizedRow["nombre del documento"] || normalizedRow["nombre"] || 'Sin nombre',
                area: normalizedRow["área"] || normalizedRow["area"] || 'Sin área',
                startDate: formatDate(normalizedRow["fecha inicio"] || normalizedRow["fecha de inicio"]),
                targetDate: formatDate(normalizedRow["fecha compromiso"] || normalizedRow["fecha de compromiso"] || normalizedRow["fecha fin"]),
                status: 'todo'
            };
            documents.push(newDoc);
            saveDocs(newDoc);
        });
        updateDashboard(); alert('Documentos importados correctamente');
    };
    reader.readAsBinaryString(file);
});

// Modal Logic
addDocBtn.addEventListener('click', () => docModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => docModal.classList.add('hidden'));
docForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDoc = {
        id: crypto.randomUUID(),
        name: document.getElementById('doc-name').value,
        area: document.getElementById('doc-area').value,
        startDate: document.getElementById('doc-start-date').value,
        targetDate: document.getElementById('doc-target-date').value,
        status: 'todo'
    };
    documents.push(newDoc);
    await saveDocs(newDoc);
    docModal.classList.add('hidden'); docForm.reset(); updateDashboard();
});

// Context Menu Deletion Logic
function showContextMenu(x, y, docId) {
    selectedDocId = docId;
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
    menuDeleteTrigger.classList.remove('hidden');
    deleteConfirmBox.classList.add('hidden');
}

document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
    }
});

menuDeleteTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDeleteTrigger.classList.add('hidden');
    deleteConfirmBox.classList.remove('hidden');
});

deleteYes.addEventListener('click', async () => {
    const docToDelete = documents.find(doc => doc.id.toString() === selectedDocId.toString());
    documents = documents.filter(doc => doc.id.toString() !== selectedDocId.toString());
    await saveDocs(docToDelete, true);
    contextMenu.classList.add('hidden');
    renderKanban();
    updateDashboard();
});

deleteNo.addEventListener('click', () => {
    contextMenu.classList.add('hidden');
});

// Dashboard & Filtering
if (filterArea) filterArea.addEventListener('change', updateDashboard);
if (filterStage) filterStage.addEventListener('change', updateDashboard);
if (filterAreaGantt) filterAreaGantt.addEventListener('change', () => renderGantt());
if (filterAreaKanban) filterAreaKanban.addEventListener('change', () => renderKanban());

function updateDashboard() {
    updateFilteringOptions();
    renderBarChart();
    renderPieChart();
    renderIntranetPieChart();
    updateWeeklyDeadlines();
    if (typeof updateAlerts === 'function') updateAlerts();
    updateStats();
    if (typeof renderKanban === 'function' && !document.getElementById('view-kanban').classList.contains('hidden')) {
        renderKanban();
    }
    updateRegulatorio();
}

function updateFilteringOptions() {
    const areas = [...new Set(documents.map(doc => doc.area))];
    const updateSelect = (select, currentVal) => {
        if (!select) return;
        select.innerHTML = '<option value="all">Todas</option>';
        areas.forEach(area => {
            const opt = document.createElement('option');
            opt.value = area; opt.textContent = area;
            if (area === currentVal) opt.selected = true;
            select.appendChild(opt);
        });
    };
    updateSelect(filterArea, filterArea.value);
    updateSelect(filterAreaGantt, filterAreaGantt.value);
    updateSelect(filterAreaKanban, filterAreaKanban.value);
}

function renderBarChart() {
    const ctx = document.getElementById('dashboardChart').getContext('2d');
    const filteredDocs = documents.filter(doc => (filterArea.value === 'all' || doc.area === filterArea.value) && (filterStage.value === 'all' || doc.status === filterStage.value));

    // Update dynamic title
    const chartTitle = document.getElementById('bar-chart-title');
    if (chartTitle) {
        const areaName = filterArea.value === 'all' ? 'Todas' : filterArea.value;
        chartTitle.textContent = `Grafico de avance de ${areaName}`;
    }

    // Mapping internal status to user-friendly labels (matching 'etapa' from Excel if possible)
    const statusLabels = {
        'todo': 'Por Hacer',
        'in-progress': 'En Proceso',
        'review-ci': 'Revisado por CI',
        'review-area': 'Revisado por el área',
        'released': 'Liberado',
        'signed': 'Firmado',
        'intranet': 'Cargado a INTRANET'
    };
    const data = Object.keys(statusLabels).map(key => filteredDocs.filter(doc => doc.status === key).length);
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.values(statusLabels),
            datasets: [{
                data: data,
                backgroundColor: '#1a237e', // Dark Blue for bars
                borderColor: '#1a237e',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.8)',
                        font: { weight: 'bold' },
                        stepSize: 1
                    },
                    grid: { color: '#e2e8f0' }
                },
                x: {
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.8)',
                        font: { weight: 'bold' }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: { anchor: 'center', align: 'center', color: '#ffffff', font: { weight: 'bold', size: 14 }, formatter: (v) => v > 0 ? v : '' }
            }
        }
    });
}

function renderPieChart() {
    const ctx = document.getElementById('progressPieChart').getContext('2d');
    const filteredDocs = documents.filter(doc => (filterArea.value === 'all' || doc.area === filterArea.value));

    // Original Pie Chart: Liberados vs Pendientes (excluding Intranet)
    const released = filteredDocs.filter(doc => doc.status === 'released').length;
    const pending = filteredDocs.filter(doc => ['todo', 'in-progress', 'review-ci', 'review-area'].includes(doc.status)).length;

    const total = released + pending;

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Liberados', 'Pendientes'],
            datasets: [{
                data: [released, pending],
                backgroundColor: ['#00d4ff', '#1a237e'], // Cyan, Dark Blue
                borderColor: ['#ffffff', '#ffffff'], // White border for clean separation
                borderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 10 } } },
                datalabels: {
                    color: '#ffffff', font: { weight: 'bold', size: 14 },
                    formatter: (value, ctx) => {
                        if (total === 0) return '';
                        let percentage = (value * 100 / total).toFixed(1) + "%";
                        return percentage;
                    }
                }
            }
        }
    });
}

function renderIntranetPieChart() {
    const ctx = document.getElementById('intranetPieChart').getContext('2d');
    const filteredDocs = documents.filter(doc => (filterArea.value === 'all' || doc.area === filterArea.value));

    // New Pie Chart: Concluidos (Intranet) vs Pendientes (Everything else)
    const concluded = filteredDocs.filter(doc => doc.status === 'intranet').length;
    // For this chart, "Pendiente" is everything NOT intranet
    const pending = filteredDocs.length - concluded;

    const total = filteredDocs.length;

    if (intranetPieChart) intranetPieChart.destroy();
    intranetPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Concluidos', 'Pendientes'],
            datasets: [{
                data: [concluded, pending],
                backgroundColor: ['#3949ab', '#e0e7ff'], // Indigo for Concluded, Light Indigo for Pending? 
                // Getting closer to image rings: Dark Blue and Cyan.
                // Let's use Dark Blue for "Concluidos" and Light Gray for "Pendientes" to mimic the "remaining" look?
                // Or Cyan for Concluidos.
                backgroundColor: ['#00d4ff', '#e2e8f0'], // Cyan, Light Gray
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 10 } } },
                // Change text color for light segment?
                datalabels: {
                    color: (context) => context.dataIndex === 1 ? '#64748b' : '#ffffff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, ctx) => {
                        if (total === 0) return '';
                        let percentage = (value * 100 / total).toFixed(1) + "%";
                        return percentage;
                    }
                }
            }
        }
    });
}

function updateWeeklyDeadlines() {
    const weeklyList = document.getElementById('weekly-list');
    if (!weeklyList) return;
    weeklyList.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const weeklyDocs = documents.filter(doc => {
        const matchesArea = filterArea.value === 'all' || doc.area === filterArea.value;
        const date = new Date(doc.targetDate);
        date.setHours(0, 0, 0, 0);
        return matchesArea && date >= today && date <= nextWeek;
    });

    if (weeklyDocs.length === 0) {
        weeklyList.innerHTML = '<li style="padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">Sin vencimientos esta semana</li>';
        return;
    }
    weeklyDocs.forEach(doc => {
        const li = document.createElement('li');
        li.style.padding = '1rem';
        li.style.borderBottom = '1px solid var(--glass-border)';
        li.innerHTML = `<div style="font-weight: 600;">${doc.name}</div><div style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0;">Inicio: ${doc.startDate} <br> Fin: ${doc.targetDate}</div><div style="font-size: 0.8rem; color: var(--accent-warning);">${doc.area}</div>`;
        weeklyList.appendChild(li);
    });
}

function updateStats() {
    const filteredDocs = documents.filter(doc => (filterArea.value === 'all' || doc.area === filterArea.value));

    const total = filteredDocs.length;
    // Strictly separated counts based on the filtered set
    const released = filteredDocs.filter(doc => doc.status === 'released').length;
    const signed = filteredDocs.filter(doc => doc.status === 'signed').length;
    const intranet = filteredDocs.filter(doc => doc.status === 'intranet').length;
    const pending = total - released - signed - intranet;

    const critical = filteredDocs.filter(doc => {
        const targetDate = new Date(doc.targetDate);
        const today = new Date();
        const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 5 && !['released', 'signed', 'intranet'].includes(doc.status);
    }).length;

    if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = total;
    if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = pending;
    if (document.getElementById('stat-critical')) document.getElementById('stat-critical').textContent = critical;

    // Update finished documents count (Intranet)
    const intranetCount = documents.filter(doc =>
        (filterArea.value === 'all' || doc.area === filterArea.value) &&
        doc.status === 'intranet'
    ).length;

    const intranetCountElem = document.getElementById('intranet-count');
    if (intranetCountElem) {
        intranetCountElem.textContent = intranetCount;
    }
}

document.addEventListener('DOMContentLoaded', initApp);

// Update Regulatorio Stats, Table and Chart
function updateRegulatorio() {
    // Filter regulatory docs
    const regDocs = documents.filter(doc => {
        const cleanName = doc.name.trim().toLowerCase();
        return REGULATORY_DOCUMENTS.hasOwnProperty(cleanName);
    });

    // Sort by quarter (1Q -> 2Q -> 3Q -> 4Q) and alphabetically
    regDocs.sort((a, b) => {
        const qA = REGULATORY_DOCUMENTS[a.name.trim().toLowerCase()] || "";
        const qB = REGULATORY_DOCUMENTS[b.name.trim().toLowerCase()] || "";
        
        const numA = parseInt(qA.replace(/\D/g, "")) || 0;
        const numB = parseInt(qB.replace(/\D/g, "")) || 0;
        
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name);
    });

    // Update Stats
    const total = regDocs.length;
    const pending = regDocs.filter(doc => !['released', 'signed', 'intranet'].includes(doc.status)).length;
    const critical = regDocs.filter(doc => {
        const targetDate = new Date(doc.targetDate);
        const today = new Date();
        const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 5 && !['released', 'signed', 'intranet'].includes(doc.status);
    }).length;

    const statTotalEl = document.getElementById('reg-stat-total');
    const statPendingEl = document.getElementById('reg-stat-pending');
    const statCriticalEl = document.getElementById('reg-stat-critical');
    
    if (statTotalEl) statTotalEl.textContent = total;
    if (statPendingEl) statPendingEl.textContent = pending;
    if (statCriticalEl) statCriticalEl.textContent = critical;

    // Render Table
    const tableBody = document.getElementById('regulatorio-table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
        if (regDocs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No hay documentos regulatorios</td></tr>`;
        } else {
            const statusLabels = {
                'todo': 'Por Hacer',
                'in-progress': 'En Proceso',
                'review-ci': 'Revisado por CI',
                'review-area': 'Revisado por el área',
                'released': 'Liberado',
                'signed': 'Firmado',
                'intranet': 'Cargado a INTRANET'
            };
            
            regDocs.forEach(doc => {
                const cleanName = doc.name.trim().toLowerCase();
                const trimestre = REGULATORY_DOCUMENTS[cleanName] || 'Sin especificar';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${doc.name}</td>
                    <td>${trimestre}</td>
                    <td style="color: var(--accent-secondary); font-weight: 600;">${doc.area}</td>
                    <td><span class="badge badge-${doc.status}">${statusLabels[doc.status] || doc.status}</span></td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    // Render Bar Chart (identical to dashboard)
    renderRegulatorioBarChart(regDocs);
}

// Render Regulatorio Bar Chart
function renderRegulatorioBarChart(regDocs) {
    const canvas = document.getElementById('regulatorioChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const statusLabels = {
        'todo': 'Por Hacer',
        'in-progress': 'En Proceso',
        'review-ci': 'Revisado por CI',
        'review-area': 'Revisado por el área',
        'released': 'Liberado',
        'signed': 'Firmado',
        'intranet': 'Cargado a INTRANET'
    };
    const data = Object.keys(statusLabels).map(key => regDocs.filter(doc => doc.status === key).length);
    
    if (regBarChart) regBarChart.destroy();
    regBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.values(statusLabels),
            datasets: [{
                data: data,
                backgroundColor: '#1a237e',
                borderColor: '#1a237e',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.8)',
                        font: { weight: 'bold' },
                        stepSize: 1
                    },
                    grid: { color: '#e2e8f0' }
                },
                x: {
                    ticks: {
                        color: 'rgba(0, 0, 0, 0.8)',
                        font: { weight: 'bold' }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'center',
                    align: 'center',
                    color: '#ffffff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (v) => v > 0 ? v : ''
                }
            }
        }
    });
}

// Check if any regulatory documents have start dates triggering the alert
function checkRegulatoryAlerts() {
    let todayStr;
    const urlParams = new URLSearchParams(window.location.search);
    const simDateParam = urlParams.get('simDate');

    // Bypass sessionStorage limit if we are simulating today's date for verification
    if (!simDateParam && sessionStorage.getItem('regulatoryAlertShown') === 'true') {
        return;
    }

    if (simDateParam) {
        todayStr = simDateParam;
        console.log('Simulando fecha de hoy para alertas:', todayStr);
    } else {
        const localDate = new Date();
        const y = localDate.getFullYear();
        const m = String(localDate.getMonth() + 1).padStart(2, '0');
        const d = String(localDate.getDate()).padStart(2, '0');
        todayStr = `${y}-${m}-${d}`;
        console.log('Fecha de hoy normal para alertas:', todayStr);
    }

    const alertsToTrigger = documents.filter(doc => {
        const cleanName = doc.name.trim().toLowerCase();
        const isRegulatory = REGULATORY_DOCUMENTS.hasOwnProperty(cleanName);
        if (!isRegulatory) return false;
        
        return doc.startDate === todayStr;
    });

    if (alertsToTrigger.length > 0) {
        showRegulatoryAlertModal(alertsToTrigger);
    }
}

// Display the temporal regulatory warning popup modal
function showRegulatoryAlertModal(alertDocs) {
    const modal = document.getElementById('regulatory-alert-modal');
    const list = document.getElementById('regulatory-alert-list');
    const timerLabel = document.getElementById('regulatory-alert-timer');
    const closeBtn = document.getElementById('close-regulatory-alert');

    if (!modal || !list || !timerLabel || !closeBtn) return;

    list.innerHTML = '';
    alertDocs.forEach(doc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--glass-border); font-weight: 600;">${doc.name}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--glass-border); color: var(--accent-secondary); font-weight: 600;">${doc.area}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--glass-border); color: var(--accent-error); font-weight: 700;">${doc.targetDate}</td>
        `;
        list.appendChild(tr);
    });

    sessionStorage.setItem('regulatoryAlertShown', 'true');
    modal.classList.remove('hidden');

    let timeLeft = 20;
    timerLabel.textContent = `Auto-cierre en ${timeLeft}s`;

    const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            modal.classList.add('hidden');
        } else {
            timerLabel.textContent = `Auto-cierre en ${timeLeft}s`;
        }
    }, 1000);

    closeBtn.onclick = () => {
        clearInterval(countdownInterval);
        modal.classList.add('hidden');
    };
}

