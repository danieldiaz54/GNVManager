import { useState } from 'react';
import { StationConsole, ReconciliationLedgerPanel } from './components';

export default function App() {
  const [activeTab, setActiveTab] = useState<'STATION_MANIFOLD' | 'RECONCILIATION_LEDGER'>('STATION_MANIFOLD');

  return (
    <div className="min-h-screen bg-industrial-950 text-slate-100 flex flex-col font-sans">
      {/* Header Institucional de Alto Impacto Industrial */}
      <header className="border-b border-industrial-800 bg-industrial-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></div>
          <div className="flex items-baseline space-x-2">
            <h1 className="text-base font-bold tracking-wider uppercase font-mono text-slate-100">GNVManager</h1>
            <span className="text-[11px] font-mono text-industrial-400">Terminal Operativo de Patio</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-industrial-800 text-industrial-300 font-mono border border-industrial-700">
            Hito 1 · Piloto Sabanas
          </span>
        </div>

        {/* Selector de Vistas de Operación */}
        <div className="flex bg-industrial-950 p-1 rounded border border-industrial-800 space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('STATION_MANIFOLD')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'STATION_MANIFOLD'
                ? 'bg-industrial-800 text-slate-100 font-semibold shadow-inner'
                : 'text-industrial-400 hover:text-slate-200'
            }`}
          >
            Terminal de Manifold & Aforo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RECONCILIATION_LEDGER')}
            className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
              activeTab === 'RECONCILIATION_LEDGER'
                ? 'bg-industrial-800 text-slate-100 font-semibold shadow-inner'
                : 'text-industrial-400 hover:text-slate-200'
            }`}
          >
            Libro Mayor & Mermas (Ledger)
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-6 text-xs font-mono">
          <div className="flex items-center space-x-2 text-industrial-400">
            <span>MOTOR TERMODINÁMICO:</span>
            <span className="text-emerald-400 font-semibold">AGA-8 / DAK (NR)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">ONLINE</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'STATION_MANIFOLD' ? (
          <StationConsole />
        ) : (
          <ReconciliationLedgerPanel />
        )}
      </main>

      {/* Footer Técnico */}
      <footer className="border-t border-industrial-800 bg-industrial-950 px-6 py-3 text-[11px] font-mono text-industrial-500 flex flex-wrap justify-between items-center">
        <span>GNVManager Industrial Platform · Custodia de Gas Real a Alta Presión</span>
        <span>Norma de Aforo: P_estabilizada ≥ 230.00 bar · ISO 6976 / AGA-8 · SHA-256 Ledger</span>
      </footer>
    </div>
  );
}
