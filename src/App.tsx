import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShellProvider, useShell } from './context/ShellContext';
import { ModeToggle } from './components/ModeToggle';
import { Home } from './pages/Home';
import { CaseStudy } from './pages/CaseStudy';
import { AgentChatWidget } from './components/AgentChatWidget';

const AppContent: React.FC = () => {
  const { mode } = useShell();

  return (
    <div className={`min-h-screen bg-bg-base text-text-primary ${mode === 'terminal' ? 'font-mono' : 'font-display'}`}>
      {mode === 'terminal' && <div className="crt-overlay scanlines" aria-hidden="true" />}
      <ModeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:slug" element={<CaseStudy />} />
      </Routes>
      <AgentChatWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ShellProvider>
      <Router>
        <AppContent />
      </Router>
    </ShellProvider>
  );
};

export default App;

