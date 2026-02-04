// Dane do połączenia z Twoim projektem Supabase
const supabaseUrl = 'https://zmwnvciqxsphttbcunxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

const regForm = document.getElementById('registration-form');
const message = document.getElementById('message');

// --- NOWOŚĆ: Obsługa przycisku "Pokaż hasło" ---
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');

togglePassword.addEventListener('change', () => {
    // Jeśli checkbox jest zaznaczony, pokaż tekst, w przeciwnym razie kropki
    const type = togglePassword.checked ? 'text' : 'password';
    passwordInput.type = type;
    confirmPasswordInput.type = type;
});

// --- Obsługa wysyłania formularza ---
regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Pobieramy wartości ze wszystkich pól
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const pass = document.getElementById('password').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    // 1. Sprawdzamy, czy hasła są takie same
    if (pass !== confirmPass) {
        message.innerText = "Błąd: Hasła nie są identyczne!";
        message.style.color = "red";
        return; // Zatrzymujemy funkcję, nie wysyłamy danych
    }

    // 2. Jeśli hasła są OK, wysyłamy komplet danych do Supabase
    // Upewnij się, że w bazie dodałeś kolumny: first_name, last_name, email, phone
    const { data, error } = await _supabase
        .from('users')
        .insert([{ 
            username: username, 
            password: pass,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone
        }]);

    if (error) {
        message.innerText = "Rejestracja nie powiodła się: " + error.message;
        message.style.color = "red";
    } else {
        message.innerText = "Rejestracja zakończona pomyślnie!";
        message.style.color = "green";
        regForm.reset(); 
        // Odznaczamy też checkbox pokazywania hasła po resecie
        togglePassword.checked = false;
        passwordInput.type = 'password';
        confirmPasswordInput.type = 'password';
    }
});

// Obsługa pokazywania formularza (bez zmian)
const showFormBtn = document.getElementById('show-form-btn');
const regContainer = document.getElementById('registration-container');

showFormBtn.addEventListener('click', () => {
    regContainer.style.display = 'block';
    showFormBtn.style.display = 'none';
});
