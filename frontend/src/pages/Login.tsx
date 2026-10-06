import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import GasFlame from '../components/GasFlame';
import { authService } from '../core/api/auth.service';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(username, password);
      login(response.token, response.user);
      navigate('/app/thermodynamics');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="mb-6">
            <GasFlame size={48} className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-serif mb-1 text-[var(--color-text-primary)]">GNV Manager</h1>
          <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--color-text-secondary)] mb-2">Ingeniería y Control</span>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Inicia sesión para acceder al sistema</p>
        </div>

        <div className="ui-card shadow-lg dark:shadow-black/40">
          {error && (
            <div className="mb-6 p-3 rounded-md bg-[var(--color-alert-red-bg)] border border-[var(--color-alert-red-border)] text-[var(--color-alert-red-text)] flex items-start gap-3 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 stroke-[1.5px]" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                ID de Operador
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="ui-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Contraseña
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ui-input"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 ui-button ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-[var(--color-text-secondary)] mt-8">
          Sistema Confidencial // División de Ingeniería
        </p>
      </div>
    </div>
  );
}
