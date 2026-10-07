import { useState } from 'react';
import { Layers, ShieldCheck, FileText, ChevronRight } from 'lucide-react';

export default function DispatchModule() {
  return (
    <div className="w-full space-y-6 font-sans pb-20 animate-fade-in">
      {/* Executive Header */}
      <div className="flex items-end justify-between pb-6 border-b-2 border-[var(--color-text-primary)]">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
            Auditoría de Despachos & Aforo
          </h1>
          <p className="text-sm font-mono text-[var(--color-text-secondary)] mt-1 uppercase tracking-wider">
            Consola Ejecutiva de Verificación Termodinámica
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-[var(--color-text-secondary)] uppercase">Estado de Red</div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            CONEXIÓN AGA-8 ESTABLE
          </div>
        </div>
      </div>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Data Entry & Profile (Auditor Input) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-none">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-6 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Registro de Manifiesto
            </h2>
            
            <div className="space-y-5">
              {/* Profile Selector */}
              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] block mb-1">Cromatografía</label>
                <select className="w-full bg-[var(--color-canvas)] border border-[var(--color-border)] p-2.5 text-sm font-bold focus:outline-none">
                  <option>Bonga-Mamey (Metano 96.36%)</option>
                  <option>Candilejas (Metano 99.16%)</option>
                </select>
              </div>

              {/* Topology */}
              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] block mb-1">Topología</label>
                <select className="w-full bg-[var(--color-canvas)] border border-[var(--color-border)] p-2.5 text-sm font-bold focus:outline-none">
                  <option>Batería / Rack 11 Cilindros</option>
                  <option>Batería / Rack 12 Cilindros</option>
                </select>
              </div>

              {/* Pressures Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] block mb-1">P₁ (Talón)</label>
                  <div className="flex items-baseline gap-1 border-b-2 border-slate-300 focus-within:border-[var(--color-text-primary)] pb-1 transition-colors">
                    <input type="number" defaultValue="50" className="w-full bg-transparent text-3xl font-serif font-bold focus:outline-none" />
                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">bar</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] block mb-1">P₂ (Corte)</label>
                  <div className="flex items-baseline gap-1 border-b-2 border-slate-300 focus-within:border-[var(--color-text-primary)] pb-1 transition-colors">
                    <input type="number" defaultValue="250" className="w-full bg-transparent text-3xl font-serif font-bold focus:outline-none" />
                    <span className="text-xs font-mono text-[var(--color-text-secondary)]">bar</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-8 bg-[var(--color-text-primary)] text-[var(--color-canvas)] py-4 text-xs font-bold uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
              Validar Aforo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Executive Validation & Digital Twin */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Top Panel: Certification Badge & Volume */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-none flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] block mb-4">Volumen Físico AGA-8</span>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-serif font-bold tracking-tighter text-[var(--color-text-primary)]">3,240.5</span>
                <span className="text-lg font-mono text-[var(--color-text-secondary)]">Sm³</span>
              </div>
              <div className="text-sm font-mono mt-4 pt-4 border-t border-[var(--color-border)] text-[var(--color-text-secondary)]">
                Masa: <strong className="text-[var(--color-text-primary)]">2,500.2 kg</strong>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-none flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold tracking-widest block mb-4">Dictamen de Certificación</span>
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-2">Aforo Aprobado</h3>
                <p className="text-sm text-emerald-800/80 leading-relaxed">
                  Estabilización térmica en frío calculada a <strong>234.5 bar</strong>. Cumple satisfactoriamente el umbral contractual de 230 bar.
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-200/50">
                  <span className="text-xs font-mono text-emerald-900">Constante: <strong>16.20 Sm³/bar</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Digital Twin Matrix */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-none">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                <Layers className="w-4 h-4" /> Gemelo Digital (Rack 11)
              </h2>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 text-slate-600">Lectura Simultánea</span>
            </div>
            
            {/* Simple Wireframe Matrix */}
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                <div key={i} className="border border-slate-200 p-3 bg-slate-50 text-center">
                  <span className="block text-[10px] font-mono text-slate-400 mb-1">POS-{i.toString().padStart(2, '0')}</span>
                  <span className="block text-sm font-bold text-slate-700">294.5 Sm³</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
