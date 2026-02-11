import time
import random
from supabase import create_client

# DANE Z TWOJEGO PLIKU script.js
SUPABASE_URL = "https://zmwnvciqxsphttbcunxa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0" 

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Stan początkowy maszyny
machine_status = "PRODUKCJA"
total_pieces = 0
total_scrap = 0

print("🚀 Symulator maszyny uruchomiony. Wysyłam dane do Supabase...")
print("Wciśnij Ctrl+C, aby zatrzymać.")

try:
    while True:
        # 1. LOGIKA SYMULACJI (Co się dzieje na maszynie?)
        if machine_status == "PRODUKCJA":
            total_pieces += 1
            # 5% szans na brak (scrap)
            if random.random() < 0.05:
                total_scrap += 1
            
            # 3% szans na nagłą awarię
            if random.random() < 0.03:
                machine_status = "AWARIA"
                print("⚠️ AWARIA! Maszyna stanęła.")

        elif machine_status == "AWARIA":
            # Czekamy na reakcję serwisu (20% szans na rozpoczęcie naprawy)
            if random.random() < 0.2:
                machine_status = "NAPRAWA"
                print("🛠️ Serwisant przybył. Naprawiam...")

        elif machine_status == "NAPRAWA":
            # Naprawa trwa (30% szans na zakończenie sukcesem)
            if random.random() < 0.3:
                machine_status = "PRODUKCJA"
                print("✅ Naprawiono! Ruszamy z produkcją.")

        # 2. PRZYGOTOWANIE PACZKI DANYCH
        data = {
            "machine_id": "CNC-01",
            "status": machine_status,
            "pieces_total": total_pieces,
            "scrap_total": total_scrap,
            "error_code": "E-STOP_PRESSED" if machine_status == "AWARIA" else None
        }

        # 3. WYSYŁKA DO BAZY DANYCH
        try:
            supabase.table("machine_logs").insert(data).execute()
            print(f"[{time.strftime('%H:%M:%S')}] Status: {machine_status:10} | Suma: {total_pieces} szt.")
        except Exception as e:
            print(f"❌ Błąd połączenia z bazą: {e}")

        # Maszyna "pracuje" w cyklach 3-sekundowych
        time.sleep(3)

except KeyboardInterrupt:
    print("\n🛑 Produkcja zatrzymana (użytkownik).")