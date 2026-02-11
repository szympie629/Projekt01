// js/modules/maintenance.js

const MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"];
let maintenanceInterval;

// --- 1. FUNKCJA STARTOWA ---
// Uruchamiana automatycznie, jeśli jesteśmy na maintenance.html
document.addEventListener('DOMContentLoaded', () => {
    // Sprawdzamy czy to właściwa podstrona, żeby nie odpalać skryptu gdzie indziej
    if (document.getElementById('live-issues-body')) {
        console.log("Panel UR: START");
        fetchLiveStatus(); // Pierwsze pobranie
        maintenanceInterval = setInterval(fetchLiveStatus, 5000); // Odświeżanie co 5 sek
    }
});

// --- 2. GŁÓWNA PĘTLA DANYCH ---
async function fetchLiveStatus() {
    const db = window._supabase;
    if (!db) return;

    // Pobieramy ostatnie 60 logów (z zapasem dla 6 maszyn)
    const { data, error } = await db
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

    if (error) {
        console.error("Błąd pobierania danych:", error);
        return;
    }

    processData(data);
}

// --- 3. PRZETWARZANIE DANYCH ---
function processData(logs) {
    const latestStatus = {};
    const now = new Date();

    // A. Znajdź najnowszy wpis dla każdej maszyny
    MACHINES.forEach(id => {
        const log = logs.find(l => l.machine_id === id);
        if (log) {
            latestStatus[id] = log;
        } else {
            // Jeśli brak logów w bazie dla tej maszyny
            latestStatus[id] = { status: 'OFFLINE', created_at: null, error_code: null };
        }
    });

    // B. Zliczanie statystyk (KPI)
    let countAlarms = 0;
    let countRepair = 0;
    let countOffline = 0;
    const issuesList = []; // Lista maszyn do tabeli

    MACHINES.forEach(id => {
        const info = latestStatus[id];
        let isOffline = false;

        // Sprawdzenie OFFLINE (jeśli brak danych lub dane starsze niż 30 sekund)
        if (info.created_at) {
            const lastSignal = new Date(info.created_at);
            const diffSeconds = (now - lastSignal) / 1000;
            if (diffSeconds > 30) { // Maszyna milczy od 30 sek
                isOffline = true;
                info.status = 'OFFLINE'; // Nadpisujemy status na potrzeby wyświetlania
            }
        } else {
            isOffline = true;
        }

        // Zliczanie
        if (isOffline) {
            countOffline++;
        } else if (info.status === 'AWARIA') {
            countAlarms++;
            issuesList.push(info); // Dodaj do tabeli problemów
        } else if (info.status === 'NAPRAWA') {
            countRepair++;
            issuesList.push(info); // Dodaj do tabeli problemów
        }
    });

    // --- 4. AKTUALIZACJA UI ---
    updateKPI(countAlarms, countRepair, countOffline);
    updateIssuesTable(issuesList);
}

// --- 5. AKTUALIZACJA KART KPI ---
function updateKPI(alarms, repair, offline) {
    // Animacja liczb? Na razie po prostu wpisanie.
    document.getElementById('kpi-alarms').innerText = alarms;
    document.getElementById('kpi-maintenance').innerText = repair;
    document.getElementById('kpi-offline').innerText = offline;
}

// --- 6. AKTUALIZACJA TABELI "WYMAGAJĄ UWAGI" ---
function updateIssuesTable(issues) {
    const tbody = document.getElementById('live-issues-body');
    tbody.innerHTML = ""; // Czyścimy tabelę

    if (issues.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:#28a745; padding: 20px;">
                    <i class="ph ph-check-circle" style="font-size: 1.5em; vertical-align: middle;"></i>
                    Brak aktywnych awarii. Produkcja w toku.
                </td>
            </tr>`;
        return;
    }

    issues.forEach(issue => {
        const row = document.createElement('tr');
        
        // Formatowanie czasu (tylko godzina)
        const timeStr = new Date(issue.created_at).toLocaleTimeString('pl-PL');
        
        // Ustalenie klasy i etykiety statusu
        let badgeClass = 'bg-secondary';
        let statusLabel = issue.status;
        
        if (issue.status === 'AWARIA') {
            badgeClass = 'bg-danger';
        } else if (issue.status === 'NAPRAWA') {
            badgeClass = 'bg-warning';
        }

        row.innerHTML = `
            <td><strong>${issue.machine_id}</strong></td>
            <td><span class="status-badge ${badgeClass}">${statusLabel}</span></td>
            <td style="color: #d63384; font-family: monospace;">${issue.error_code || '--'}</td>
            <td>Od: ${timeStr}</td>
            <td>
                <button class="action-btn" onclick="alert('Funkcja przejęcia zgłoszenia w budowie!')">
                    Reaguj
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}