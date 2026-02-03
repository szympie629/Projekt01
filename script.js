// Dane do połączenia z Twoim projektem Supabase
const supabaseUrl = 'https://zmwnvciqxphttbcunxa.supabase.co';
const supabaseKey = 'sb_publishable_3F-Hr9mWKyPrwiD7-fzw0A_r3SeGW2v';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

const regForm = document.getElementById('registration-form');
const message = document.getElementById('message');

// Obsługa wysyłania formularza
regForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Powstrzymujemy odświeżenie strony

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Wysyłamy dane do tabeli 'users'
    const { data, error } = await _supabase
        .from('users')
        .insert([{ username: user, password: pass }]);

    if (error) {
        message.innerText = "Rejestracja nie powiodła się: " + error.message;
        message.style.color = "red";
        // To jest giga extra komnentarz
    } else {
        message.innerText = "Rejestracja zakończona pomyślnie!";
        message.style.color = "green";
        regForm.reset(); // Czyścimy pola formularza
    }
});

// Znajdujemy przycisk i kontener formularza w dokumencie
const showFormBtn = document.getElementById('show-form-btn');
const regContainer = document.getElementById('registration-container');

// Dodajemy reakcję na kliknięcie w przycisk
showFormBtn.addEventListener('click', () => {
    // Zmieniamy styl, aby formularz stał się widoczny
    regContainer.style.display = 'block';
    // Ukrywamy przycisk "Rejestracja", skoro formularz już jest na wierzchu
    showFormBtn.style.display = 'none';
});