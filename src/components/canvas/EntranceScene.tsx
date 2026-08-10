import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
}

export const EntranceScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [resolved, setResolved] = useState(false);
  const [particleCount, setParticleCount] = useState(0);

  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasPlayedRef = useRef<boolean>(false);

  const initParticles = (width: number, height: number) => {
    const numParticles = Math.min(100, Math.floor((width * height) / 8000));
    setParticleCount(numParticles);
    const particles: Particle[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;

    for (let i = 0; i < numParticles; i++) {
      // Random starting position scattered across canvas
      const startX = Math.random() * width;
      const startY = Math.random() * height;

      // Target position arranged in concentric geometric lattice rings
      const ringIndex = i % 3;
      const ringRadius = maxRadius * ((ringIndex + 1) / 3);
      const angle = ((i / numParticles) * Math.PI * 2 * (ringIndex + 1)) + (ringIndex * 0.5);

      const targetX = centerX + Math.cos(angle) * ringRadius;
      const targetY = centerY + Math.sin(angle) * ringRadius;

      particles.push({
        x: startX,
        y: startY,
        startX,
        startY,
        targetX,
        targetY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.5,
        baseAlpha: Math.random() * 0.5 + 0.4,
      });
    }

    particlesRef.current = particles;
  };

  const triggerReplay = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const { width, height } = canvasRef.current;
    startTimeRef.current = Date.now();
    hasPlayedRef.current = false;
    setResolved(false);
    initParticles(width, height);
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initParticles(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Color resolution from CSS variables
    const getCssVar = (name: string, fallback: string) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val || fallback;
    };

    const primaryColor = getCssVar('--accent-primary', '#5eead4');
    const bgColor = getCssVar('--bg-base', '#0a0b12');

    // Parse primary hex color for alpha variations
    let r = 94, g = 234, b = 212;
    if (primaryColor.startsWith('#')) {
      const hex = primaryColor.replace('#', '');
      if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
    }

    const DURATION = 2400; // ms for entrance resolve

    const render = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const rawProgress = Math.min(1, elapsed / DURATION);

      // Cubic ease-out
      const progress = 1 - Math.pow(1 - rawProgress, 3);

      if (rawProgress >= 1 && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        setResolved(true);
      }

      ctx.clearRect(0, 0, width, height);

      // Background subtle gradient using --bg-base
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) / 1.2);
      bgGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.04)`);
      bgGrad.addColorStop(1, bgColor);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update positions
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interpolate between start and target
        const currentTargetX = p.startX + (p.targetX - p.startX) * progress;
        const currentTargetY = p.startY + (p.targetY - p.startY) * progress;

        // Subtle ambient drift after resolve
        if (progress >= 1) {
          p.x += p.vx;
          p.y += p.vy;

          // Tether to target position
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.x += dx * 0.02;
          p.y += dy * 0.02;
        } else {
          p.x = currentTargetX;
          p.y = currentTargetY;
        }

        // Mouse interaction (repulsion / magnetic lift)
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;
          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 20;
            const angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * force * 0.1;
            p.y += Math.sin(angle) * force * 0.1;
          }
        }
      }

      // Draw restrained mesh connection lines
      ctx.lineWidth = 0.8;
      const maxConnectDist = 90;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.25 * Math.min(1, progress * 1.5);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow ring for key nodes
        if (i % 7 === 0) {
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${p.baseAlpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Central core pulsing circle in cinematic mode
      const corePulse = Math.sin(now * 0.002) * 4 + 40;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.15 * Math.min(1, progress)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, corePulse, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] rounded-xl overflow-hidden border border-accent-primary/20 bg-bg-base transition-all duration-500 shadow-lg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      
      {/* Overlay Status Bar */}
      <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-3 bg-bg-base/80 backdrop-blur-md border border-accent-primary/30 px-3 py-1.5 rounded-md text-xs font-mono text-accent-primary">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
        </span>
        <span>CINEMATIC CANVAS // INITIAL RESOLVE</span>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none text-xs font-mono text-text-muted">
        {resolved ? (
          <span className="text-accent-primary/90">STATE: LATTICE RESOLVED ({particleCount} NODES ACTIVE)</span>
        ) : (
          <span>RESOLVING PARTICLE MESH...</span>
        )}
      </div>

      <button
        onClick={triggerReplay}
        className="absolute bottom-4 right-4 bg-bg-base/80 hover:bg-accent-primary/10 border border-accent-primary/40 hover:border-accent-primary text-accent-primary text-xs font-mono px-3 py-1.5 rounded transition-colors duration-200"
        title="Re-trigger particle resolve animation"
      >
        [REPLAY RESOLVE]
      </button>
    </div>
  );
};
