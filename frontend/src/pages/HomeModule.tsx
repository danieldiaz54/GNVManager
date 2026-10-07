import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, TrendingUp, AlertTriangle, Layers, Droplets } from 'lucide-react';
import { thermodynamicsService } from '../core/api/thermodynamic.service';

export default function HomeModule() {
  const [profileCount, setProfileCount] = useState<number>(0);
  
  useEffect(() => {
    thermodynamicsService.getGasProfiles()
      .then(res => setProfileCount(res.length))
      .catch(() => setProfileCount(0));
  }, []);

  const timeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in py-8 px-4">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[var(--color-border)] gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
            {timeGreeting()}, Operador
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-mono mt-2">
            Panel principal de GNV Manager · Ingeniería y Control
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm text-[var(--color-text-secondary)]">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sistema en Línea
        </div>
      </div>

      {/* Grid Bento Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Módulo: Consola de Despacho (Destacado) */}
        <Link 
          to="/app/thermodynamics"
          className="md:col-span-2 group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-text-primary)] transition-colors p-8 rounded-md flex flex-col justify-between min-h-[240px]"
        >
          <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
            <LayoutDashboard className="w-48 h-48" />
          </div>
          
          <div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[var(--color-text-primary)] text-[var(--color-canvas)] mb-4">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[var(--color-text-primary)] mb-2">
              Consola de Despacho
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
              Ingresa al motor termodinámico central para el cálculo de aforos, transferencia de custodia y simulación de compresión AGA-8 en tiempo real.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
            Acceder al Motor <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* Módulo: Perfiles Cromatográficos */}
        <Link 
          to="/app/gas-profiles"
          className="group bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-text-secondary)] transition-colors p-8 rounded-md flex flex-col justify-between min-h-[240px]"
        >
          <div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] mb-4">
              <Database className="w-5 h-5 stroke-[1.5px]" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)] mb-2">
              Libro de Cromatografías
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Gestión de composiciones de gas (C1-C6+), propiedades físicas e inertes.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">Perfiles Activos</span>
              <span className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">{profileCount}</span>
            </div>
            <div className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-text-primary)] group-hover:text-[var(--color-canvas)] transition-colors">
              <span className="text-lg leading-none transform -translate-y-px">→</span>
            </div>
          </div>
        </Link>

      </div>

      {/* Grid Secundario (Métricas e Información Rápida) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-text-secondary)]">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Estabilidad Térmica</span>
          </div>
          <span className="text-xl font-mono font-bold text-[var(--color-text-primary)]">Nominal</span>
          <span className="text-xs text-[var(--color-alert-green-text)] mt-1 font-medium">Operación a 250 bar óptima</span>
        </div>

        <div className="p-5 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-text-secondary)]">
            <Layers className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Topología de Rack</span>
          </div>
          <span className="text-xl font-mono font-bold text-[var(--color-text-primary)]">Flexible</span>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">Soporte dinámico 11/12 pos.</span>
        </div>

        <div className="p-5 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-text-secondary)]">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Algoritmo Newton-Raphson</span>
          </div>
          <span className="text-xl font-mono font-bold text-[var(--color-text-primary)]">Convergente</span>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">Precisión Factor Z validada</span>
        </div>

        <div className="p-5 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-text-secondary)]">
            <Droplets className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Certificación de Aforo</span>
          </div>
          <span className="text-xl font-mono font-bold text-[var(--color-text-primary)]">Activa</span>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium">Umbral dinámico a 230 bar</span>
        </div>

      </div>

    </div>
  );
}
