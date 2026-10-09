import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Database, Box } from 'lucide-react';
import { thermodynamicsService } from '../core/api/thermodynamic.service';
import { StorageService } from '../core/api/storage.service';
import { useAuth } from '../context/AuthContext';

export default function HomeModule() {
  const [profileCount, setProfileCount] = useState<number>(0);
  const [storageCount, setStorageCount] = useState<number>(0);
  const { user } = useAuth();
  
  useEffect(() => {
    thermodynamicsService.getGasProfiles()
      .then(res => setProfileCount(res.length))
      .catch(() => setProfileCount(0));

    StorageService.getModules()
      .then(res => setStorageCount(res.length))
      .catch(() => setStorageCount(0));
  }, []);

  const timeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in py-4 sm:py-8 px-2 sm:px-4 font-sans">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 sm:pb-6 border-b border-[var(--color-border)] gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-[var(--color-text-primary)] tracking-tight">
            {timeGreeting()}, {user?.fullName || (user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1).replace('_', ' ') : 'Operador')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-mono mt-1 sm:mt-2">
            Panel principal de GNV Manager · Ingeniería y Control
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm text-[var(--color-text-secondary)] self-start sm:self-auto">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sistema en Línea
        </div>
      </div>

      {/* Grid Bento Principal Adaptable: 1 col móvil, 2 cols tablet, 3 cols desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 anim-slide-up">
        
        {/* Módulo 1: Consola de Despacho */}
        <Link 
          to="/app/thermodynamics"
          className="group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] card-interactive p-6 sm:p-8 rounded-lg flex flex-col justify-between min-h-[220px] transition-all shadow-none"
        >
          <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
            <LayoutDashboard className="w-40 h-40" />
          </div>
          
          <div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[var(--color-accent)] text-white mb-4 transition-transform group-hover:scale-105 shadow-xs">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-sans font-semibold text-[var(--color-text-primary)] mb-2">
              Consola de Despacho
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Cálculos de aforo, control de inventario y estimaciones de despacho en tiempo real.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
            Abrir Consola <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        {/* Módulo 2: Almacenamientos */}
        <Link 
          to="/app/storage-modules"
          className="group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] card-interactive p-6 sm:p-8 rounded-lg flex flex-col justify-between min-h-[220px] transition-all shadow-none"
        >
          <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
            <Box className="w-40 h-40" />
          </div>

          <div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] mb-4 transition-transform group-hover:scale-105">
              <Box className="w-5 h-5 stroke-[1.8px]" />
            </div>
            <h2 className="text-xl font-sans font-semibold text-[var(--color-text-primary)] mb-2">
              Almacenamientos
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Cascadas estacionarias de planta y módulos de transporte por carretera.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-mono">Equipos Activos</span>
              <span className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">{storageCount}</span>
            </div>
            <div className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
              <span className="text-lg leading-none transform -translate-y-px">→</span>
            </div>
          </div>
        </Link>

        {/* Módulo 3: Fuentes de Gas */}
        <Link 
          to="/app/gas-profiles"
          className="group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] card-interactive p-6 sm:p-8 rounded-lg flex flex-col justify-between min-h-[220px] transition-all shadow-none md:col-span-2 lg:col-span-1"
        >
          <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
            <Database className="w-40 h-40" />
          </div>

          <div>
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-[var(--color-accent)] mb-4 transition-transform group-hover:scale-105">
              <Database className="w-5 h-5 stroke-[1.8px]" />
            </div>
            <h2 className="text-xl font-sans font-semibold text-[var(--color-text-primary)] mb-2">
              Fuentes de Gas
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Catálogo de puntos de inyección y reportes cromatográficos oficiales.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider font-mono">Fuentes Activas</span>
              <span className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">{profileCount}</span>
            </div>
            <div className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
              <span className="text-lg leading-none transform -translate-y-px">→</span>
            </div>
          </div>
        </Link>

      </div>


    </div>
  );
}
