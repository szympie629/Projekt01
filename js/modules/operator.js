// js/modules/operator.js

let dashboardInterval;
const MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"];

// --- 1. GENEROWANIE KART (HTML) ---
function initDashboard() {
    const grid = document.getElementById('machines-grid');
    if (!grid) return;

    grid.innerHTML = ""; // Czyścimy "Ładowanie..."

    MACHINES.forEach(id => {
        // Tworzymy kartę dla każdej maszyny
        const card = document.createElement('div');
        card.className = 'machine-card';
        card.innerHTML = `
            <h3 class="machine-title">${id}</h3>
            
            <div id="status-${id}" class="status-indicator status-offline">
                OFFLINE
            </div>

            <div class="stats-row">
                <div class="stat-item">
                    <span>OEE/Jakość</span>
                    <strong id="quality-${id}">--</strong>
                </div>
                <div class="stat-item">
                    <span>Sztuki</span>
                    <strong id="pieces-${id}">0</strong>
                </div>
                <div class="stat-item">
                    <span>Braki</span>
                    <strong id="scrap-${id}">0</strong>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- 2. POBIERANIE DANYCH ---
async function fetchMachineData() {
    const db = window._supabase;
    if (!db) return;

    // Pobieramy ostatnie 50 wpisów (z zapasem, żeby złapać status każdej z 6 maszyn)
    const { data, error } = await db
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Błąd pobierania danych:", error);
        return;
    }

    // --- 3. PRZETWARZANIE DANYCH ---
    // Musimy znaleźć NAJNOWSZY wpis dla KAŻDEJ maszyny
    const latestStatus = {};

    data.forEach(row => {
        // Jeśli jeszcze nie mamy wpisu dla tej maszyny, zapisujemy go (bo jest najnowszy dzięki sortowaniu)
        if (!latestStatus[row.machine_id]) {
            latestStatus[row.machine_id] = row;
        }
    });

    // --- 4. AKTUALIZACJA WIDOKU ---
    MACHINES.forEach(id => {
        const machineData = latestStatus[id];
        
        // Elementy DOM
        const statusEl = document.getElementById(`status-${id}`);
        const piecesEl = document.getElementById(`pieces-${id}`);
        const scrapEl = document.getElementById(`scrap-${id}`);
        const qualityEl = document.getElementById(`quality-${id}`);

        if (machineData) {
            // Ustawiamy wartości
            piecesEl.innerText = machineData.pieces_total;
            scrapEl.innerText = machineData.scrap_total;

            // Jakość
            let quality = 100;
            if (machineData.pieces_total > 0) {
                quality = (((machineData.pieces_total - machineData.scrap_total) / machineData.pieces_total) * 100).toFixed(1);
            }
            qualityEl.innerText = quality + "%";

            // Status i kolor
            statusEl.innerText = machineData.status;
            statusEl.className = 'status-indicator'; // Reset klas
            
            if (machineData.status === 'PRODUKCJA') statusEl.classList.add('status-produkcja');
            else if (machineData.status === 'AWARIA') statusEl.classList.add('status-awaria');
            else if (machineData.status === 'NAPRAWA') statusEl.classList.add('status-naprawa');
            else statusEl.classList.add('status-offline');

        } else {
            // Jeśli maszyna nie wysłała danych w ostatnich 50 logach, uznajemy ją za Offline
            // (Chyba że chcesz zachować stary stan, ale tu dla czytelności resetujemy)
            // statusEl.innerText = "BRAK DANYCH";
            // statusEl.classList.add('status-offline');
        }
    });
}

// --- FUNKCJE STERUJĄCE ---
window.startOperatorLogic = function() {
    console.log("Moduł Operatora (Multi): START");
    initDashboard(); // Budujemy siatkę
    fetchMachineData(); // Pobieramy dane od razu
    dashboardInterval = setInterval(fetchMachineData, 3000); // Odświeżamy co 3 sekundy
};

window.stopOperatorLogic = function() {
    console.log("Moduł Operatora (Multi): STOP");
    if (dashboardInterval) {
        clearInterval(dashboardInterval);
        dashboardInterval = null;
    }
};