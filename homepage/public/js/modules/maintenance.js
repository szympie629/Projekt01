// js/modules/maintenance.js

const MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"];
let maintenanceInterval;

// Zmienne globalne dla wykresów (żeby móc je usuwać przed odświeżeniem)
let errorChartInstance = null;
let productionChartInstance = null;

// --- 1. FUNKCJA STARTOWA ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('live-issues-body')) {
        console.log("Panel UR: START");
        
        // 1. Start Live Dashboard (Tab 1)
        fetchLiveStatus(); 
        maintenanceInterval = setInterval(fetchLiveStatus, 5000);

        // 2. Start Charts (Tab 3) - ładujemy raz na start
        updateCharts();
    }
});

// ==========================================
// CZĘŚĆ A: PODGLĄD NA ŻYWO (LIVE STATUS)
// ==========================================

async function fetchLiveStatus() {
    const db = window._supabase;
    if (!db) return;

    const { data, error } = await db
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

    if (error) {
        console.error("Błąd Live:", error);
        return;
    }
    processLiveData(data);
}

function processLiveData(logs) {
    const latestStatus = {};
    const now = new Date();

    MACHINES.forEach(id => {
        const log = logs.find(l => l.machine_id === id);
        latestStatus[id] = log || { status: 'OFFLINE', created_at: null, error_code: null };
    });

    let countAlarms = 0;
    let countRepair = 0;
    let countOffline = 0;
    const issuesList = [];

    MACHINES.forEach(id => {
        const info = latestStatus[id];
        let isOffline = false;

        if (info.created_at) {
            const diffSeconds = (now - new Date(info.created_at)) / 1000;
            if (diffSeconds > 30) isOffline = true;
        } else {
            isOffline = true;
        }

        if (isOffline) {
            countOffline++;
            info.status = 'OFFLINE'; // Nadpisujemy wizualnie
        } else if (info.status === 'AWARIA') {
            countAlarms++;
            issuesList.push(info);
        } else if (info.status === 'NAPRAWA') {
            countRepair++;
            issuesList.push(info);
        }
    });

    updateKPI(countAlarms, countRepair, countOffline);
    updateIssuesTable(issuesList);
    updateControlPanel(latestStatus);
}

function updateKPI(alarms, repair, offline) {
    const elAlarms = document.getElementById('kpi-alarms');
    const elRepair = document.getElementById('kpi-maintenance');
    const elOffline = document.getElementById('kpi-offline');
    if(elAlarms) elAlarms.innerText = alarms;
    if(elRepair) elRepair.innerText = repair;
    if(elOffline) elOffline.innerText = offline;
}

function updateIssuesTable(issues) {
    const tbody = document.getElementById('live-issues-body');
    if(!tbody) return;
    tbody.innerHTML = "";

    if (issues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#28a745; padding: 20px;">
            <i class="ph ph-check-circle"></i> Brak aktywnych awarii.</td></tr>`;
        return;
    }

    issues.forEach(issue => {
        const row = document.createElement('tr');
        const timeStr = new Date(issue.created_at).toLocaleTimeString('pl-PL');
        let badge = issue.status === 'AWARIA' ? 'bg-danger' : 'bg-warning';
        
        row.innerHTML = `
            <td><strong>${issue.machine_id}</strong></td>
            <td><span class="status-badge ${badge}">${issue.status}</span></td>
            <td style="color: #d63384; font-family: monospace;">${issue.error_code || '--'}</td>
            <td>${timeStr}</td>
            <td><button class="action-btn">Reaguj</button></td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================================
// CZĘŚĆ B: HISTORIA I FILTRY
// ==========================================

window.fetchLogsHistory = async function() {
    const db = window._supabase;
    const tbody = document.getElementById('logs-table-body');
    const mFilter = document.getElementById('filter-machine').value;
    const sFilter = document.getElementById('filter-status').value;
    const lFilter = document.getElementById('filter-limit').value;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">⏳ Pobieranie...</td></tr>';

    let query = db.from('machine_logs').select('*').order('created_at', { ascending: false }).limit(lFilter);
    if (mFilter !== 'ALL') query = query.eq('machine_id', mFilter);
    if (sFilter !== 'ALL') query = query.eq('status', sFilter);

    const { data, error } = await query;

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Błąd: ${error.message}</td></tr>`;
        return;
    }
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Brak wyników.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    data.forEach(log => {
        const row = document.createElement('tr');
        const dateStr = new Date(log.created_at).toLocaleString('pl-PL');
        let color = log.status === 'AWARIA' ? 'color:#dc3545' : (log.status === 'NAPRAWA' ? 'color:#ffc107' : 'color:#28a745');
        
        row.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${log.machine_id}</strong></td>
            <td style="${color}; font-weight:bold;">${log.status}</td>
            <td style="font-family: monospace;">${log.error_code || '-'}</td>
            <td>${log.pieces_total} <small>(Braki: ${log.scrap_total})</small></td>
        `;
        tbody.appendChild(row);
    });
};

