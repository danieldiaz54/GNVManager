import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import SaaSLayout from './layouts/SaaSLayout';
import ThermodynamicsModule from './pages/ThermodynamicsModule';
import GasProfilesModule from './pages/GasProfilesModule';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <SaaSLayout />
                </ProtectedRoute>
              } 
            >
              <Route path="thermodynamics" element={<ThermodynamicsModule />} />
              <Route path="gas-profiles" element={<GasProfilesModule />} />
              <Route index element={<Navigate to="thermodynamics" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/app/thermodynamics" replace />} />
            <Route path="/dashboard" element={<Navigate to="/app/thermodynamics" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
