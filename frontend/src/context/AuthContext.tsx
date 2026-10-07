import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, setupAxiosInterceptors } from '../core/api/auth.service';

interface User {
  id?: string;
  username: string;
  fullName?: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar Axios de forma global una sola vez
    setupAxiosInterceptors();

    // Comprobar estado inicial
    const token = authService.getToken();
    const currentUser = authService.getUser() as User | null;
    
    if (token && currentUser) {
      setIsAuthenticated(true);
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] text-[var(--color-text-primary)] text-xl font-serif">Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
