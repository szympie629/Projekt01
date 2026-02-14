// js/modules/admin.js

// Funkcja startowa (uruchamiana z admin.html)
window.initAdminPanel = function() {
    console.log("Panel Admina: START");
    fetchUsers();
};

// --- 1. POBIERANIE UŻYTKOWNIKÓW ---
async function fetchUsers() {
    const db = window._supabase;
    const tableBody = document.getElementById('users-table-body');

    // Pobieramy wszystkich użytkowników posortowanych od najnowszego
    const { data, error } = await db
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Błąd pobierania użytkowników:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Błąd: ${error.message}</td></tr>`;
        return;
    }

    // Czyścimy tabelę przed wypełnieniem
    tableBody.innerHTML = "";

    // Generujemy wiersze tabeli
    data.forEach(user => {
        const row = document.createElement('tr');
        
        // Budujemy HTML wiersza
        row.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>
                <select id="role-select-${user.id}" class="role-select">
                    <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>Operator</option>
                    <option value="maintenance" ${user.role === 'maintenance' ? 'selected' : ''}>Utrzymanie Ruchu</option>
                    <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Kierownik / Biuro</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                </select>
            </td>
            <td>
                <button class="save-btn" onclick="updateUserRole('${user.id}')">
                    Zapisz
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- 2. AKTUALIZACJA ROLI (FUNKCJA GLOBALNA) ---
window.updateUserRole = async function(userId) {
    const db = window._supabase;
    
    // Pobieramy wybraną wartość z listy rozwijanej
    const selectElement = document.getElementById(`role-select-${userId}`);
    const newRole = selectElement.value;

    if (!confirm(`Czy na pewno zmienić rolę tego użytkownika na "${newRole}"?`)) {
        return;
    }

    // Wysyłamy zmianę do bazy
    const { error } = await db
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        alert("Błąd zapisu: " + error.message);
    } else {
        alert("✅ Rola została zaktualizowana!");
        // Opcjonalnie: odśwież tabelę, żeby mieć pewność
        // fetchUsers(); 
    }
};