import time
import random
import threading
from supabase import create_client

# Konfiguracja Supabase
SUPABASE_URL = "https://zmwnvciqxsphttbcunxa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0"

MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"]

class MachineSimulator(threading.Thread):
    def __init__(self, machine_id):
        super().__init__()
        self.machine_id = machine_id
        self.pieces = 0
        self.scrap = 0
        self.status = "PRODUKCJA" 
        self.running = True
        
        # POPRAWKA: Każdy wątek ma SWOJEGO WŁASNEGO klienta.
        # Dzięki temu awaria połączenia w jednym wątku nie zabija innych.
        self.db_client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def sync_with_db(self):
        """Pobiera ostatni znany stan maszyny z bazy."""
        try:
            # Używamy self.db_client zamiast globalnego supabase
            response = self.db_client.table("machine_logs") \
                .select("*") \
                .eq("machine_id", self.machine_id) \
                .order("created_at", desc=True) \
                .limit(1) \
                .execute()
            
            if response.data and len(response.data) > 0:
                last_log = response.data[0]
                self.status = last_log['status']
                self.pieces = last_log['pieces_total']
                self.scrap = last_log['scrap_total']
                return True
        except Exception as e:
            # Wypisujemy błąd, ale nie przerywamy pętli
            # print(f"⚠️ {self.machine_id}: Sync error (to normalne przy starcie): {e}")
            return False

    def run(self):
        print(f"🟢 {self.machine_id}: Start symulacji...")
        
        while self.running:
            # 1. SYNCHRONIZACJA
            self.sync_with_db()

            current_error_code = None

            # 2. LOGIKA
            if self.status == "PRODUKCJA":
                self.pieces += 1
                if random.random() < 0.05: self.scrap += 1
                
                if random.random() < 0.02:
                    self.status = "AWARIA"
                    current_error_code = random.choice(["E-STOP", "PRZEGRZANIE", "BRAK MATERIAŁU"])
                    print(f"🔥 {self.machine_id}: AWARIA ({current_error_code})!")

            elif self.status == "AWARIA":
                current_error_code = "WYMAGA SERWISU"

            elif self.status == "NAPRAWA":
                current_error_code = "SERWIS W TOKU"
                
            elif self.status == "WYLACZONA":
                current_error_code = "POSTÓJ PLANOWANY"

            # 3. WYSYŁKA
            data = {
                "machine_id": self.machine_id,
                "status": self.status,
                "pieces_total": self.pieces,
                "scrap_total": self.scrap,
                "error_code": current_error_code
            }

            try:
                # Używamy self.db_client
                self.db_client.table("machine_logs").insert(data).execute()
            except Exception as e:
                # Jeśli zerwie połączenie, po prostu spróbujemy za 3 sekundy, nie panikujemy.
                print(f"⚠️ {self.machine_id}: Nie udało się wysłać logu (reconnecting...)")

            time.sleep(random.uniform(3.0, 6.0))

if __name__ == "__main__":
    print("🚀 Uruchamianie Stabilnego Symulatora...")
    threads = []
    for m_id in MACHINES:
        sim = MachineSimulator(m_id)
        sim.daemon = True
        sim.start()
        threads.append(sim)
        time.sleep(0.5)

    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Zatrzymano.")