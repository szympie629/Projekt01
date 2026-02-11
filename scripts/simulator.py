import time
import random
import threading
from supabase import create_client

# Konfiguracja Supabase (Twoje dane)
SUPABASE_URL = "https://zmwnvciqxsphttbcunxa.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0"

# Inicjalizacja klienta (jedna instancja dla wszystkich wątków)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Lista maszyn do symulacji
MACHINES = ["CNC-01", "CNC-02", "CNC-03", "CNC-04", "CNC-05", "CNC-06"]

class MachineSimulator(threading.Thread):
    def __init__(self, machine_id):
        super().__init__()
        self.machine_id = machine_id
        self.status = "PRODUKCJA"
        self.pieces = 0
        self.scrap = 0
        self.running = True

    def run(self):
        print(f"🟢 Uruchamiam symulację dla: {self.machine_id}")
        
        while self.running:
            # 1. LOGIKA SYMULACJI
            if self.status == "PRODUKCJA":
                self.pieces += 1
                
                # 5% szans na brak
                if random.random() < 0.05:
                    self.scrap += 1
                
                # 2% szans na awarię (trochę rzadziej niż wcześniej, żeby nie wszystkie stały naraz)
                if random.random() < 0.02:
                    self.status = "AWARIA"
                    print(f"⚠️  {self.machine_id}: AWARIA!")

            elif self.status == "AWARIA":
                # 20% szans na reakcję serwisu
                if random.random() < 0.2:
                    self.status = "NAPRAWA"
                    print(f"🛠️  {self.machine_id}: Serwis naprawia...")

            elif self.status == "NAPRAWA":
                # 30% szans na naprawienie
                if random.random() < 0.3:
                    self.status = "PRODUKCJA"
                    print(f"✅  {self.machine_id}: Powrót do pracy.")

            # 2. PRZYGOTOWANIE DANYCH
            data = {
                "machine_id": self.machine_id,
                "status": self.status,
                "pieces_total": self.pieces,
                "scrap_total": self.scrap,
                "error_code": "E-STOP" if self.status == "AWARIA" else None
            }

            # 3. WYSYŁKA DO BAZY
            try:
                supabase.table("machine_logs").insert(data).execute()
                # Logowanie w konsoli (tylko co jakiś czas lub przy zmianie statusu, żeby nie zaśmiecać)
                # print(f"[{self.machine_id}] {self.status} | {self.pieces} szt.") 
            except Exception as e:
                print(f"❌ Błąd wysyłki {self.machine_id}: {e}")

            # Symulacja cyklu (losowy czas 3-5 sekund, żeby maszyny nie szły idealnie równo)
            time.sleep(random.uniform(3.0, 5.0))

# --- GŁÓWNA PĘTLA URUCHAMIAJĄCA ---

if __name__ == "__main__":
    print(f"🚀 Start symulatora dla {len(MACHINES)} maszyn...")
    print("Wciśnij Ctrl+C aby zatrzymać wszystkie.")

    threads = []
    
    # Tworzenie i startowanie wątków
    for m_id in MACHINES:
        sim = MachineSimulator(m_id)
        sim.daemon = True # Wątki zakończą się, gdy zamkniemy główny proces
        sim.start()
        threads.append(sim)
        time.sleep(0.5) # Krótka przerwa przy rozruchu

    try:
        while True:
            time.sleep(1) # Główny proces tylko czuwa
    except KeyboardInterrupt:
        print("\n🛑 Zatrzymywanie symulacji...")