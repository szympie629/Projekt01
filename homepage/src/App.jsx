import React from 'react';
import { Music2, Activity, ShieldCheck } from 'lucide-react';
import './App.css';

function App() {
  return (
    <div className="container">
      <div className="portal-card">
        <div className="card-header">
          <div className="logo-box">
            <Music2 size={32} color="white" />
          </div>
          <h1>SynchroLab</h1>
          <p className="subtitle">SYSTEM ZARZĄDZANIA</p>
        </div>

        <div className="card-body">
          {/* Wychodzimy dwa razy w górę: z src, z homepage, do roota */}
          <a href="../../index.html?action=login" className="btn btn-primary">
            Zaloguj się do systemu
          </a>
          <a href="../../index.html?action=register" className="btn btn-secondary">
            Utwórz nowe konto
          </a>
        </div>

        <div className="card-footer">
          <div className="status-box">
            <Activity size={14} color="#22c55e" />
            <span>Status: Online</span>
          </div>
          <span>v1.0.4</span>
        </div>
      </div>

      <div className="page-footer">
        <div className="ssl-info">
          <ShieldCheck size={16} />
          <span>Połączenie szyfrowane SSL 256-bit</span>
        </div>
        <p>
          Problemy z dostępem? <br/>
          <a href="mailto:support@synchrolab.com">Skontaktuj się z administratorem IT</a>
        </p>
        <div className="copyright">&copy; 2024 SynchroLab Industries</div>
      </div>
    </div>
  );
}

export default App;
