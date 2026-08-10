import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Award,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { PROJECTS } from '../constants/projects';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
        <div className="max-w-4xl mx-auto space-y-6 py-12">
          <Breadcrumbs />

          <div className="bg-panel backdrop-blur shadow-soft rounded-2xl p-8 border border-accent-warn/40 space-y-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-accent-warn/10 text-accent-warn">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-accent-warn">
              Project Case Study Not Found
            </h1>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              We couldn't locate a portfolio project matching slug "{slug}".
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all bg-accent-primary text-bg-base hover:opacity-90"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { name, category, description, tech, githubUrl, liveUrl, caseStudy } = project;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs />

        {/* Hero Card Container */}
        <header className="bg-panel backdrop-blur shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/10">
              {category}
            </span>
            <Link
              to="/"
              className="text-text-muted hover:text-accent-primary font-mono text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Projects
            </Link>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight">
            {name}
          </h1>

          <p className="text-base md:text-lg text-text-muted leading-relaxed font-body">
            {description}
          </p>

          {/* Tech stack */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-text-muted">Technology Stack:</span>
            <div className="flex flex-wrap gap-2">
              {tech.map((item) => (
                <span
                  key={item}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg border border-accent-primary/20 bg-bg-base/60 text-text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Action links */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-accent-primary/15">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all inline-flex items-center gap-2 border-accent-primary/40 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 shadow"
            >
              <Code2 className="w-4 h-4" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all inline-flex items-center gap-2 bg-accent-primary text-bg-base hover:opacity-90 shadow"
              >
                <span>Live Application</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </header>

        {/* Case Study Detailed Body */}
        <main className="space-y-8">
          {/* Overview Container */}
          <section className="bg-panel backdrop-blur shadow-soft rounded-lg p-6 md:p-8 border border-accent-primary/20 space-y-4">
            <div className="flex items-center gap-2.5 text-accent-primary">
              <Terminal className="w-5 h-5" />
              <h2 className="text-xl font-bold text-text-primary">Executive Summary & Overview</h2>
            </div>
            <p className="text-text-primary leading-relaxed text-sm md:text-base font-body">
              {caseStudy.overview}
            </p>
          </section>

          {/* Problem & Solution Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-panel backdrop-blur shadow-soft rounded-lg p-6 border border-accent-warn/30 space-y-3">
              <div className="flex items-center gap-2.5 text-accent-warn">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-bold text-text-primary">The Architectural Challenge</h2>
              </div>
              <p className="text-text-primary text-sm leading-relaxed font-body">
                {caseStudy.problem}
              </p>
            </section>

            <section className="bg-panel backdrop-blur shadow-soft rounded-lg p-6 border border-accent-primary/30 space-y-3">
              <div className="flex items-center gap-2.5 text-accent-primary">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="text-lg font-bold text-text-primary">Engineering Solution</h2>
              </div>
              <p className="text-text-primary text-sm leading-relaxed font-body">
                {caseStudy.solution}
              </p>
            </section>
          </div>

          {/* Architecture Highlights */}
          <section className="bg-panel backdrop-blur shadow-soft rounded-lg p-6 md:p-8 border border-accent-primary/20 space-y-4">
            <div className="flex items-center gap-2.5 text-accent-primary">
              <Layers className="w-5 h-5" />
              <h2 className="text-xl font-bold text-text-primary">System Architecture & Technical Highlights</h2>
            </div>
            <ul className="space-y-3 pt-2 font-mono text-xs">
              {caseStudy.architecture.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 bg-bg-base/60 p-3.5 rounded-lg border border-accent-primary/15">
                  <ChevronRight className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
                  <span className="text-text-primary leading-normal">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Key Performance Metrics */}
          <section className="bg-panel backdrop-blur shadow-soft rounded-lg p-6 md:p-8 border border-accent-primary/30 space-y-6">
            <div className="flex items-center gap-2.5 text-accent-warn">
              <Award className="w-5 h-5" />
              <h2 className="text-xl font-bold text-text-primary">Key Performance Metrics & Empirical Impact</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {caseStudy.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-bg-base/80 p-5 rounded-lg border border-accent-primary/20 space-y-2"
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent-primary font-bold">
                    Metric #{idx + 1}
                  </span>
                  <p className="text-sm font-semibold text-text-primary font-body">
                    {metric}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
