import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, AlertCircle, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CaseStudyDetails {
  overview: string;
  problem: string;
  solution: string;
  architecture: string[];
  metrics: string[];
}

interface ProjectMetadata {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  tech: string[];
  githubUrl: string;
  liveUrl: string | null;
  caseStudy: CaseStudyDetails;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const KBEditor: React.FC = () => {
  const { adminEmail, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    description: string;
    techStr: string;
    githubUrl: string;
    liveUrl: string;
    overview: string;
    problem: string;
    solution: string;
    architectureStr: string;
    metricsStr: string;
  }>({
    name: '',
    category: '',
    description: '',
    techStr: '',
    githubUrl: '',
    liveUrl: '',
    overview: '',
    problem: '',
    solution: '',
    architectureStr: '',
    metricsStr: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/kb`);
      const data = await res.json();
      if (res.ok && data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
          populateForm(data.projects[0]);
        } else if (selectedProjectId) {
          const matched = data.projects.find((p: ProjectMetadata) => p.id === selectedProjectId);
          if (matched) populateForm(matched);
        }
      } else {
        setError('Failed to load Knowledge Base projects.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching KB projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const populateForm = (p: ProjectMetadata) => {
    const cs = p.caseStudy || {
      overview: '',
      problem: '',
      solution: '',
      architecture: [],
      metrics: [],
    };

    setFormData({
      name: p.name || '',
      category: p.category || '',
      description: p.description || '',
      techStr: Array.isArray(p.tech) ? p.tech.join(', ') : p.tech || '',
      githubUrl: p.githubUrl || '',
      liveUrl: p.liveUrl || '',
      overview: cs.overview || '',
      problem: cs.problem || '',
      solution: cs.solution || '',
      architectureStr: Array.isArray(cs.architecture) ? cs.architecture.join('\n') : '',
      metricsStr: Array.isArray(cs.metrics) ? cs.metrics.join('\n') : '',
    });
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setMessage(null);
    setError(null);
    const matched = projects.find((p) => p.id === id);
    if (matched) {
      populateForm(matched);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    const currentProject = projects.find((p) => p.id === selectedProjectId);

    const updatedProject: ProjectMetadata = {
      id: selectedProjectId,
      slug: currentProject?.slug || selectedProjectId,
      name: formData.name,
      category: formData.category,
      description: formData.description,
      tech: formData.techStr.split(',').map((t) => t.trim()).filter(Boolean),
      githubUrl: formData.githubUrl,
      liveUrl: formData.liveUrl.trim() ? formData.liveUrl.trim() : null,
      caseStudy: {
        overview: formData.overview,
        problem: formData.problem,
        solution: formData.solution,
        architecture: formData.architectureStr.split('\n').map((line) => line.trim()).filter(Boolean),
        metrics: formData.metricsStr.split('\n').map((line) => line.trim()).filter(Boolean),
      },
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/kb/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Project metadata & case study updated successfully!');
        if (data.projects) {
          setProjects(data.projects);
        }
      } else {
        setError(data.detail || 'Failed to update project.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error saving project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-display flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-text-muted/20 bg-bg-base/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold font-mono text-accent-primary inline-flex items-center gap-1.5"><Zap className="w-5 h-5" /> Admin Portal</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono">
            {adminEmail || 'authenticated'}
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            to="/leads"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Leads & Bookings
          </Link>
          <Link
            to="/kb"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-accent-primary bg-accent-primary/10 border border-accent-primary/30"
          >
            Knowledge Base Editor
          </Link>
          <Link
            to="/digests"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Fortnightly Digests
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-md text-sm font-medium border border-text-muted/30 text-text-muted hover:text-accent-warn hover:border-accent-warn/40 transition-colors"
          >
            Log Out
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Knowledge Base & Case Study Editor
          </h1>
          <p className="text-sm text-text-muted">
            Modify project specifications, technical stack details, and case study metrics.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-sm font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-sm font-mono flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-text-muted font-mono animate-pulse">
            Loading Knowledge Base entries...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Project List Sidebar */}
            <div className="lg:col-span-1 border border-text-muted/20 rounded-xl p-4 bg-bg-base space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Select Project ({projects.length})
              </h2>
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProject(p.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all flex flex-col space-y-1 border ${
                      selectedProjectId === p.id
                        ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary font-semibold'
                        : 'border-transparent text-text-muted hover:bg-text-muted/10 hover:text-text-primary'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] font-mono text-text-muted truncate">{p.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Form */}
            <div className="lg:col-span-3 border border-text-muted/20 rounded-xl p-6 bg-bg-base">
              {selectedProjectId ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-text-muted/20 pb-4">
                    <h2 className="text-lg font-bold text-accent-primary font-mono">
                      Editing: {formData.name || selectedProjectId}
                    </h2>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-accent-primary text-bg-base font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm font-mono disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Case Study Updates</>}
                    </button>
                  </div>

                  {/* General Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                      Short Description
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                      Tech Stack (Comma-Separated)
                    </label>
                    <input
                      type="text"
                      value={formData.techStr}
                      onChange={(e) => setFormData({ ...formData, techStr: e.target.value })}
                      placeholder="TypeScript, React, Python, FastAPI"
                      className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-accent-primary font-mono text-sm focus:border-accent-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                        GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm font-mono focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                        Live Demo URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.liveUrl}
                        onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                        placeholder="https://demo.app (or empty)"
                        className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm font-mono focus:border-accent-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Case Study Details */}
                  <div className="border-t border-text-muted/20 pt-4 space-y-4">
                    <h3 className="text-sm font-bold font-mono text-accent-primary uppercase tracking-wider">
                      Case Study Deep-Dive
                    </h3>

                    <div>
                      <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                        Overview
                      </label>
                      <textarea
                        rows={3}
                        value={formData.overview}
                        onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                        className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                          Problem Statement
                        </label>
                        <textarea
                          rows={3}
                          value={formData.problem}
                          onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                          className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                          Solution Architecture
                        </label>
                        <textarea
                          rows={3}
                          value={formData.solution}
                          onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                          className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                          Architecture Highlights (One per line)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.architectureStr}
                          onChange={(e) => setFormData({ ...formData, architectureStr: e.target.value })}
                          placeholder="Line 1 architecture bullet point&#10;Line 2 architecture bullet point"
                          className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-text-primary text-sm font-mono focus:border-accent-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                          Key Performance Metrics (One per line)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.metricsStr}
                          onChange={(e) => setFormData({ ...formData, metricsStr: e.target.value })}
                          placeholder="99.4% uptime score&#10;Sub-millisecond inference latency"
                          className="w-full px-3 py-2 bg-bg-base border border-text-muted/30 rounded text-accent-primary text-sm font-mono focus:border-accent-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-text-muted/20 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-accent-primary text-bg-base font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm font-mono disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {saving ? 'Saving Changes...' : <><Save className="w-4 h-4" /> Save Case Study Updates</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center text-text-muted font-mono text-sm">
                  Select a project from the sidebar to edit.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
