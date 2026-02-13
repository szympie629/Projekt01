// js/core/sidebar.js

document.addEventListener('DOMContentLoaded', () => {
    generateSidebar();
});

function generateSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // 1. Pobieramy dane użytkownika
    const role = sessionStorage.getItem('user_role') || 'guest';
    const userName = sessionStorage.getItem('user_name') || 'Użytkownik';
    let roleLabel = 'Pracownik';

    // 2. Konfiguracja Menu dla poszczególnych ról
    // Tu definiujemy co widzi konkretna osoba
    let menuItems = [];

    switch (role) {
        case 'admin':
            roleLabel = 'Administrator';
            menuItems = [
                { icon: 'ph-users', text: 'Użytkownicy', href: '#', active: true }
            ];
            break;

        case 'manager':
            roleLabel = 'Manager';
            menuItems = [
                { icon: 'ph-chart-bar', text: 'Dashboard', href: '#', active: true },
                { icon: 'ph-file-csv', text: 'Raporty', href: '#' }
            ];
            break;

        case 'operator':
            roleLabel = 'Operator';
            menuItems = [
                { icon: 'ph-monitor', text: 'Pulpit Maszyn', href: '#', active: true }
            ];
            break;

        case 'maintenance':
            roleLabel = 'Utrzymanie Ruchu';
            // Specjalna obsługa dla panelu UR (zakładki onclick)
            menuItems = [
                { icon: 'ph-gauge', text: 'Przegląd', href: '#', onclick: "switchTab('tab-overview', this)", active: true },
                { icon: 'ph-clipboard-text', text: 'Dziennik', href: '#', onclick: "switchTab('tab-logs', this)" },
                { icon: 'ph-chart-line-up', text: 'Analiza', href: '#', onclick: "switchTab('tab-charts', this)" },
                { icon: 'ph-sliders', text: 'Sterowanie', href: '#', onclick: "switchTab('tab-controls', this)" }
            ];
            break;

        default:
            console.warn('Nieznana rola użytkownika:', role);
            break;
    }

    // 3. Budowanie HTML (Struktura "Pixel-Perfect" zgodna z shared.css)
    
    // A. Nagłówek Sidebara
    let html = `
        <div class="sidebar-header">
            <div class="logo-icon"><i class="ph ph-nut"></i></div>
            <span class="logo-text">SynchroLab</span>
            <div class="toggle-btn" id="sidebar-toggle"><i class="ph ph-caret-left"></i></div>
        </div>
        
        <ul class="menu-items">
    `;

    // B. Elementy Menu (Pętla)
    menuItems.forEach(item => {
        const activeClass = item.active ? 'active' : '';
        const clickAttr = item.onclick ? `onclick="${item.onclick}"` : '';
        
        html += `
            <li class="${activeClass}" ${clickAttr}>
                <a href="${item.href}">
                    <i class="ph ${item.icon}"></i>
                    <span class="text">${item.text}</span>
                </a>
            </li>
        `;
    });

    // C. Profil i Wylogowanie (Stopka)
    html += `
            <li class="user-profile">
                <div class="profile-wrapper">
                    <i class="ph ph-user-circle"></i>
                    <div class="user-info-text">
                        <span class="name">${userName}</span>
                        <span class="role-badge">${roleLabel}</span>
                    </div>
                </div>
            </li>

            <li class="logout-item" onclick="handleLogout()">
                <a href="#">
                    <i class="ph ph-sign-out"></i>
                    <span class="text">Wyloguj</span>
                </a>
            </li>
        </ul>
    `;

    // 4. Wstrzyknięcie HTML do nawigacji
    sidebar.innerHTML = html;

    // 5. Aktywacja logiki przycisku zwijania (Toggle)
    initSidebarToggle();
}

// Funkcja obsługi przycisku zwijania
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Zapobiega błędom kliknięcia
            sidebar.classList.toggle('collapsed');
            
            if (mainContent) {
                mainContent.classList.toggle('expanded');
            }

            // Obrót strzałki
            const icon = toggleBtn.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.replace('ph-caret-left', 'ph-caret-right');
            } else {
                icon.classList.replace('ph-caret-right', 'ph-caret-left');
            }
        });
    }
}

// Funkcja wylogowania (Globalna)
window.handleLogout = function() {
    if(confirm("Czy na pewno chcesz się wylogować?")) {
        sessionStorage.clear();
        window.location.href = '../index.html';
    }
};

// === GLOBALNA OBSŁUGA ZAKŁADEK (TABS) ===
window.switchTab = function(tabId, linkElement) {
    // 1. Ukryj wszystkie kontenery z klasą .tab-content
    // (Zakładamy, że każda sekcja-zakładka ma klasę "tab-content")
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
    });

    // 2. Pokaż wybraną sekcję
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.style.display = 'block';
    } else {
        console.warn(`Nie znaleziono zakładki o ID: ${tabId}`);
    }

    // 3. Zaktualizuj aktywną klasę w menu (jeśli kliknięto w sidebar)
    if (linkElement) {
        // Usuń .active ze wszystkich elementów listy
        document.querySelectorAll('.menu-items li').forEach(li => {
            li.classList.remove('active');
        });

        // Dodaj .active do rodzica klikniętego linku (czyli do <li>)
        // Sprawdzamy czy to element DOM, czy np. tylko selector
        if (linkElement.parentNode) {
            linkElement.parentNode.classList.add('active');
        }
    }
};
