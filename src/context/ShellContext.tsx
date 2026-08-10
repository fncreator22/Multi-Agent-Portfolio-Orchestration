import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PipelineStage = 'IDLE' | 'STAGE_1_RETRIEVAL' | 'STAGE_2_GATE' | 'STAGE_3_LLM' | 'COMPLETE';

interface ShellContextType {
  activeStage: PipelineStage;
  setActiveStage: (stage: PipelineStage) => void;
}

const ShellContext = createContext<ShellContextType | undefined>(undefined);

export const ShellProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeStage, setActiveStage] = useState<PipelineStage>('IDLE');

  return (
    <ShellContext.Provider value={{ activeStage, setActiveStage }}>
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


