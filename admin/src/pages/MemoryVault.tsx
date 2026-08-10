import React, { useEffect, useState } from 'react';
import {
  Archive,
  MessageSquare,
  Layers,
  UserCheck,
  Clock,
  Search,
  RotateCcw,
  Trash2,
  Download,
  X,
  AlertCircle,
  Check,
  FileText,
  Filter,
  ShieldAlert,
  Link2
} from 'lucide-react';

interface ConversationTurn {
  id: number;
  session_id: string;
  lead_id: number | null;
  email: string | null;
  visitor_message: string;
  agent_stage: string;
  agent_response: string;
  created_at: string;
}

interface MemoryVaultStats {
  total_conversations: number;
  total_sessions: number;
  converted_leads: number;
  retention_days: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const MemoryVault: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationTurn[]>([]);
  const [stats, setStats] = useState<MemoryVaultStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [leadFilter, setLeadFilter] = useState<string>('');

  // Drawer state for transcript view
  const [selectedTurn, setSelectedTurn] = useState<ConversationTurn | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Purge Modal state
  const [purgeModalOpen, setPurgeModalOpen] = useState<boolean>(false);
  const [purgeDays, setPurgeDays] = useState<number>(60);
  const [purging, setPurging] = useState<boolean>(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/memory-vault/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {
          total_conversations: data.total_conversations ?? 0,
          total_sessions: data.total_sessions ?? 0,
          converted_leads: data.converted_leads ?? 0,
          retention_days: data.retention_days ?? 60
        });
      }
    } catch (err: any) {
      console.error('Error fetching vault stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (sessionFilter.trim()) params.append('session_id', sessionFilter.trim());
      if (leadFilter.trim()) params.append('lead_id', leadFilter.trim());

      const url = `${API_BASE_URL}/api/admin/memory-vault/conversations?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      } else {
        setError('Failed to fetch conversation turns.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading Memory Vault conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchConversations();
  }, []);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchConversations();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSessionFilter('');
    setLeadFilter('');
    setTimeout(() => {
      fetchConversations();
    }, 0);
  };

  const handleExport = async (session_id?: string, lead_id?: number | null) => {
    try {
      const params = new URLSearchParams();
      if (session_id) params.append('session_id', session_id);
      if (lead_id) params.append('lead_id', String(lead_id));

      const url = `${API_BASE_URL}/api/admin/memory-vault/export?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `transcript_export_${session_id || lead_id || 'all'}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        alert('Failed to export transcript.');
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleExecutePurge = async () => {
    setPurging(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/memory-vault/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention_days: purgeDays }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Data Minimization Purge Complete! ${data.deleted_count ?? 0} conversation turn(s) older than ${purgeDays} days purged.`);
        setPurgeModalOpen(false);
        fetchStats();
        fetchConversations();
      } else {
        setError(data.detail || 'Purge operation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing purge.');
    } finally {
      setPurging(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Archive className="w-6 h-6 text-accent-primary" /> Memory Vault & Conversation Telemetry
          </h1>
          <p className="text-sm text-text-muted font-body">
            Audit multi-turn agent conversations, filter cross-session visitor threads, and enforce automated data retention rules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleExport(sessionFilter || undefined, leadFilter ? Number(leadFilter) : undefined)}
            className="px-4 py-2 bg-panel backdrop-blur border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/10 text-xs font-mono font-bold rounded-lg transition-all flex items-center space-x-2 shadow-soft"
          >
            <Download className="w-4 h-4" />
            <span>Export Filtered JSON</span>
          </button>
          <button
            onClick={() => setPurgeModalOpen(true)}
            className="px-4 py-2 bg-accent-warn/10 border border-accent-warn/30 text-accent-warn hover:bg-accent-warn/20 text-xs font-mono font-bold rounded-lg transition-all flex items-center space-x-2 shadow-soft"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purge Records</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 4 Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Total Conversations</span>
            <MessageSquare className="w-5 h-5 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-primary">
            {statsLoading ? '...' : (stats?.total_conversations ?? 0)}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Logged agent turn records</div>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Unique Sessions</span>
            <Layers className="w-5 h-5 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-text-primary">
            {statsLoading ? '...' : (stats?.total_sessions ?? 0)}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Distinct visitor sessions</div>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Converted Leads</span>
            <UserCheck className="w-5 h-5 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-primary">
            {statsLoading ? '...' : (stats?.converted_leads ?? 0)}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Linked OTP lead threads</div>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Active Retention Window</span>
            <ShieldAlert className="w-5 h-5 text-accent-warn" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-warn">
            {statsLoading ? '...' : `${stats?.retention_days ?? 60} Days`}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Data minimization window</div>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6">
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-accent-primary font-bold uppercase">
            <Filter className="w-4 h-4" /> Filter Conversation Records
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Keyword Query (q)</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search messages, responses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg-base/80 border border-accent-primary/20 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Session ID Filter</label>
              <input
                type="text"
                placeholder="e.g. sess-12345"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="w-full bg-bg-base/80 border border-accent-primary/20 rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-muted mb-1">Linked Lead ID Filter</label>
              <input
                type="text"
                placeholder="e.g. 1"
                value={leadFilter}
                onChange={(e) => setLeadFilter(e.target.value)}
                className="w-full bg-bg-base/80 border border-accent-primary/20 rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-accent-primary/10">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-lg border border-accent-primary/20 text-text-muted hover:text-text-primary text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-accent-primary text-bg-base text-xs font-mono font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Thread List Section */}
      <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-accent-primary/20 pb-4">
          <h2 className="text-sm font-bold font-mono text-accent-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Conversation Turns ({conversations.length})
          </h2>
          <span className="text-xs font-mono text-text-muted">
            Showing matching records from database
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-text-muted font-mono animate-pulse text-xs">
            Loading conversation records...
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 text-center text-text-muted font-mono text-xs space-y-2">
            <div>No conversation records found matching the current criteria.</div>
            <button onClick={handleResetFilters} className="text-accent-primary underline hover:opacity-80">
              Clear filters and reload
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((turn) => (
              <div
                key={turn.id}
                className="p-4 rounded-xl border border-accent-primary/15 bg-bg-base/50 hover:bg-bg-base/90 transition-all space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/10 pb-2">
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="font-bold text-accent-primary">#{turn.id}</span>
                    <span className="px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-[10px]">
                      Session: {turn.session_id}
                    </span>
                    {turn.lead_id && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> Lead #{turn.lead_id} {turn.email ? `(${turn.email})` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-text-muted">
                    <span className="px-2 py-0.5 rounded bg-bg-base border border-accent-primary/20 text-accent-primary">
                      {turn.agent_stage}
                    </span>
                    <span>{formatDate(turn.created_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                  <div className="space-y-1">
                    <div className="text-[10px] text-text-muted uppercase">Visitor Input</div>
                    <p className="text-text-primary bg-bg-base/80 p-2.5 rounded-lg border border-accent-primary/10 line-clamp-3">
                      "{turn.visitor_message}"
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-text-muted uppercase">Agent Response</div>
                    <p className="text-text-muted bg-bg-base/80 p-2.5 rounded-lg border border-accent-primary/10 line-clamp-3">
                      {turn.agent_response}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedTurn(turn);
                      setDrawerOpen(true);
                    }}
                    className="px-3 py-1 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 text-accent-primary text-[11px] font-mono font-bold rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Transcript Drawer
                  </button>
                  <button
                    onClick={() => handleExport(turn.session_id)}
                    className="px-3 py-1 bg-bg-base hover:bg-panel border border-accent-primary/20 text-text-muted hover:text-accent-primary text-[11px] font-mono rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Transcript View Drawer / Side Panel */}
      {drawerOpen && selectedTurn && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-panel border-l border-accent-primary/30 h-full p-6 flex flex-col space-y-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-accent-primary/20 pb-4">
              <div>
                <h2 className="text-lg font-bold font-mono text-accent-primary flex items-center gap-2">
                  <Archive className="w-5 h-5" /> Transcript Turn Detail
                </h2>
                <div className="text-xs font-mono text-text-muted mt-1">
                  Turn ID: #{selectedTurn.id} | Session: {selectedTurn.session_id}
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg border border-accent-primary/20 text-text-muted hover:text-text-primary hover:bg-accent-primary/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-bg-base/80 p-3 rounded-xl border border-accent-primary/20">
                  <div className="text-[10px] text-text-muted uppercase mb-1">Session ID</div>
                  <div className="text-accent-primary font-bold">{selectedTurn.session_id}</div>
                </div>

                <div className="bg-bg-base/80 p-3 rounded-xl border border-accent-primary/20">
                  <div className="text-[10px] text-text-muted uppercase mb-1">Linked Lead</div>
                  <div className="text-text-primary font-bold">
                    {selectedTurn.lead_id ? `Lead #${selectedTurn.lead_id}` : 'Unlinked'}
                    {selectedTurn.email ? ` (${selectedTurn.email})` : ''}
                  </div>
                </div>

                <div className="bg-bg-base/80 p-3 rounded-xl border border-accent-primary/20">
                  <div className="text-[10px] text-text-muted uppercase mb-1">Agent Stage</div>
                  <div className="text-accent-primary font-bold">{selectedTurn.agent_stage}</div>
                </div>

                <div className="bg-bg-base/80 p-3 rounded-xl border border-accent-primary/20">
                  <div className="text-[10px] text-text-muted uppercase mb-1">Timestamp</div>
                  <div className="text-text-primary font-bold">{formatDate(selectedTurn.created_at)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-accent-primary uppercase">
                  Visitor Query / Prompt
                </label>
                <div className="p-4 rounded-xl bg-bg-base border border-accent-primary/20 text-xs font-mono text-text-primary whitespace-pre-wrap">
                  {selectedTurn.visitor_message}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-accent-primary uppercase">
                  Agent Response
                </label>
                <div className="p-4 rounded-xl bg-bg-base border border-accent-primary/20 text-xs font-mono text-text-muted whitespace-pre-wrap">
                  {selectedTurn.agent_response}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-text-muted uppercase">
                  Raw Turn Record Object
                </label>
                <pre className="p-4 rounded-xl bg-bg-base border border-accent-primary/20 text-[11px] font-mono text-accent-primary overflow-x-auto">
                  {JSON.stringify(selectedTurn, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-accent-primary/20 flex items-center justify-between">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 border border-accent-primary/20 text-text-muted hover:text-text-primary text-xs font-mono rounded-lg transition-all"
              >
                Close Drawer
              </button>
              <button
                onClick={() => handleExport(selectedTurn.session_id)}
                className="px-4 py-2 bg-accent-primary text-bg-base font-mono font-bold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Thread Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Minimization Purge Modal */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-panel border border-accent-warn/40 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-accent-warn/20 pb-3">
              <h3 className="text-base font-bold font-mono text-accent-warn flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-accent-warn" /> Data Minimization Purge
              </h3>
              <button onClick={() => setPurgeModalOpen(false)}>
                <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
              </button>
            </div>

            <p className="text-xs font-body text-text-muted leading-relaxed">
              This action will permanently delete all conversation turns older than the specified retention window from the SQLite database.
            </p>

            <div>
              <label className="block text-xs font-mono text-text-primary mb-1">
                Purge Records Older Than (Days):
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={purgeDays}
                onChange={(e) => setPurgeDays(Number(e.target.value))}
                className="w-full bg-bg-base border border-accent-warn/30 rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent-warn"
              />
            </div>

            <div className="p-3 bg-accent-warn/10 border border-accent-warn/30 rounded-lg text-[11px] font-mono text-accent-warn space-y-1">
              <div className="font-bold uppercase flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Warning
              </div>
              <div>Deleted transcript records cannot be recovered after purging.</div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-accent-warn/20">
              <button
                type="button"
                onClick={() => setPurgeModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-accent-primary/20 text-xs font-mono text-text-muted hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={purging}
                className="px-4 py-2 rounded-lg bg-accent-warn text-bg-base font-mono font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {purging ? 'Purging...' : 'Confirm Data Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
