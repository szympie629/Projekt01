// js/core/config.js

const CONFIG = {
    supabaseUrl: 'https://zmwnvciqxsphttbcunxa.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0'
};

// Inicjalizacja klienta Supabase i przypisanie do obiektu globalnego window,
// aby był dostępny w innych skryptach jako "_supabase".
if (typeof supabase !== 'undefined') {
    window._supabase = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    console.log("Supabase Client initialized from config.js");
} else {
    console.error("Biblioteka Supabase nie została załadowana przed config.js!");
}