// js/core/auth.js

// Pobieramy klienta bazy danych
const db = window._supabase;

// Elementy formularzy
const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('registration-form');
const msgBox = document.getElementById('message');

// Kontenery
const loginContainer = document.getElementById('login-container');
const regContainer = document.getElementById('registration-container');

// Przyciski przełączania widoków
const showLoginBtn = document.getElementById('show-login-btn');
const showRegBtn = document.getElementById('show-reg-btn');

// --- 1. OBSŁUGA LOGOWANIA (Z PRZEKIEROWANIEM) ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Zapytanie do bazy
        const { data, error } = await db
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            msgBox.innerText = "Błąd: Nieprawidłowy login lub hasło.";
            msgBox.style.color = "red";
        } else {
            msgBox.innerText = `Witaj ${data.first_name}! Przekierowanie...`;
            msgBox.style.color = "green";

            // ZMIANA: Zamiast pokazywać dashboard tutaj, przenosimy do pliku operatora
            setTimeout(() => {
                window.location.href = 'pages/operator.html';
            }, 1000);
        }
    });
}

// --- 2. OBSŁUGA REJESTRACJI ---
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            msgBox.innerText = "Błąd: Hasła nie są identyczne!";
            msgBox.style.color = "red";
            return;
        }

        const { error } = await db
            .from('users')
            .insert([{
                username: username,
                password: password,
                first_name: document.getElementById('firstName').value,
                last_name: document.getElementById('lastName').value,
                email: document.getElementById('email').value
            }]);

        if (error) {
            msgBox.innerText = "Rejestracja nie powiodła się: " + error.message;
            msgBox.style.color = "red";
        } else {
            msgBox.innerText = "Rejestracja pomyślna! Zaloguj się.";
            msgBox.style.color = "green";
            regForm.reset();
            setTimeout(() => {
                if(showLoginBtn) showLoginBtn.click();
            }, 1500);
        }
    });
}

// --- 3. PRZEŁĄCZANIE WIDOKÓW (LOGIN / REJESTRACJA) ---
if (showLoginBtn && showRegBtn) {
    showLoginBtn.addEventListener('click', () => {
        loginContainer.style.display = 'block';
        regContainer.style.display = 'none';
        msgBox.innerText = "";
    });

    showRegBtn.addEventListener('click', () => {
        regContainer.style.display = 'block';
        loginContainer.style.display = 'none';
        msgBox.innerText = "";
    });
}

// --- 4. OCZKO HASŁA ---
const toggleBtn = document.getElementById('toggle-btn');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const passInput = document.getElementById('password');
        const confirmInput = document.getElementById('confirmPassword');
        const isPass = passInput.type === 'password';
        
        passInput.type = isPass ? 'text' : 'password';
        confirmInput.type = isPass ? 'text' : 'password';
        toggleBtn.innerText = isPass ? '🙈' : '👁️';
    });
}