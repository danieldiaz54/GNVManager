import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings, LogOut, Menu, Sun, Moon } from 'lucide-react';
import GasFlame from '../components/GasFlame';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function SaaSLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const menuItems = [
    { path: '/app/thermodynamics', label: 'Consola de Despacho', icon: LayoutDashboard },
    { path: '/app/reports', label: 'Reportes & Auditoría', icon: BarChart3 },
    { path: '/app/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--color-canvas)] font-sans">
      
      {/* 1. Header & Navbar Superior Unificada (100% Ancho Horizontal) */}
      <header className="h-16 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-8 flex items-center justify-between gap-4 z-30">
        
        {/* Izquierda: Identidad de Marca */}
        <div className="flex items-center gap-3 shrink-0">
          <GasFlame size={26} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-serif font-bold tracking-tight text-[var(--color-text-primary)]">
                GNV Manager
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-xs bg-[var(--color-canvas)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                v2.0 PRO
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-wider text-[var(--color-text-secondary)] uppercase">
              Surtigas Piloto Sabanas
            </span>
          </div>
        </div>

        {/* Centro: Navegación Principal Horizontal */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap border
                  ${isActive 
                    ? 'bg-[var(--color-canvas)] text-[var(--color-text-primary)] font-bold border-[var(--color-border)] shadow-xs' 
                    : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }
                `}
              >
                <Icon className="w-4 h-4 stroke-[1.8px]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Derecha: Indicador de Motor, Tema y Perfil de Usuario */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Badge de Telemetría Térmica En Vivo */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[var(--color-text-secondary)] font-medium">AGA-8 / DAK</span>
          </div>

          {/* Toggle Modo Oscuro / Claro */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            title="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 stroke-[1.8px]" />
            ) : (
              <Moon className="w-4 h-4 stroke-[1.8px]" />
            )}
          </button>

          <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />

          {/* Tarjeta de Usuario Compacta */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-7 h-7 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center font-bold text-xs uppercase">
              {user?.username?.charAt(0) || 'G'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold leading-tight text-[var(--color-text-primary)]">{user?.username}</p>
              <p className="text-[10px] text-[var(--color-text-secondary)] leading-tight">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 stroke-[1.8px]" />
            </button>
          </div>

        </div>

      </header>

      {/* 2. Área de Contenido Principal (100% Widescreen) */}
      <main className="flex-1 overflow-auto py-6 px-4 sm:px-8 lg:px-12 relative animate-in fade-in duration-300">
        <div className="w-full max-w-[1700px] mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
