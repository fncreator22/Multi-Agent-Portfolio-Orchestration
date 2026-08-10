import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Cpu,
  Layers,
  Shield,
  CheckCircle2,
  Code2,
  Server,
  GitBranch,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import { BIO_DATA } from '../constants/bio';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const About: React.FC = () => {
  const orchestrationPrinciples = [
    {
      icon: <Brain className="w-6 h-6 text-accent-primary" />,
      title: 'Autonomous RAG Telemetry',
      description:
        'Multi-stage retrieval pipeline with vector similarity scoring (Chroma DB), sub-millisecond query parsing, and contextual grounding verification.',
    },
    {
      icon: <Shield className="w-6 h-6 text-accent-warn" />,
      title: 'Confidence Gating & Escaping',
      description:
        'Dual-phase decision gate comparing vector similarity scores against calibrated thresholds to determine RETRIEVAL_ONLY vs ESCALATE_LLM status.',
    },
    {
      icon: <Layers className="w-6 h-6 text-accent-primary" />,
      title: 'Model Context Protocol (MCP)',
      description:
        'Strict schema sandboxing and JSON-RPC capability negotiation to prevent unauthorized API boundary escapes or prompt injection vectors.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-accent-primary" />,
      title: 'Computer Vision Edge Pipelines',
      description:
        'YOLOv8/v11 real-time object detection and tracking optimized with TensorRT, ONNX quantization, and spatial coordinate collision algorithms.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs />

        {/* Hero Section */}
        <header className="bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-xs font-mono text-accent-primary">
                <Terminal className="w-3.5 h-3.5" />
                <span>System Architect & AI Engineer</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight">
                Architecting Autonomous <span className="text-accent-primary">Multi-Agent Systems</span>
              </h1>
              <p className="text-text-muted text-base md:text-lg max-w-3xl leading-relaxed">
                {BIO_DATA.tagline}
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-3">
              <Link
                to="/contact"
                className="px-5 py-3 rounded-xl bg-accent-primary text-bg-base font-mono font-bold text-xs hover:bg-accent-primary/90 transition-all inline-flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Book Architecture Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Bio Summary Section */}
        <section className="bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6">
          <div className="flex items-center gap-3 border-b border-accent-primary/20 pb-4">
            <Code2 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-bold text-text-primary">Executive Summary</h2>
          </div>
          <p className="text-text-primary text-sm md:text-base leading-relaxed max-w-4xl">
            {BIO_DATA.summary}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
            <div className="p-4 rounded-xl bg-bg-base/60 border border-accent-primary/20 space-y-1">
              <span className="text-text-muted">Core Focus</span>
              <p className="text-accent-primary font-semibold">Agentic RAG & MCP Protocols</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-base/60 border border-accent-primary/20 space-y-1">
              <span className="text-text-muted">Vision Engineering</span>
              <p className="text-accent-warn font-semibold">YOLOv8/v11 & Edge Quantization</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-base/60 border border-accent-primary/20 space-y-1">
              <span className="text-text-muted">Web & Infrastructure</span>
              <p className="text-accent-primary font-semibold">TypeScript, React, FastAPI, Docker</p>
            </div>
          </div>
        </section>

        {/* Technical Skills Breakdown */}
        <section className="bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6">
          <div className="flex items-center gap-3 border-b border-accent-primary/20 pb-4">
            <Server className="w-5 h-5 text-accent-warn" />
            <h2 className="text-xl font-bold text-text-primary">Technical Skills & Technology Matrix</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BIO_DATA.skills.map((skillGroup) => (
              <div
                key={skillGroup.category}
                className="bg-bg-base/60 p-5 rounded-xl border border-accent-primary/20 space-y-3"
              >
                <h3 className="text-xs font-mono text-accent-warn font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  {skillGroup.category}
                </h3>
                <ul className="space-y-2">
                  {skillGroup.items.map((item) => (
                    <li key={item} className="text-xs text-text-muted flex items-center gap-2 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Multi-Agent Orchestration Principles */}
        <section className="bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-8">
          <div className="flex items-center gap-3 border-b border-accent-primary/20 pb-4">
            <Brain className="w-5 h-5 text-accent-primary" />
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Multi-Agent Orchestration & System Principles
              </h2>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Core architectural tenets driving deterministic AI runtime execution
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orchestrationPrinciples.map((item, idx) => (
              <div
                key={idx}
                className="bg-bg-base/60 p-6 rounded-xl border border-accent-primary/20 hover:border-accent-primary/50 transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-bg-base border border-accent-primary/30">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-text-primary">
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed font-body">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div className="bg-panel backdrop-blur-md shadow-soft rounded-2xl p-8 border border-accent-primary/30 text-center space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">
            Ready to Build Next-Gen Agentic Architecture?
          </h2>
          <p className="text-text-muted text-sm max-w-xl mx-auto font-body">
            Explore case studies or schedule a direct consultation to discuss custom vector search systems, computer vision models, or full-stack web platforms.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-accent-primary text-bg-base font-mono font-bold text-xs hover:bg-accent-primary/90 transition-all"
            >
              Contact Architect
            </Link>
            <a
              href="/#projects-section"
              className="px-6 py-3 rounded-xl border border-accent-primary/40 bg-accent-primary/10 text-accent-primary font-mono font-bold text-xs hover:bg-accent-primary/20 transition-all"
            >
              Explore Projects
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