// ==========================================
// CZĘŚĆ C: ANALIZA I WYKRESY (NOWE)
// ==========================================

async function updateCharts() {
    const db = window._supabase;
    // Pobieramy większą próbkę danych do analizy (ostatnie 500 wpisów)
    const { data, error } = await db
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error || !data) return;

    // 1. PRZYGOTOWANIE DANYCH DO WYKRESU BŁĘDÓW
    // Zliczamy wystąpienia każdego kodu błędu
    const errorCounts = {};
    data.forEach(log => {
        if (log.status === 'AWARIA' && log.error_code) {
            errorCounts[log.error_code] = (errorCounts[log.error_code] || 0) + 1;
        }
    });
    // Convert to arrays for Chart.js
    const errorLabels = Object.keys(errorCounts);
    const errorValues = Object.values(errorCounts);

    // 2. PRZYGOTOWANIE DANYCH DO WYKRESU PRODUKCJI
    // Szukamy najnowszej wartości pieces_total dla każdej maszyny
    const productionStats = {};
    MACHINES.forEach(m => productionStats[m] = 0);
    
    // Iterujemy od początku (najnowsze), jak znajdziemy maszynę to zapisujemy i ignorujemy starsze
    data.forEach(log => {
        if (productionStats[log.machine_id] === 0) {
            productionStats[log.machine_id] = log.pieces_total;
        }
    });
    const prodLabels = Object.keys(productionStats);
    const prodValues = Object.values(productionStats);

    // 3. RYSOWANIE
    renderErrorChart(errorLabels, errorValues);
    renderProductionChart(prodLabels, prodValues);
}

function renderErrorChart(labels, data) {
    const ctx = document.getElementById('chart-errors').getContext('2d');
    
    // Jeśli wykres już istnieje, zniszcz go przed narysowaniem nowego (anty-glitch)
    if (errorChartInstance) errorChartInstance.destroy();

    errorChartInstance = new Chart(ctx, {
        type: 'doughnut', // Typ wykresu: pączek
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#dc3545', '#ffc107', '#fd7e14', '#20c997'],
                borderColor: '#495057', // Kolor ramki taki jak tło karty
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#adb5bd' } } // Legenda po prawej, jasny tekst
            }
        }
    });
}

function renderProductionChart(labels, data) {
    const ctx = document.getElementById('chart-production').getContext('2d');
    
    if (productionChartInstance) productionChartInstance.destroy();

    productionChartInstance = new Chart(ctx, {
        type: 'bar', // Typ wykresu: słupkowy
        data: {
            labels: labels,
            datasets: [{
                label: 'Sztuki',
                data: data,
                backgroundColor: '#0d6efd',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Ukrywamy legendę bo to proste słupki
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#6c757d', tickColor: '#6c757d' }, // Ciemne linie siatki
                    ticks: { color: '#adb5bd' } // Jasne liczby
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#adb5bd' } // Jasne etykiety maszyn
                }
            }
        }
    });
}

// ==========================================
// CZĘŚĆ D: STEROWANIE (AKCJE SERWISOWE)
// ==========================================

// Fragment pliku js/modules/maintenance.js (Sekcja D)

