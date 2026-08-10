import React, { useState, useEffect } from 'react';
import { useShell } from '../context/ShellContext';

interface TerminalBootSequenceProps {
  onComplete?: () => void;
}

const BOOT_LOGS = [
  '[SYS_BOOT] INITIALIZING SHELL ENVIRONMENT v1.0.0...',
  '[SYS_BOOT] LOADING DESIGN TOKENS (--accent-primary: #5eead4, --accent-warn: #ffb454)... OK',
  '[SYS_BOOT] MOUNTING PROJECT MATRIX [12 RECORDS LOADED]... OK',
  '[SYS_BOOT] VERIFYING PARITY BETWEEN CINEMATIC & TERMINAL MODES... 100% MATCH',
  '[SYS_BOOT] GUARDIAN AGENT INITIALIZED: IDLE (STAGE 1 STANDBY)',
  '[SYS_BOOT] HYBRID SHELL READY.',
];

export const TerminalBootSequence: React.FC<TerminalBootSequenceProps> = ({ onComplete }) => {
  const { mode } = useShell();
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (mode !== 'terminal') return;

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < BOOT_LOGS.length) {
        setVisibleLines((prev) => [...prev, BOOT_LOGS[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setIsFinished(true);
        if (onComplete) onComplete();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [mode, onComplete]);

  if (mode !== 'terminal') return null;

  return (
    <div className="bg-[#0a0b12] border border-[var(--accent-primary)]/30 rounded p-4 font-mono text-xs text-[var(--accent-primary)] my-4 shadow-lg shadow-[var(--accent-primary)]/5">
      <div className="flex items-center justify-between border-b border-[var(--accent-primary)]/20 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] inline-block animate-pulse"></span>
          <span className="font-bold tracking-wider text-[var(--text-primary)] uppercase">
            TERMINAL_BOOT_SEQUENCE.SH
          </span>
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          {isFinished ? '[READY]' : '[BOOTING...]'}
        </div>
      </div>

      <div className="space-y-1 text-left font-mono leading-relaxed">
        {visibleLines.map((log, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-[var(--accent-warn)] select-none font-bold">&gt;</span>
            <span className={log.includes('OK') || log.includes('100%') ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}>
              {log}
            </span>
          </div>
        ))}

        {!isFinished && (
          <div className="flex items-center space-x-2 text-[var(--accent-primary)] animate-pulse">
            <span className="text-[var(--accent-warn)]">&gt;</span>
            <span>_</span>
          </div>
        )}
      </div>

      {isFinished && (
        <div className="mt-4 pt-3 border-t border-[var(--accent-primary)]/20 text-[11px] text-[var(--text-muted)] flex flex-wrap gap-4">
          <span>Available Commands:</span>
          <span className="text-[var(--accent-primary)] font-semibold">$ help</span>
          <span className="text-[var(--accent-primary)] font-semibold">$ ls projects</span>
          <span className="text-[var(--accent-primary)] font-semibold">$ cat bio</span>
          <span className="text-[var(--accent-primary)] font-semibold">$ cat skills</span>
        </div>
      )}
    </div>
  );
};
