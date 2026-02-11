// js/modules/operator.js

let dashboardInterval;

// Funkcja pobierająca dane z bazy i aktualizująca widok
async function fetchMachineData() {
    // Korzystamy z globalnego klienta zdefiniowanego w config.js
    const db = window._supabase;
    if (!db) return;

    // Pobranie ostatniego wpisu z logów maszyny
    const { data, error } = await db
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (data) {
        const pieces = data.pieces_total;
        const scrap = data.scrap_total;

        // Aktualizacja liczników
        const piecesEl = document.getElementById('pieces-count');
        const scrapEl = document.getElementById('scrap-count');
        const qualityEl = document.getElementById('quality-percent');
        const indicatorEl = document.getElementById('status-indicator');

        if(piecesEl) piecesEl.innerText = pieces;
        if(scrapEl) scrapEl.innerText = scrap;

        // --- Obliczanie jakości ---
        let quality = 100;
        if (pieces > 0) {
            quality = (((pieces - scrap) / pieces) * 100).toFixed(1);
        }
        if(qualityEl) qualityEl.innerText = quality + "%";

        // --- Aktualizacja statusu wizualnego ---
        if (indicatorEl) {
            indicatorEl.innerText = data.status;
            indicatorEl.className = ''; // Czyścimy stare klasy (np. style z shared.css)
            // Dodajemy klasę bazową (opcjonalnie) i specyficzną dla statusu
            
            // Mapowanie statusów na klasy CSS z operator-hmi.css
            if (data.status === 'PRODUKCJA') {
                indicatorEl.classList.add('status-produkcja');
            } else if (data.status === 'AWARIA') {
                indicatorEl.classList.add('status-awaria');
            } else if (data.status === 'NAPRAWA') {
                indicatorEl.classList.add('status-naprawa');
            }
        }
    } else if (error) {
        console.error("Błąd pobierania danych maszyny:", error);
    }
}

// --- Funkcje globalne sterujące modułem ---

// Funkcja uruchamiana przez auth.js po zalogowaniu
window.startOperatorLogic = function() {
    console.log("Moduł Operatora: START");
    fetchMachineData(); // Pierwsze pobranie natychmiast
    dashboardInterval = setInterval(fetchMachineData, 3000); // Kolejne co 3 sekundy
};

// Funkcja uruchamiana przez auth.js przy wylogowaniu
window.stopOperatorLogic = function() {
    console.log("Moduł Operatora: STOP");
    if (dashboardInterval) {
        clearInterval(dashboardInterval);
        dashboardInterval = null;
    }
};