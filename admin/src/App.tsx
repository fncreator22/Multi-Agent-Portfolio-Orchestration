import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { LeadsDashboard } from './pages/LeadsDashboard';
import { KBEditor } from './pages/KBEditor';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <LeadsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kb"
        element={
          <ProtectedRoute>
            <KBEditor />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/leads" replace />} />
      <Route path="*" element={<Navigate to="/leads" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
