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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const routeNames: Record<string, string> = {
    '/app/thermodynamics': 'Motor Térmico',
    '/app/reports': 'Reportes de Auditoría',
    '/app/settings': 'Configuración'
  };

  const menuItems = [
    { path: '/app/thermodynamics', label: 'Motor Térmico', icon: LayoutDashboard },
    { path: '/app/reports', label: 'Reportes', icon: BarChart3 },
    { path: '/app/settings', label: 'Configuración', icon: Settings },
  ];

  const activeMenu = menuItems.find(item => location.pathname.startsWith(item.path));

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent font-sans">
      
      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static z-50 h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
      `}>
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-[var(--color-border)] mb-4">
          <GasFlame size={28} />
          <div>
            <h1 className="text-xl font-serif font-bold tracking-tight leading-none text-[var(--color-text-primary)]">GNV Manager</h1>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-text-secondary)]">Ingeniería y Control</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)] mb-4">Espacio de Trabajo</p>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium border border-transparent
                  ${isActive 
                    ? 'bg-[var(--color-accent-glow)] text-[var(--color-accent)] border-[var(--color-accent)]/30' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <Icon className="w-5 h-5 stroke-[1.5px]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card Area */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-canvas)]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-hover)] text-[var(--color-text-primary)] flex items-center justify-center font-bold text-sm uppercase">
              {user?.username.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors border border-transparent hover:border-[var(--color-border-hover)]"
          >
            <LogOut className="w-4 h-4 stroke-[1.5px]" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5 stroke-[1.5px]" />
            </button>
            <h2 className="text-lg font-serif tracking-tight">{activeMenu?.label || 'GNV Manager'}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
              title="Alternar Tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 stroke-[1.5px]" />
              ) : (
                <Moon className="w-4 h-4 stroke-[1.5px]" />
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[var(--color-text-secondary)] font-medium text-[11px] tracking-wider uppercase">Motor AGA-8 • En Vivo</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 relative animate-in fade-in duration-500">
          <div className="max-w-[1400px] mx-auto w-full h-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
