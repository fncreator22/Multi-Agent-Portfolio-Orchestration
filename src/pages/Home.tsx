import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EntranceScene, GuardianVisualizer } from '../components/canvas';
import { PROJECTS } from '../constants/projects';
import { BIO_DATA } from '../constants/bio';

export const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(PROJECTS.map((p) => p.category)))];

  const filteredProjects = selectedCategory === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Header & Visualizers */}
        <header className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-accent-primary mb-3">
                Agentic Portfolio Ecosystem
              </h1>
              <p className="text-text-muted max-w-2xl text-lg">
                Interactive portfolio platform featuring agentic evaluation suites, computer vision pipelines, and production web platforms.
              </p>
            </div>

            {/* Persistent Agent State Visualizer */}
            <div className="shrink-0">
              <GuardianVisualizer />
            </div>
          </div>

          {/* Entrance Canvas Scene */}
          <div className="w-full rounded-2xl overflow-hidden border border-accent-primary/20 bg-bg-base/40 p-2">
            <EntranceScene />
          </div>
        </header>

        {/* Bio & Skills Section */}
        <section className="border border-accent-primary/20 bg-bg-base/40 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-accent-primary/20 pb-4">
            <span className="text-accent-primary font-bold">About System Architect</span>
          </div>

          <p className="text-text-primary text-sm leading-relaxed max-w-4xl">
            {BIO_DATA.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {BIO_DATA.skills.map((skillGroup) => (
              <div key={skillGroup.category} className="border border-accent-primary/20 bg-bg-base p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-mono text-accent-warn font-semibold uppercase tracking-wider">
                  {skillGroup.category}
                </h4>
                <ul className="space-y-1">
                  {skillGroup.items.map((item) => (
                    <li key={item} className="text-xs text-text-muted flex items-center gap-1.5">
                      <span className="text-accent-primary">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Category Filters */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-text-muted mr-2">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-mono px-3 py-1.5 rounded transition-all ${
                  selectedCategory === cat
                    ? 'bg-accent-primary text-bg-base font-semibold'
                    : 'border border-text-muted/20 text-text-muted hover:border-accent-primary/40 hover:text-accent-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Listing Section */}
        <section id="projects-section" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <span className="text-accent-primary">◆</span>
              Featured Projects
              <span className="text-xs font-mono text-text-muted ml-2">({filteredProjects.length})</span>
            </h2>
          </div>

          {/* Cinematic View: Card Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between border border-accent-primary/20 bg-bg-base/60 backdrop-blur rounded-2xl p-6 hover:border-accent-primary/60 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-primary/5"
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
                      GitHub &rarr;
                    </a>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                    {project.name}
                  </h3>

                  <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-mono px-2 py-0.5 rounded border border-text-muted/20 text-text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-text-muted/10 flex items-center justify-between">
                  <Link
                    to={`/projects/${project.slug}`}
                    className="text-xs font-mono font-semibold px-4 py-2 rounded-lg bg-accent-primary/10 text-accent-primary border border-accent-primary/30 group-hover:bg-accent-primary group-hover:text-bg-base transition-all inline-flex items-center gap-2"
                  >
                    View Case Study <span>&rarr;</span>
                  </Link>

                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-accent-warn hover:underline"
                    >
                      Live Demo
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
