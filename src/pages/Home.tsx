import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, FolderGit2, ExternalLink, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { EntranceScene, GuardianVisualizer } from '../components/canvas';
import { PROJECTS } from '../constants/projects';
import { BIO_DATA } from '../constants/bio';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const headerReveal = useScrollReveal<HTMLElement>();
  const bioReveal = useScrollReveal<HTMLElement>();
  const filterReveal = useScrollReveal<HTMLDivElement>();
  const projectsReveal = useScrollReveal<HTMLElement>();

  const categories = ['All', ...Array.from(new Set(PROJECTS.map((p) => p.category)))];

  const filteredProjects = selectedCategory === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Header & Visualizers */}
        <header
          ref={headerReveal.ref}
          className={`bg-panel backdrop-blur shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-8 reveal-element ${
            headerReveal.isVisible ? 'is-visible' : ''
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-xs font-mono text-accent-primary">
                <Terminal className="w-3.5 h-3.5" />
                <span>Multi-Agent System & Portfolio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-primary tracking-tight">
                Agentic Portfolio Ecosystem
              </h1>
              <p className="text-text-muted max-w-2xl text-base md:text-lg leading-relaxed">
                Interactive platform featuring autonomous agent evaluation suites, Model Context Protocol (MCP) servers, computer vision pipelines, and full-stack enterprise applications.
              </p>
            </div>

            {/* Persistent Agent State Visualizer */}
            <div className="shrink-0 flex justify-center">
              <GuardianVisualizer />
            </div>
          </div>

          {/* Entrance Canvas Scene */}
          <div className="w-full bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-3 overflow-hidden">
            <EntranceScene />
          </div>
        </header>

        {/* Bio & Skills Overview Section */}
        <section
          ref={bioReveal.ref}
          className={`bg-panel backdrop-blur shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6 reveal-element ${
            bioReveal.isVisible ? 'is-visible' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-accent-primary/20 pb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent-primary" />
              <h2 className="text-xl font-bold text-text-primary">System Architect Overview</h2>
            </div>
            <Link
              to="/about"
              className="text-xs font-mono text-accent-primary hover:underline flex items-center gap-1"
            >
              Full Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-text-primary text-sm md:text-base leading-relaxed max-w-4xl font-body">
            {BIO_DATA.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {BIO_DATA.skills.map((skillGroup, idx) => (
              <div
                key={skillGroup.category}
                className={`bg-panel backdrop-blur shadow-soft rounded-lg p-4 border border-accent-primary/20 space-y-2 reveal-element ${
                  bioReveal.isVisible ? 'is-visible' : ''
                } stagger-${(idx % 4) + 1}`}
              >
                <h4 className="text-xs font-mono text-accent-warn font-bold uppercase tracking-wider">
                  {skillGroup.category}
                </h4>
                <ul className="space-y-1.5">
                  {skillGroup.items.map((item) => (
                    <li key={item} className="text-xs text-text-muted font-mono flex items-center gap-2">
                      <span className="text-accent-primary">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <div
          ref={filterReveal.ref}
          className={`bg-panel backdrop-blur shadow-soft rounded-xl p-4 border border-accent-primary/20 space-y-3 reveal-element ${
            filterReveal.isVisible ? 'is-visible' : ''
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-text-muted mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-accent-primary" /> Filter Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-accent-primary text-bg-base font-bold shadow'
                    : 'border border-accent-primary/20 text-text-muted hover:border-accent-primary/40 hover:text-accent-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Listing Section */}
        <section
          ref={projectsReveal.ref}
          id="projects-section"
          className={`space-y-6 reveal-element ${projectsReveal.isVisible ? 'is-visible' : ''}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <FolderGit2 className="w-6 h-6 text-accent-primary" />
              Featured Projects & Case Studies
              <span className="text-xs font-mono text-text-muted ml-2">({filteredProjects.length})</span>
            </h2>
          </div>

          {/* Card Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id}
                className={`group relative flex flex-col justify-between bg-panel backdrop-blur shadow-soft rounded-lg border border-accent-primary/20 p-6 hover:border-accent-primary/60 transition-all duration-300 transform hover:-translate-y-1 reveal-element ${
                  projectsReveal.isVisible ? 'is-visible' : ''
                } stagger-${(idx % 4) + 1}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-accent-primary/30 text-accent-primary bg-accent-primary/10">
                      {project.category}
                    </span>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-accent-primary transition-colors text-xs font-mono flex items-center gap-1"
                      title="GitHub Repository"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                    {project.name}
                  </h3>

                  <p className="text-sm text-text-muted line-clamp-2 leading-relaxed font-body">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-mono px-2 py-0.5 rounded border border-text-muted/20 text-text-muted bg-bg-base/40"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-text-muted/15 flex items-center justify-between">
                  <Link
                    to={`/projects/${project.slug}`}
                    className="text-xs font-mono font-semibold px-4 py-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/30 group-hover:bg-accent-primary group-hover:text-bg-base transition-all inline-flex items-center gap-2"
                  >
                    <span>View Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-accent-warn hover:underline flex items-center gap-1"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
