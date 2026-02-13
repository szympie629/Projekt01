// js/modules/manager.js

// Zmienne globalne dla wykresów (żeby móc je odświeżać bez błędów)
let productionChartInstance = null;
let statusChartInstance = null;

// Lista maszyn do monitorowania
const MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"];

// --- 1. FUNKCJA STARTOWA ---
window.initManagerDashboard = function() {
    console.log("Panel Managera: START");
    
    // Uruchomienie pierwszego pobrania danych
    fetchManagerData();

    // Odświeżanie co 10 sekund
    setInterval(fetchManagerData, 10000);
};

// --- 2. POBIERANIE DANYCH Z SUPABASE ---
async function fetchManagerData() {
    const db = window._supabase;
    if (!db) return;

    // Pobieramy logi z dzisiaj (ostatnie 1000 wpisów dla dobrej próbki statystycznej)
    const { data, error } = await db
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error("Błąd danych managera:", error);
        return;
    }

    calculateKPI(data);
    updateCharts(data);
}

// --- 3. OBLICZANIE KPI (BIG NUMBERS) ---
function calculateKPI(logs) {
    // A. Znajdź NAJNOWSZY wpis dla każdej maszyny (aby mieć aktualne liczniki)
    const latestMachineState = {};
    
    logs.forEach(log => {
        if (!latestMachineState[log.machine_id]) {
            latestMachineState[log.machine_id] = log;
        }
    });

    // Sumowanie produkcji i braków ze wszystkich maszyn
    let totalPieces = 0;
    let totalScrap = 0;

    Object.values(latestMachineState).forEach(m => {
        totalPieces += m.pieces_total || 0;
        totalScrap += m.scrap_total || 0;
    });

    // B. Obliczenia matematyczne
    // 1. Wolumen Produkcji
    updateElement('kpi-volume', totalPieces);

    // 2. Jakość (%) = (Dobre / Wszystkie) * 100
    let qualityPercent = 0;
    if (totalPieces > 0) {
        qualityPercent = ((totalPieces - totalScrap) / totalPieces) * 100;
    }
    updateElement('kpi-quality', qualityPercent.toFixed(1) + "%");

    // 3. OEE (Uproszczone)
    // Dostępność = Ile logów "PRODUKCJA" vs inne statusy (w pobranej próbce)
    const productionLogs = logs.filter(l => l.status === 'PRODUKCJA').length;
    const totalLogs = logs.length;
    
    let availability = totalLogs > 0 ? (productionLogs / totalLogs) : 0;
    
    // OEE = Dostępność * Jakość (Wydajność zakładamy 100% dla uproszczenia w wersji 1.0)
    let oee = availability * (qualityPercent / 100) * 100;
    
    updateElement('kpi-oee', oee.toFixed(1) + "%");
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// --- 4. RYSOWANIE WYKRESÓW ---
function updateCharts(logs) {
    // Musimy najpierw stworzyć kontenery na wykresy, jeśli ich nie ma
    // (W HTML mieliśmy placeholder, teraz go podmieniamy dynamicznie)
    const placeholder = document.querySelector('.charts-placeholder-section');
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="charts-wrapper" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 0 20px;">
                <div class="chart-box" style="background: #495057; padding: 20px; border-radius: 8px; border: 1px solid #6c757d;">
                    <h3 style="color: #adb5bd; margin-top: 0; text-align: center;">Wydajność Maszyn (Sztuki)</h3>
                    <div style="height: 300px;"><canvas id="manager-chart-production"></canvas></div>
                </div>
                <div class="chart-box" style="background: #495057; padding: 20px; border-radius: 8px; border: 1px solid #6c757d;">
                    <h3 style="color: #adb5bd; margin-top: 0; text-align: center;">Udział Statusów (Czas Pracy)</h3>
                    <div style="height: 300px;"><canvas id="manager-chart-status"></canvas></div>
                </div>
            </div>
        `;
        placeholder.classList.remove('charts-placeholder-section');
    }

    // --- DANE DO WYKRESU 1: PRODUKCJA WG MASZYN ---
    // Pobieramy najnowszy stan każdej maszyny
    const productionData = {};
    MACHINES.forEach(m => productionData[m] = 0);

    // Szukamy najnowszego logu dla każdej maszyny
    const processedMachines = [];
    logs.forEach(log => {
        if (!processedMachines.includes(log.machine_id)) {
            productionData[log.machine_id] = log.pieces_total;
            processedMachines.push(log.machine_id);
        }
    });

    renderBarChart(Object.keys(productionData), Object.values(productionData));

    // --- DANE DO WYKRESU 2: STATUSY (PIE CHART) ---
    // Zliczamy wystąpienia statusów w całej historii logów
    const statusCounts = { 'PRODUKCJA': 0, 'AWARIA': 0, 'NAPRAWA': 0, 'POSTÓJ': 0 };
    
    logs.forEach(log => {
        // Mapowanie statusów na główne kategorie
        let s = log.status;
        if (s === 'WYLACZONA' || s === 'OFFLINE') s = 'POSTÓJ';
        
        if (statusCounts[s] !== undefined) {
            statusCounts[s]++;
        } else {
            statusCounts['POSTÓJ']++;
        }
    });

    renderDoughnutChart(Object.keys(statusCounts), Object.values(statusCounts));
}

// --- RENDERING CHART.JS ---

function renderBarChart(labels, data) {
    const ctx = document.getElementById('manager-chart-production');
    if (!ctx) return;

    if (productionChartInstance) productionChartInstance.destroy();

    productionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Wyprodukowane Sztuki',
                data: data,
                backgroundColor: '#0d6efd',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#6c757d' }, ticks: { color: '#adb5bd' } },
                x: { grid: { display: false }, ticks: { color: '#adb5bd' } }
            }
        }
    });
}

function renderDoughnutChart(labels, data) {
    const ctx = document.getElementById('manager-chart-status');
    if (!ctx) return;

    if (statusChartInstance) statusChartInstance.destroy();

    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#6c757d'], // Prod, Awaria, Naprawa, Postój
                borderColor: '#495057',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#adb5bd' } }
            }
        }
    });
}
