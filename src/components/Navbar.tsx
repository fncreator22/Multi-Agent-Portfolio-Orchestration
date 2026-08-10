import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, FolderGit2, User, Mail, ExternalLink, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    return location.pathname.startsWith(path);
  };

  const handleProjectsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/#projects-section');
      setTimeout(() => {
        const elem = document.getElementById('projects-section');
        elem?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const elem = document.getElementById('projects-section');
      elem?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-panel backdrop-blur-md shadow-soft border-b border-accent-primary/20 rounded-b-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo / Title */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group transition-colors"
          >
            <div className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/30 group-hover:border-accent-primary group-hover:bg-accent-primary/20 transition-all">
              <Terminal className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-text-primary tracking-wide group-hover:text-accent-primary transition-colors">
                Agentic Portfolio
              </span>
              <span className="text-[10px] font-mono text-accent-warn tracking-widest uppercase">
                Multi-Agent System
              </span>
            </div>
          </Link>

          {/* Desktop Route Links */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                isActive('/') && !location.hash
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-panel'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <a
              href="/#projects-section"
              onClick={handleProjectsClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                location.hash === '#projects-section'
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-panel'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
            </a>

            <Link
              to="/about"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                isActive('/about')
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-panel'
              }`}
            >
              <User className="w-4 h-4" />
              <span>About</span>
            </Link>

            <Link
              to="/contact"
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                isActive('/contact')
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/40'
                  : 'text-text-muted hover:text-text-primary hover:bg-panel'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </Link>

            <div className="h-4 w-px bg-accent-primary/20 mx-2" />

            {/* Admin Portal Link */}
            <a
              href="http://localhost:8000/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent-warn/40 bg-accent-warn/10 text-accent-warn hover:bg-accent-warn/20 transition-all font-semibold"
            >
              <span>Admin Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <a
              href="http://localhost:8000/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md border border-accent-warn/40 text-accent-warn text-xs flex items-center gap-1 font-mono"
            >
              <span>Admin</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-text-muted hover:text-accent-primary hover:bg-panel transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-accent-primary/20 bg-bg-base/95 backdrop-blur-md px-4 py-4 space-y-2 font-mono text-sm">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-md ${
              isActive('/') && !location.hash ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-muted'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <a
            href="/#projects-section"
            onClick={handleProjectsClick}
            className="flex items-center gap-2 p-2.5 rounded-md text-text-muted"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Projects</span>
          </a>

          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-md ${
              isActive('/about') ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-muted'
            }`}
          >
            <User className="w-4 h-4" />
            <span>About Architect</span>
          </Link>

          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 p-2.5 rounded-md ${
              isActive('/contact') ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-muted'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contact & Booking</span>
          </Link>
        </div>
      )}
    </header>
  );
};
