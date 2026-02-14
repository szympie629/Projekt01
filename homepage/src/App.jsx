import React, { useState } from 'react';
import { Settings, Activity, ArrowRight, Lock, User, Factory } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// 1. Inicjalizacja bazy danych (Twoje dane z config.js)
const supabaseUrl = 'https://zmwnvciqxsphttbcunxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd252Y2lxeHNwaHR0YmN1bnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMzI1MTEsImV4cCI6MjA4NTcwODUxMX0.r-G2ErhDltI6gykt4TrSsndWuEONUNaQCu4mh88dAm0';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [view, setView] = useState('landing');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 2. FUNKCJA LOGOWANIA
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const username = e.target[0].value;
    const password = e.target[1].value;

    // Zapytanie do Twojej tabeli users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      setErrorMsg("BŁĄD: NIEPRAWIDŁOWY KLUCZ LUB LOGIN");
      setLoading(false);
    } else {
      // 1. Zapis sesji dla starych skryptów JS
      sessionStorage.setItem('user_role', data.role);
      sessionStorage.setItem('user_name', `${data.first_name} ${data.last_name}`);
      

      // 2. INTELIGENTNE PRZEKIEROWANIE
      // Teraz pliki są w folderze public, więc serwer widzi je od razu
      const role = data.role.toLowerCase();
      
      if (role === 'admin') {
          window.location.href = '/pages/admin.html';
      } else if (role === 'operator') {
          window.location.href = '/pages/operator.html';
      } else if (role === 'manager') {
          window.location.href = '/pages/manager.html';
      } else if (role === 'maintenance') {
          window.location.href = '/pages/maintenance.html';
      } else {
          window.location.href = '/index.html';
      }
    }
  };

  if (view === 'login') {
    return (
      <div className="terminal-page">
        <div className="terminal-box">
          <div className="terminal-body">
            <div className="auth-brand">
              <Settings className="spin-icon" size={40} color="#3b82f6" />
              <h1 style={{color: 'white'}}>SynchroLab <span className="version">v2.1.0</span></h1>
            </div>

            <p className="terminal-text">
              {loading ? '&gt; PROCESOWANIE AUTORYZACJI...' : '&gt; WYMAGANA AUTORYZACJA OPERATORA...'}
            </p>

            {errorMsg && <p style={{color: '#ff4444', fontSize: '12px', textAlign: 'center', marginBottom: '10px'}}>{errorMsg}</p>}

            <form className="terminal-form" onSubmit={handleLogin}>
              <div className="terminal-input">
                <User size={18} />
                <input type="text" placeholder="Identyfikator (Login)" required disabled={loading} />
              </div>
              <div className="terminal-input">
                <Lock size={18} />
                <input type="password" placeholder="Klucz dostępu (Hasło)" required disabled={loading} />
              </div>
              
              <button type="submit" className="terminal-btn" disabled={loading}>
                {loading ? 'AUTORYZACJA...' : 'UWIERZYTELNIJ'} <ArrowRight size={18} />
              </button>
            </form>

            <button onClick={() => setView('landing')} className="text-link" style={{marginTop: '20px', width: '100%'}}>
              ANULUJ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="industrial-landing">
      <header className="nav-blur">
        <div className="nav-container">
          <div className="logo-group">
            <Factory color="#3b82f6" />
            <span>SYNCHROLAB <small>INDUSTRIES</small></span>
          </div>
          <div className="system-status">
            <Activity size={16} color="#22c55e" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      <main className="hero-section">
        <div className="hero-content">
          <div className="badge">SYSTEM KLASY MES / SCADA</div>
          <h1>Zintegrowany System <br/><span>Zarządzania Produkcją</span></h1>
          <p>Monitoruj wydajność OEE i zarządzaj awariami w czasie rzeczywistym.</p>
          <div className="hero-btns">
            <button className="btn-main" onClick={() => setView('login')}>
              WEJDŹ DO SYSTEMU <ArrowRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;