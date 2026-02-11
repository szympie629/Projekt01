// Dane do połączenia z Twoim projektem Supabase
const supabaseUrl = 'https://zmwnvciqxsphttbcunxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Referencje do elementów interfejsu
const authButtons = document.getElementById('auth-buttons');
const loginContainer = document.getElementById('login-container');
const regContainer = document.getElementById('registration-container');
const dashboardContainer = document.getElementById('dashboard-container');
const message = document.getElementById('message');

// Przyciski nawigacji
const showLoginBtn = document.getElementById('show-login-btn');
const showRegBtn = document.getElementById('show-reg-btn');

// Formularze
const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('registration-form');

// --- 1. Nawigacja między formularzami ---

showLoginBtn.addEventListener('click', () => {
    loginContainer.style.display = 'block';
    regContainer.style.display = 'none';
    message.innerText = "";
});

showRegBtn.addEventListener('click', () => {
    regContainer.style.display = 'block';
    loginContainer.style.display = 'none';
    message.innerText = "";
});

// --- 2. Obsługa Logowania ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = document.getElementById('login-username').value;
    const passVal = document.getElementById('login-password').value;

    // Sprawdzamy czy użytkownik o takim loginie i haśle istnieje w tabeli 'users'
    const { data, error } = await _supabase
        .from('users')
        .select('*')
        .eq('username', userVal)
        .eq('password', passVal)
        .single(); // Oczekujemy dokładnie jednego wyniku

    if (error || !data) {
        message.innerText = "Błąd: Nieprawidłowy login lub hasło.";
        message.style.color = "red";
    } else {
        message.innerText = `Witaj ${data.first_name}! Logowanie pomyślne.`;
        message.style.color = "green";
        
        // Ukrywamy wszystko i pokazujemy Dashboard
        setTimeout(() => {
            loginContainer.style.display = 'none';
            authButtons.style.display = 'none';
            dashboardContainer.style.display = 'block';
            
            // Uruchamiamy pobieranie danych z maszyny
            startDashboardUpdates();
        }, 1000);
    }
});

// --- 3. Obsługa Rejestracji (bez zmian, dodane przełączanie) ---

regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (pass !== confirmPass) {
        message.innerText = "Błąd: Hasła nie są identyczne!";
        message.style.color = "red";
        return; 
    }

    const { error } = await _supabase
        .from('users')
        .insert([{ 
            username: username, 
            password: pass,
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value
        }]);

    if (error) {
        message.innerText = "Rejestracja nie powiodła się: " + error.message;
        message.style.color = "red";
    } else {
        message.innerText = "Rejestracja pomyślna! Teraz możesz się zalogować.";
        message.style.color = "green";
        regForm.reset();
        // Po rejestracji przełączamy na logowanie
        setTimeout(() => { showLoginBtn.click(); }, 1500);
    }
});

// --- 4. Logika Dashboardu (zamykamy w funkcji) ---

function startDashboardUpdates() {
    setInterval(fetchMachineData, 3000);
    fetchMachineData();
}

async function fetchMachineData() {
    const { data, error } = await _supabase
        .from('machine_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (data) {
        document.getElementById('pieces-count').innerText = data.pieces_total;
        document.getElementById('scrap-count').innerText = data.scrap_total;
        const indicator = document.getElementById('status-indicator');
        indicator.innerText = data.status;
        
        indicator.classList.remove('status-produkcja', 'status-awaria', 'status-naprawa');
        if (data.status === 'PRODUKCJA') indicator.classList.add('status-produkcja');
        else if (data.status === 'AWARIA' || data.status === 'NAPRAWA') indicator.classList.add('status-naprawa');
    }
}

// Obsługa "oczka" hasła (bez zmian)
document.getElementById('toggle-btn').addEventListener('click', () => {
    const passInput = document.getElementById('password');
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    document.getElementById('confirmPassword').type = isPass ? 'text' : 'password';
    document.getElementById('toggle-btn').innerText = isPass ? '🙈' : '👁️';
});