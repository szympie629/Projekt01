import time
import random
from datetime import datetime, timedelta
from supabase import create_client

# Konfiguracja Supabase
SUPABASE_URL = "https://zmwnvciqxsphttbcunxa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0"

MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"]

def run_batch_simulation():
    db_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"🚀 Start wsadowej symulacji: {datetime.now().strftime('%H:%M:%S')}")

    # Symulujemy ostatnie 30 minut (np. 10 wpisów na każdą maszynę co 3 minuty)
    steps = 10 
    time_gap = 3 # minuty między wpisami
    
    for step in range(steps):
        # Obliczamy wsteczną datę dla tego konkretnego kroku
        # Krok 0 to 30 min temu, krok 9 to "teraz"
        minutes_ago = (steps - step - 1) * time_gap
        simulated_time = (datetime.utcnow() - timedelta(minutes=minutes_ago)).isoformat()

        for m_id in MACHINES:
            # 1. Pobieramy ostatni stan, żeby nie zaczynać od zera sztuk
            try:
                res = db_client.table("machine_logs").select("*").eq("machine_id", m_id).order("created_at", desc=True).limit(1).execute()
                last_log = res.data[0] if res.data else {"pieces_total": 0, "scrap_total": 0, "status": "PRODUKCJA"}
                
                pieces = last_log['pieces_total'] + random.randint(5, 15) # Przyrost produkcji
                scrap = last_log['scrap_total'] + (1 if random.random() < 0.1 else 0)
                status = random.choices(["PRODUKCJA", "AWARIA", "NAPRAWA"], weights=[80, 10, 10])[0]
                
                error_code = None
                if status == "AWARIA": error_code = random.choice(["OVERHEAT", "E-STOP", "FEED_ERR"])

                # 2. Wysyłamy wpis z WYGENEROWANĄ DATĄ
                data = {
                    "machine_id": m_id,
                    "status": status,
                    "pieces_total": pieces,
                    "scrap_total": scrap,
                    "error_code": error_code,
                    "created_at": simulated_time # KLUCZOWE: Nadpisujemy systemowe now()
                }
                
                db_client.table("machine_logs").insert(data).execute()
                print(f"✅ {m_id} | {status} | T: {simulated_time}")
                
            except Exception as e:
                print(f"❌ Błąd dla {m_id}: {e}")

    print("🏁 Symulacja zakończona pomyślnie.")

if __name__ == "__main__":
    run_batch_simulation()
