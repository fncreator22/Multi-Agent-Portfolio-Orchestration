import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { LeadsDashboard } from './pages/LeadsDashboard';
import { KBEditor } from './pages/KBEditor';
import { DigestHistory } from './pages/DigestHistory';
import { Users, Database, Activity, ExternalLink, LogOut, Lock } from 'lucide-react';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, adminEmail, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-display flex flex-col">
      {/* Unified Top Admin Header / Navbar */}
      <header className="sticky top-0 z-50 bg-panel backdrop-blur-md shadow-soft border-b border-accent-primary/20 rounded-b-xl px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold font-mono text-accent-primary inline-flex items-center gap-2">
            <Lock className="w-5 h-5" /> Admin Portal
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono">
            {adminEmail || 'authenticated'}
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-2 md:gap-4">
          <Link
            to="/leads"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isActive('/leads')
                ? 'text-accent-primary bg-accent-primary/10 border border-accent-primary/30 shadow-sm'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" /> Leads & Bookings
          </Link>
          <Link
            to="/kb"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isActive('/kb')
                ? 'text-accent-primary bg-accent-primary/10 border border-accent-primary/30 shadow-sm'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <Database className="w-4 h-4" /> Knowledge Base
          </Link>
          <Link
            to="/digests"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isActive('/digests')
                ? 'text-accent-primary bg-accent-primary/10 border border-accent-primary/30 shadow-sm'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" /> Performance Digests
          </Link>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary transition-all flex items-center gap-2 border border-transparent"
          >
            <ExternalLink className="w-4 h-4" /> View Public Site
          </a>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium border border-text-muted/30 text-text-muted hover:text-accent-warn hover:border-accent-warn/40 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <Outlet />
      </main>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/leads" element={<LeadsDashboard />} />
        <Route path="/kb" element={<KBEditor />} />
        <Route path="/digests" element={<DigestHistory />} />
      </Route>
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
