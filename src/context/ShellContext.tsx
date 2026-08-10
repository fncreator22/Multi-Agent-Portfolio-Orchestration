import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ShellMode = 'cinematic' | 'terminal';
export type PipelineStage = 'IDLE' | 'STAGE_1_RETRIEVAL' | 'STAGE_2_GATE' | 'STAGE_3_LLM' | 'COMPLETE';

interface ShellContextType {
  mode: ShellMode;
  setMode: (mode: ShellMode) => void;
  toggleMode: () => void;
  activeStage: PipelineStage;
  setActiveStage: (stage: PipelineStage) => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

const STORAGE_KEY = 'portfolio_shell_mode';

export const ShellProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ShellMode>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'cinematic' || saved === 'terminal') {
        return saved;
      }
    }
    return 'cinematic';
  });

  const [activeStage, setActiveStage] = useState<PipelineStage>('IDLE');

  const setMode = (newMode: ShellMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore localStorage write failures
    }
  };

  const toggleMode = () => {
    setMode(mode === 'cinematic' ? 'terminal' : 'cinematic');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'terminal') {
      root.classList.remove('mode-cinematic');
      root.classList.add('mode-terminal');
    } else {
      root.classList.remove('mode-terminal');
      root.classList.add('mode-cinematic');
    }
  }, [mode]);

  return (
    <ShellContext.Provider value={{ mode, setMode, toggleMode, activeStage, setActiveStage }}>
      {children}
    </ShellContext.Provider>
  );
};

export const useShell = (): ShellContextType => {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider');
  }
  return context;
};