function updateControlPanel(latestStatusMap) {
    const grid = document.getElementById('control-grid');
    if (!grid) return;

    grid.innerHTML = ""; // Czyścimy

    MACHINES.forEach(id => {
        const info = latestStatusMap[id];
        // Domyślnie OFFLINE, jeśli brak danych
        const status = info ? info.status : 'OFFLINE';
        
        // Tworzymy kartę
        const card = document.createElement('div');
        card.className = 'chart-box';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';

        // --- 1. Kolory Statusów ---
        let statusColor = '#6c757d'; // Domyślny szary (OFFLINE / WYLACZONA)
        if (status === 'PRODUKCJA') statusColor = '#28a745'; // Zielony
        if (status === 'AWARIA') statusColor = '#dc3545'; // Czerwony
        if (status === 'NAPRAWA') statusColor = '#ffc107'; // Żółty
        if (status === 'WYLACZONA') statusColor = '#343a40'; // Ciemny grafit (Postój)

        let htmlContent = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:white;">${id}</h3>
                <span style="background:${statusColor}; padding:4px 10px; border-radius:4px; font-size:0.8em; font-weight:bold; color:white; border: 1px solid rgba(255,255,255,0.2);">
                    ${status}
                </span>
            </div>
            <div style="margin-bottom: 15px; color: #adb5bd; font-size: 0.9em;">
                Ost. sygnał: ${info && info.created_at ? new Date(info.created_at).toLocaleTimeString() : '--:--'} <br>
                Info: <span style="color:#d63384; font-family:monospace;">${info ? (info.error_code || 'OK') : '-'}</span>
            </div>
        `;

        // --- 2. Logika Przycisków ---
        let buttonsHtml = '';

        if (status === 'AWARIA') {
            buttonsHtml = `
                <button class="action-btn" style="width:100%; background-color:#ffc107; color:black;" 
                    onclick="setMachineStatus('${id}', 'NAPRAWA')">
                    <i class="ph ph-wrench"></i> Rozpocznij Naprawę
                </button>`;
        } 
        else if (status === 'NAPRAWA') {
            buttonsHtml = `
                <button class="action-btn" style="width:100%; background-color:#28a745;" 
                    onclick="setMachineStatus('${id}', 'PRODUKCJA')">
                    <i class="ph ph-check-circle"></i> Zakończ Naprawę
                </button>`;
        } 
        else if (status === 'PRODUKCJA') {
            // Tu mamy dwie opcje: Wymuś AWARIĘ lub WYŁĄCZ maszynę
            buttonsHtml = `
                <div style="display:flex; gap:10px;">
                    <button class="action-btn" style="flex:1; background-color:#343a40; border:1px solid #666;" 
                        onclick="setMachineStatus('${id}', 'WYLACZONA', 'POSTÓJ')">
                        <i class="ph ph-power"></i> Wyłącz
                    </button>
                    <button class="action-btn" style="flex:1; background-color:#dc3545;" 
                        onclick="setMachineStatus('${id}', 'AWARIA', 'MANUAL_STOP')">
                        <i class="ph ph-hand-palm"></i> Stop
                    </button>
                </div>`;
        } 
        else if (status === 'WYLACZONA') {
            buttonsHtml = `
                <button class="action-btn" style="width:100%; background-color:#28a745;" 
                    onclick="setMachineStatus('${id}', 'PRODUKCJA')">
                    <i class="ph ph-power"></i> Uruchom Maszynę
                </button>`;
        } 
        else {
            buttonsHtml = `<div style="text-align:center; color:#666; font-size:0.8em;">Brak połączenia (Offline)</div>`;
        }

        card.innerHTML = htmlContent + buttonsHtml;
        grid.appendChild(card);
    });
}

// Funkcja wysyłająca sygnał do bazy
window.setMachineStatus = async function(machineId, newStatus, errorCode = null) {
    const db = window._supabase;
    
    // 1. Pobieramy ostatnie liczniki tej maszyny (żeby ich nie wyzerować!)
    const { data: lastLog } = await db
        .from('machine_logs')
        .select('pieces_total, scrap_total')
        .eq('machine_id', machineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const pieces = lastLog ? lastLog.pieces_total : 0;
    const scrap = lastLog ? lastLog.scrap_total : 0;

    // 2. Wstawiamy nowy wpis wymuszający status
    const { error } = await db
        .from('machine_logs')
        .insert([{
            machine_id: machineId,
            status: newStatus,
            error_code: errorCode, // np. null przy powrocie do produkcji
            pieces_total: pieces,
            scrap_total: scrap
        }]);

    if (error) {
        alert("Błąd sterowania: " + error.message);
    } else {
        // Odśwież natychmiast
        fetchLiveStatus();
    }
};