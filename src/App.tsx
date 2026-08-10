import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ShellProvider } from './context/ShellContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { CaseStudy } from './pages/CaseStudy';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { AgentChatWidget } from './components/AgentChatWidget';

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-display flex flex-col justify-between">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:slug" element={<CaseStudy />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
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
