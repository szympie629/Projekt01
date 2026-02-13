import time
import random
from supabase import create_client

# Dane dostępowe (pobrane z Twojego pliku config.js)
SUPABASE_URL = "https://zmwnvciqxsphttbcunxa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0"

MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"]

def start_continuous_simulation():
    db = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("🚀 Symulator SynchroLab uruchomiony w trybie ciągłym...")

    while True:
        for m_id in MACHINES:
            try:
                # 1. SYNCHRONIZACJA: Sprawdzamy co ostatnio wpisał CZŁOWIEK w aplikacji
                res = db.table("machine_logs").select("*").eq("machine_id", m_id).order("created_at", desc=True).limit(1).execute()
                
                if res.data:
                    last_log = res.data[0]
                    current_status = last_log['status']
                    pieces = last_log['pieces_total']
                    scrap = last_log['scrap_total']
                else:
                    current_status, pieces, scrap = "PRODUKCJA", 0, 0

                # 2. LOGIKA REAKCJI: Jeśli maszyna jest w naprawie, nie losujemy jej statusu
                error_code = None
                if current_status == "PRODUKCJA":
                    pieces += random.randint(1, 3)
                    if random.random() < 0.05: scrap += 1
                    # Szansa na awarię
                    if random.random() < 0.01: 
                        current_status = "AWARIA"
                        error_code = "ERR_SENSOR"
                
                elif current_status == "AWARIA":
                    error_code = "WAITING_FOR_SERVICE"
                
                elif current_status == "NAPRAWA":
                    error_code = "SERVICE_IN_PROGRESS"

                # 3. WYSYŁKA: Używamy domyślnego czasu bazy (brak created_at w dict)
                db.table("machine_logs").insert({
                    "machine_id": m_id,
                    "status": current_status,
                    "pieces_total": pieces,
                    "scrap_total": scrap,
                    "error_code": error_code
                }).execute()

            except Exception as e:
                print(f"⚠️ Błąd połączenia dla {m_id}: {e}")
        
        # Czekamy 10 sekund przed kolejną pętlą (oszczędność transferu)
        time.sleep(10)

if __name__ == "__main__":
    start_continuous_simulation()
