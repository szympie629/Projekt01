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