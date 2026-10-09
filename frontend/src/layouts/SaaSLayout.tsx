import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings, LogOut, Menu, X, Sun, Moon, Database, Box } from 'lucide-react';
import GasFlame from '../components/GasFlame';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function SaaSLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/app/home', label: 'Inicio', icon: LayoutDashboard },
    { path: '/app/thermodynamics', label: 'Consola de Despacho', icon: BarChart3 },
    { path: '/app/gas-profiles', label: 'Fuentes de Gas', icon: Database },
    { path: '/app/storage-modules', label: 'Almacenamientos', icon: Box },
  ];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--color-canvas)] font-sans">
      
      {/* 1. Header & Navbar Superior */}
      <header className="h-16 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-8 flex items-center justify-between gap-3 z-30">
        
        {/* Izquierda: Identidad de Marca */}
        <Link to="/app/home" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
          <GasFlame size={24} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-sans font-bold tracking-tight text-[var(--color-text-primary)]">
                GNV Manager
              </span>
              <span className="inline-block max-md:hidden text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded-xs bg-[var(--color-canvas)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                beta 0.2
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-[var(--color-text-secondary)] uppercase">
              Ingeniería y Control
            </span>
          </div>
        </Link>

        {/* Centro: Navegación Principal Horizontal (Visible en desktop) */}
        <nav className="flex max-md:hidden items-center gap-1 py-1">
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
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border-[var(--color-accent-border)] shadow-2xs' 
                    : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 stroke-[1.8px] ${isActive ? 'text-[var(--color-accent)]' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Derecha: Acciones, Perfil y Menú Móvil */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

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

          <div className="h-4 w-px bg-[var(--color-border)] max-sm:hidden" />

          {/* Tarjeta de Usuario Compacta */}
          <div className="flex items-center gap-2 pl-0.5 sm:pl-1">
            <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center font-bold text-xs uppercase">
              {(user?.fullName || user?.username || 'U').charAt(0)}
            </div>
            <div className="flex max-sm:hidden flex-col text-left max-w-[120px] lg:max-w-[180px]">
              <p className="text-xs font-semibold leading-tight text-[var(--color-text-primary)] truncate" title={user?.fullName || user?.username}>
                {user?.fullName || user?.username}
              </p>
              <p className="text-[10px] text-[var(--color-text-secondary)] leading-tight">
                {user?.role === 'admin' ? 'Administrador' : 'Operador'}
              </p>
            </div>
            <button
              onClick={logout}
              className="max-sm:hidden p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 stroke-[1.8px]" />
            </button>
          </div>

          {/* Botón Hamburguesa con animación de rotación suave */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all duration-300 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="block transform transition-transform duration-300">
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </span>
          </button>

        </div>

      </header>

      {/* Menú Desplegable Móvil con animación suave anim-drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 space-y-4 z-20 shadow-lg anim-drawer">
          <div className="pb-3 border-b border-[var(--color-border)]">
            <p className="text-xs font-bold text-[var(--color-text-primary)]">
              {user?.fullName || user?.username}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {user?.role === 'admin' ? 'Administrador del Sistema' : 'Operador'}
            </p>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all border
                    ${isActive 
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border-[var(--color-accent-border)] shadow-2xs' 
                      : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 stroke-[1.8px] ${isActive ? 'text-[var(--color-accent)]' : ''}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-[var(--color-alert-red-text)] bg-[var(--color-alert-red-bg)] border border-[var(--color-alert-red-border)] cursor-pointer"
            >
              <LogOut className="w-4 h-4 stroke-[1.8px]" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Área de Contenido Principal (100% Widescreen Adaptable) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6 px-3 sm:px-6 lg:px-8 relative animate-in fade-in duration-300">
        <div className="w-full max-w-[1700px] mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
