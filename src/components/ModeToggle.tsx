import React, { useEffect } from 'react';
import { useShell } from '../context/ShellContext';

export const ModeToggle: React.FC = () => {
  const { mode, toggleMode } = useShell();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={toggleMode}
        aria-label="Toggle shell mode"
        className="flex items-center gap-2 px-3 py-1.5 rounded border border-accent-primary/30 bg-bg-base/90 backdrop-blur text-sm font-mono text-text-primary hover:border-accent-primary transition-all shadow-md cursor-pointer"
      >
        <span
          className="inline-block w-2 h-2 rounded-full bg-accent-primary"
        />
        <span className="font-medium capitalize">
          {mode} mode
        </span>
        <kbd className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-text-muted/20 border border-text-muted/30 text-text-muted font-mono">
          Alt+M
        </kbd>
      </button>
    </div>
  );
};
