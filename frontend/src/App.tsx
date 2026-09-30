import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-industrial-950 text-slate-100 flex flex-col">
      <header className="border-b border-industrial-800 bg-industrial-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
          <h1 className="text-lg font-bold tracking-wider uppercase font-mono">GNVManager</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-industrial-800 text-industrial-400 font-mono">Hito 1 - Sabanas</span>
        </div>
        <div className="text-xs text-industrial-400 font-mono">
          Piso Operacional: &ge; 230.00 bar
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-industrial-900/40 border border-industrial-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-industrial-300 font-mono uppercase tracking-wider mb-2">Motor Termodinámico</h2>
            <p className="text-xs text-industrial-400">AGA-8 / Dranchuk-Abu-Kassem iterado vía Newton-Raphson. Cromatografía activa: Bonga-Mamey (96.37% CH4).</p>
          </div>
          <div className="bg-industrial-900/40 border border-industrial-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-industrial-300 font-mono uppercase tracking-wider mb-2">Topología de Racks</h2>
            <p className="text-xs text-industrial-400">Baterías de 11 cilindros (13,497 L) y 12 cilindros (26,950 L). Control de aforo y presiones.</p>
          </div>
          <div className="bg-industrial-900/40 border border-industrial-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-industrial-300 font-mono uppercase tracking-wider mb-2">Reconciliation Ledger</h2>
            <p className="text-xs text-industrial-400">Auditoría inmutable ACID de balance energético en MMBTU y volumen estándar Sm3.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
