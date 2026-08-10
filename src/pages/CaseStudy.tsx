import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShell } from '../context/ShellContext';
import { PROJECTS } from '../constants/projects';

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { mode } = useShell();
  const isTerminal = mode === 'terminal';

  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className={`min-h-screen bg-bg-base text-text-primary p-6 md:p-12 ${isTerminal ? 'font-mono' : 'font-display'}`}>
        <div className="max-w-4xl mx-auto py-12">
          <Link
            to="/"
            className="text-accent-primary hover:underline font-mono mb-8 inline-flex items-center gap-2"
          >
            {isTerminal ? '<- cd ..' : '\u2190 Back to Projects'}
          </Link>

          <div
            className={`p-8 rounded-xl border ${
              isTerminal
                ? 'border-accent-warn/50 bg-bg-base terminal-box-glow'
                : 'border-accent-warn/30 bg-bg-base/80 backdrop-blur'
            }`}
          >
            <h1 className="text-3xl font-bold text-accent-warn mb-4">
              {isTerminal ? '[404] ERROR: PROJECT_NOT_FOUND' : 'Project Not Found'}
            </h1>
            <p className="text-text-muted mb-6">
              {isTerminal
                ? `Directory entry '/projects/${slug}' was not located in system manifest.`
                : `We couldn't find a project matching the slug "${slug}". It may have been moved or renamed.`}
            </p>
            <Link
              to="/"
              className={`inline-block px-5 py-2.5 rounded font-mono text-sm font-semibold transition-all ${
                isTerminal
                  ? 'bg-accent-primary text-bg-base hover:bg-accent-primary/90'
                  : 'bg-accent-primary text-bg-base hover:opacity-90'
              }`}
            >
              {isTerminal ? '$ cd /' : 'Return to Portfolio'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { name, category, description, tech, githubUrl, liveUrl, caseStudy } = project;

  return (
    <div className={`min-h-screen bg-bg-base text-text-primary p-6 md:p-12 ${isTerminal ? 'font-mono' : 'font-display'}`}>
      <div className="max-w-4xl mx-auto py-6 space-y-8">
        {/* Navigation */}
        <div>
          <Link
            to="/"
            className="text-accent-primary hover:underline font-mono inline-flex items-center gap-2 text-sm"
          >
            {isTerminal ? '<- cd /projects' : '\u2190 Back to Projects'}
          </Link>
        </div>

        {/* Header Header Info */}
        <header className="space-y-4">
          {isTerminal && (
            <div className="font-mono text-xs text-text-muted">
              guest@portfolio:~/projects$ cat {slug}.md
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/10">
              {category}
            </span>
          </div>

          <h1 className={`text-3xl md:text-5xl font-bold text-text-primary ${isTerminal ? 'terminal-glow text-accent-primary font-mono' : ''}`}>
            {name}
          </h1>

          <p className="text-lg text-text-muted leading-relaxed">
            {description}
          </p>

          {/* Tech stack */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tech.map((item) => (
              <span
                key={item}
                className="text-xs font-mono px-2.5 py-1 rounded border border-text-muted/20 bg-bg-base text-text-muted"
              >
                {isTerminal ? `#${item}` : item}
              </span>
            ))}
          </div>

          {/* Action links */}
          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-5 py-2.5 rounded text-sm font-mono font-medium border transition-all inline-flex items-center gap-2 ${
                isTerminal
                  ? 'border-accent-primary text-accent-primary hover:bg-accent-primary/10'
                  : 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
              }`}
            >
              <span>{isTerminal ? '[GIT]' : '\u2197'}</span> GitHub Repository
            </a>

            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-2.5 rounded text-sm font-mono font-medium transition-all inline-flex items-center gap-2 ${
                  isTerminal
                    ? 'bg-accent-primary text-bg-base hover:bg-accent-primary/90'
                    : 'bg-accent-primary text-bg-base hover:opacity-90'
                }`}
              >
                <span>{isTerminal ? '[LIVE]' : '\u2605'}</span> Live Application
              </a>
            )}
          </div>
        </header>

        <hr className="border-text-muted/20" />

        {/* Case Study Body */}
        <main className="space-y-8">
          {/* Overview */}
          <section className={`p-6 rounded-xl border ${isTerminal ? 'border-accent-primary/30 bg-bg-base terminal-box-glow' : 'border-accent-primary/20 bg-bg-base/60'}`}>
            <h2 className="text-xl font-semibold mb-3 text-accent-primary flex items-center gap-2">
              <span>{isTerminal ? '##' : '\u25c6'}</span> Overview
            </h2>
            <p className="text-text-primary leading-relaxed">
              {caseStudy.overview}
            </p>
          </section>

          {/* Problem & Solution Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className={`p-6 rounded-xl border ${isTerminal ? 'border-accent-warn/40 bg-bg-base' : 'border-accent-warn/20 bg-bg-base/60'}`}>
              <h2 className="text-xl font-semibold mb-3 text-accent-warn flex items-center gap-2">
                <span>{isTerminal ? '[PROBLEM]' : '\u26a0'}</span> The Challenge
              </h2>
              <p className="text-text-primary leading-relaxed">
                {caseStudy.problem}
              </p>
            </section>

            <section className={`p-6 rounded-xl border ${isTerminal ? 'border-accent-primary/40 bg-bg-base' : 'border-accent-primary/20 bg-bg-base/60'}`}>
              <h2 className="text-xl font-semibold mb-3 text-accent-primary flex items-center gap-2">
                <span>{isTerminal ? '[SOLUTION]' : '\u2714'}</span> The Solution
              </h2>
              <p className="text-text-primary leading-relaxed">
                {caseStudy.solution}
              </p>
            </section>
          </div>

          {/* Architecture */}
          <section className={`p-6 rounded-xl border ${isTerminal ? 'border-accent-primary/30 bg-bg-base' : 'border-accent-primary/20 bg-bg-base/60'}`}>
            <h2 className="text-xl font-semibold mb-4 text-accent-primary flex items-center gap-2">
              <span>{isTerminal ? '##' : '\u25c6'}</span> System Architecture & Highlights
            </h2>
            <ul className="space-y-3">
              {caseStudy.architecture.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-text-primary">
                  <span className="text-accent-primary font-mono shrink-0">{isTerminal ? `[0${idx + 1}]` : '\u2192'}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Key Metrics */}
          <section className={`p-6 rounded-xl border ${isTerminal ? 'border-accent-primary/40 bg-bg-base terminal-box-glow' : 'border-accent-primary/30 bg-accent-primary/5'}`}>
            <h2 className="text-xl font-semibold mb-4 text-accent-primary flex items-center gap-2">
              <span>{isTerminal ? '##' : '\u2605'}</span> Key Performance Metrics & Impact
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {caseStudy.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    isTerminal ? 'border-accent-primary/30 bg-bg-base' : 'border-accent-primary/20 bg-bg-base/80'
                  }`}
                >
                  <div className="text-xs font-mono text-accent-primary mb-1">
                    {isTerminal ? `METRIC_0${idx + 1}` : `Impact #${idx + 1}`}
                  </div>
                  <div className="text-sm font-medium text-text-primary">
                    {metric}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
