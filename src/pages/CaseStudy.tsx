import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PROJECTS } from '../constants/projects';

export const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
        <div className="max-w-4xl mx-auto py-12">
          <Link
            to="/"
            className="text-accent-primary hover:underline font-mono mb-8 inline-flex items-center gap-2"
          >
            &rarr; Back to Projects
          </Link>

          <div className="p-8 rounded-xl border border-accent-warn/30 bg-bg-base/80 backdrop-blur">
            <h1 className="text-3xl font-bold text-accent-warn mb-4">
              Project Not Found
            </h1>
            <p className="text-text-muted mb-6">
              We couldn't find a project matching the slug "{slug}". It may have been moved or renamed.
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 rounded font-mono text-sm font-semibold transition-all bg-accent-primary text-bg-base hover:opacity-90"
            >
              Return to Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { name, category, description, tech, githubUrl, liveUrl, caseStudy } = project;

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
      <div className="max-w-4xl mx-auto py-6 space-y-8">
        {/* Navigation */}
        <div>
          <Link
            to="/"
            className="text-accent-primary hover:underline font-mono inline-flex items-center gap-2 text-sm"
          >
            &rarr; Back to Projects
          </Link>
        </div>

        {/* Header Header Info */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/10">
              {category}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-text-primary">
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
                {item}
              </span>
            ))}
          </div>

          {/* Action links */}
          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded text-sm font-mono font-medium border transition-all inline-flex items-center gap-2 border-accent-primary/40 bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20"
            >
              <span>&rarr;</span> GitHub Repository
            </a>

            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded text-sm font-mono font-medium transition-all inline-flex items-center gap-2 bg-accent-primary text-bg-base hover:opacity-90"
              >
                <span>&rarr;</span> Live Application
              </a>
            )}
          </div>
        </header>

        <hr className="border-text-muted/20" />

        {/* Case Study Body */}
        <main className="space-y-8">
          {/* Overview */}
          <section className="p-6 rounded-xl border border-accent-primary/20 bg-bg-base/60">
            <h2 className="text-xl font-semibold mb-3 text-accent-primary flex items-center gap-2">
              <span>◆</span> Overview
            </h2>
            <p className="text-text-primary leading-relaxed">
              {caseStudy.overview}
            </p>
          </section>

          {/* Problem & Solution Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <section className="p-6 rounded-xl border border-accent-warn/20 bg-bg-base/60">
              <h2 className="text-xl font-semibold mb-3 text-accent-warn flex items-center gap-2">
                <span>⚠</span> The Challenge
              </h2>
              <p className="text-text-primary leading-relaxed">
                {caseStudy.problem}
              </p>
            </section>

            <section className="p-6 rounded-xl border border-accent-primary/20 bg-bg-base/60">
              <h2 className="text-xl font-semibold mb-3 text-accent-primary flex items-center gap-2">
                <span>✔</span> The Solution
              </h2>
              <p className="text-text-primary leading-relaxed">
                {caseStudy.solution}
              </p>
            </section>
          </div>

          {/* Architecture */}
          <section className="p-6 rounded-xl border border-accent-primary/20 bg-bg-base/60">
            <h2 className="text-xl font-semibold mb-4 text-accent-primary flex items-center gap-2">
              <span>◆</span> System Architecture & Highlights
            </h2>
            <ul className="space-y-3">
              {caseStudy.architecture.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-text-primary">
                  <span className="text-accent-primary font-mono shrink-0">&rarr;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Key Metrics */}
          <section className="p-6 rounded-xl border border-accent-primary/30 bg-accent-primary/5">
            <h2 className="text-xl font-semibold mb-4 text-accent-primary flex items-center gap-2">
              <span>★</span> Key Performance Metrics & Impact
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {caseStudy.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-accent-primary/20 bg-bg-base/80"
                >
                  <div className="text-xs font-mono text-accent-primary mb-1">
                    Impact #{idx + 1}
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
