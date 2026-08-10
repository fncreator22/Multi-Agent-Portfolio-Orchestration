import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShellProvider } from './context/ShellContext';
import { Home } from './pages/Home';
import { CaseStudy } from './pages/CaseStudy';
import { AgentChatWidget } from './components/AgentChatWidget';

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-display">
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

