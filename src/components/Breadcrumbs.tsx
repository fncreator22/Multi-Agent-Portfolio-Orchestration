import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { PROJECTS } from '../constants/projects';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { slug } = useParams<{ slug?: string }>();

  // Determine path items
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
    return null; // Don't show breadcrumbs on exact home page root
  }

  const items: { label: string; to?: string }[] = [{ label: 'Home', to: '/' }];

  if (pathSegments[0] === 'projects') {
    items.push({ label: 'Projects', to: '/#projects-section' });
    if (slug) {
      const project = PROJECTS.find((p) => p.slug === slug);
      items.push({ label: project ? project.name : slug });
    }
  } else if (pathSegments[0] === 'about') {
    items.push({ label: 'About System Architect' });
  } else if (pathSegments[0] === 'contact') {
    items.push({ label: 'Contact & Consultation' });
  } else {
    items.push({ label: pathSegments[0] });
  }

  return (
    <nav className="flex items-center gap-2 font-mono text-xs text-text-muted py-2 mb-4 overflow-x-auto">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-accent-primary/60 shrink-0" />}
            {isLast || !item.to ? (
              <span className="text-accent-primary font-semibold truncate max-w-[240px] sm:max-w-none">
                {idx === 0 && <Home className="w-3.5 h-3.5 inline mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-accent-primary transition-colors flex items-center gap-1 shrink-0"
              >
                {idx === 0 && <Home className="w-3.5 h-3.5 inline" />}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
