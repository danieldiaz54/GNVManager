import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import SaaSLayout from './layouts/SaaSLayout';
import ThermodynamicsModule from './pages/ThermodynamicsModule';
import GasProfilesModule from './pages/GasProfilesModule';
import StorageModulesModule from './pages/StorageModulesModule';

import HomeModule from './pages/HomeModule';

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
              <Route path="home" element={<HomeModule />} />
              <Route path="thermodynamics" element={<ThermodynamicsModule />} />
              <Route path="gas-profiles" element={<GasProfilesModule />} />
              <Route path="storage-modules" element={<StorageModulesModule />} />
              <Route index element={<Navigate to="home" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/app/home" replace />} />
            <Route path="/dashboard" element={<Navigate to="/app/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
