import React, { useEffect, useRef } from 'react';
import { useShell, PipelineStage } from '../../context/ShellContext';

export type { PipelineStage };

interface GuardianVisualizerProps {
  className?: string;
  activeStage?: PipelineStage;
}

export const GuardianVisualizer: React.FC<GuardianVisualizerProps> = ({ className = '', activeStage: propStage }) => {
  const shell = useShell();
  const currentStage: PipelineStage = propStage || shell?.activeStage || 'IDLE';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const stageRef = useRef<PipelineStage>(currentStage);

  useEffect(() => {
    stageRef.current = currentStage;
  }, [currentStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 200;
    const height = 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const getCssVar = (name: string, fallback: string) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val || fallback;
    };

    const primaryHex = getCssVar('--accent-primary', '#5eead4');
    const warnHex = getCssVar('--accent-warn', '#ffb454');

    const parseHex = (hex: string, fallback: [number, number, number]): [number, number, number] => {
      const clean = hex.replace('#', '');
      if (clean.length === 6) {
        return [
          parseInt(clean.substring(0, 2), 16),
          parseInt(clean.substring(2, 4), 16),
          parseInt(clean.substring(4, 6), 16),
        ];
      }
      return fallback;
    };

    const [rP, gP, bP] = parseHex(primaryHex, [94, 234, 212]);
    const [rW, gW, bW] = parseHex(warnHex, [255, 180, 84]);

    let angle = 0;

    const render = () => {
      let angleStep = 0.015;
      let pulseFreq = 1.5;
      let pulseMultiplier = 0.15;

      switch (stageRef.current) {
        case 'STAGE_1_RETRIEVAL':
          angleStep = 0.035;
          pulseFreq = 2.8;
          pulseMultiplier = 0.25;
          break;
        case 'STAGE_2_GATE':
          angleStep = 0.055;
          pulseFreq = 4.2;
          pulseMultiplier = 0.35;
          break;
        case 'STAGE_3_LLM':
          angleStep = 0.085;
          pulseFreq = 6.5;
          pulseMultiplier = 0.45;
          break;
        case 'COMPLETE':
          angleStep = 0.02;
          pulseFreq = 1.8;
          pulseMultiplier = 0.2;
          break;
        case 'IDLE':
        default:
          angleStep = 0.015;
          pulseFreq = 1.5;
          pulseMultiplier = 0.15;
          break;
      }

      angle += angleStep;
      const pulse = Math.sin(angle * pulseFreq) * pulseMultiplier + (1 - pulseMultiplier);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Outer static ring with subtle warn accent ticks
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${rW}, ${gW}, ${bW}, ${0.25 * pulse})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Outer cardinal ticks
      for (let i = 0; i < 8; i++) {
        const tickAngle = (i * Math.PI) / 4 + angle * 0.2;
        const x1 = centerX + Math.cos(tickAngle) * 76;
        const y1 = centerY + Math.sin(tickAngle) * 76;
        const x2 = centerX + Math.cos(tickAngle) * 84;
        const y2 = centerY + Math.sin(tickAngle) * 84;

        ctx.strokeStyle = i % 2 === 0 ? `rgba(${rW}, ${gW}, ${bW}, ${0.6 * pulse})` : `rgba(${rP}, ${gP}, ${bP}, ${0.4 * pulse})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Middle rotating geometric ring 1 (Primary Accent)
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(${rP}, ${gP}, ${bP}, ${0.6 * pulse})`;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 1.5);
      ctx.stroke();

      // Orbital dot on ring 1
      ctx.fillStyle = `rgba(${rP}, ${gP}, ${bP}, 0.9)`;
      ctx.beginPath();
      ctx.arc(58, 0, 3 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Counter-rotating geometric ring 2 (Primary Accent)
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${rP}, ${gP}, ${bP}, ${0.4 * pulse})`;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-angle * 1.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 24, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner wireframe sphere core (Concentric rings)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle * 0.5);

      for (let i = 1; i <= 3; i++) {
        const radius = i * 10 * pulse;
        const alpha = (0.8 - i * 0.18) * pulse;
        ctx.strokeStyle = `rgba(${rP}, ${gP}, ${bP}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Core pulsating center node (Warn / Primary blend)
      ctx.fillStyle = `rgba(${rW}, ${gW}, ${bW}, ${0.8 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, 4 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const getBadgeConfig = (stage: PipelineStage) => {
    switch (stage) {
      case 'STAGE_1_RETRIEVAL':
        return {
          label: 'STAGE 1: VECTOR RETRIEVAL',
          containerClass: 'border-accent-primary/50 bg-accent-primary/20 text-accent-primary',
          dotClass: 'bg-accent-primary animate-ping',
        };
      case 'STAGE_2_GATE':
        return {
          label: 'STAGE 2: CONFIDENCE GATE',
          containerClass: 'border-accent-warn/50 bg-accent-warn/20 text-accent-warn',
          dotClass: 'bg-accent-warn animate-ping',
        };
      case 'STAGE_3_LLM':
        return {
          label: 'STAGE 3: LLM GENERATION & GROUNDING',
          containerClass: 'border-accent-warn/70 bg-accent-warn/30 text-accent-warn font-bold animate-pulse',
          dotClass: 'bg-accent-warn animate-ping',
        };
      case 'COMPLETE':
        return {
          label: 'PIPELINE COMPLETE: GROUNDED',
          containerClass: 'border-accent-primary/60 bg-accent-primary/25 text-accent-primary font-semibold',
          dotClass: 'bg-accent-primary',
        };
      case 'IDLE':
      default:
        return {
          label: 'AGENT STATUS: IDLE (STAGE 1 STANDBY)',
          containerClass: 'border-accent-warn/30 bg-accent-warn/10 text-accent-warn',
          dotClass: 'bg-accent-warn',
        };
    }
  };

  const badge = getBadgeConfig(currentStage);

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border border-accent-primary/30 bg-bg-base/90 shadow-md ${className}`}>
      <div className="relative flex items-center justify-center">
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono tracking-wide transition-all duration-300 ${badge.containerClass}`}>
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.dotClass}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dotClass.split(' ')[0]}`}></span>
        </span>
        <span>{badge.label}</span>
      </div>
    </div>
  );
};

