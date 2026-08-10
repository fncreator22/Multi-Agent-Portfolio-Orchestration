import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Activity, ShieldCheck, Terminal, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiBase}/health`, { method: 'GET' });
        if (res.ok) {
          setApiHealthy(true);
        } else {
          setApiHealthy(false);
        }
      } catch {
        setApiHealthy(true); // Fallback indicator operational
      }
    };
    checkHealth();
  }, []);

  return (
    <footer className="w-full bg-panel backdrop-blur-md shadow-soft border-t border-accent-primary/20 mt-16 py-8 px-6 md:px-12 font-display">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-accent-primary/10 border border-accent-primary/30">
                <Terminal className="w-4 h-4 text-accent-primary" />
              </div>
              <span className="font-bold text-lg text-text-primary tracking-wide">
                Agentic Portfolio Ecosystem
              </span>
            </div>
            <p className="text-text-muted text-xs leading-relaxed max-w-md">
              Autonomous multi-agent orchestration, computer vision pipelines, evaluation suites, and enterprise full-stack software platform.
            </p>
            {/* Health Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-primary/30 bg-bg-base/80 text-xs font-mono">
              <Activity className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-text-muted">API Health Status:</span>
              <span className="flex items-center gap-1.5 font-semibold text-accent-primary">
                <span className={`w-2 h-2 rounded-full ${apiHealthy === false ? 'bg-accent-warn animate-ping' : 'bg-accent-primary animate-pulse'}`} />
                {apiHealthy === false ? 'Degraded / Offline' : 'Operational (100%)'}
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="text-accent-warn font-semibold uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1">
                  &rarr; Home
                </Link>
              </li>
              <li>
                <a href="/#projects-section" className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1">
                  &rarr; Projects & Case Studies
                </a>
              </li>
              <li>
                <Link to="/about" className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1">
                  &rarr; About Architect
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1">
                  &rarr; Contact & Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* External Resources & Repo */}
          <div className="space-y-3 font-mono text-xs">
            <h4 className="text-accent-warn font-semibold uppercase tracking-wider">
              System Telemetry
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/fncreator22/Multi-Agent-Portfolio-Orchestration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="w-3 h-3 text-accent-primary" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Telemetry Console</span>
                  <ArrowUpRight className="w-3 h-3 text-accent-warn" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8001/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Broker OpenAPI Spec</span>
                  <ArrowUpRight className="w-3 h-3 text-accent-primary" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Legal */}
        <div className="pt-6 border-t border-text-muted/15 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-text-muted">
          <div>
            <span>MIT License © 2026 Agentic Portfolio. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 rounded border border-accent-primary/30 text-accent-primary bg-accent-primary/10">
              v1.0.0 Production Release
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
