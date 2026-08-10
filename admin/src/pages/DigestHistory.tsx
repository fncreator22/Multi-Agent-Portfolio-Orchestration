import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, AlertCircle, Check, BarChart2, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QueryTheme {
  theme: string;
  count: number;
}

interface DigestSummary {
  digest_code?: string;
  period_start?: string;
  period_end?: string;
  total_leads?: number;
  verified_leads_count?: number;
  bookings_count?: number;
  conversation_turns_count?: number;
  unique_sessions_count?: number;
  top_query_themes?: QueryTheme[] | string[];
}

interface DigestRecord {
  id: number;
  digest_code: string;
  period_start: string;
  period_end: string;
  summary_json: string;
  summary?: DigestSummary;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const DigestHistory: React.FC = () => {
  const { adminEmail, logout } = useAuth();
  const [digests, setDigests] = useState<DigestRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedDigest, setSelectedDigest] = useState<DigestRecord | null>(null);

  const fetchDigests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/digests`);
      if (res.ok) {
        const data = await res.json();
        setDigests(data.digests || []);
        if (data.digests && data.digests.length > 0 && !selectedDigest) {
          setSelectedDigest(data.digests[0]);
        }
      } else {
        setError('Failed to fetch digest history.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching digest history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigests();
  }, []);

  const handleTriggerDigest = async () => {
    setTriggering(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/digests/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 14 }),
      });
      const data = await res.json();
      if (res.ok && data.digest) {
        setMessage(`Fortnightly Digest generated successfully! Code: ${data.digest.digest_code}`);
        fetchDigests();
      } else {
        setError(data.detail || 'Failed to trigger digest generation.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error triggering digest.');
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString();
    } catch {
      return isoStr;
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
            className="px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Knowledge Base Editor
          </Link>
          <Link
            to="/digests"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-accent-primary bg-accent-primary/10 border border-accent-primary/30"
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Fortnightly Performance Digest History
            </h1>
            <p className="text-sm text-text-muted">
              View past performance summaries, lead conversion metrics, booking stats, and recurring visitor query themes.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleTriggerDigest}
              disabled={triggering}
              className="px-4 py-2 bg-accent-primary text-bg-base rounded-lg text-sm font-mono font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2"
            >
              <span className="inline-flex items-center gap-1.5">{triggering ? <><Clock className="w-4 h-4 animate-spin" /> Generating Digest...</> : <><Zap className="w-4 h-4" /> Trigger New Digest</>}</span>
            </button>
          </div>
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
            Loading digest history...
          </div>
        ) : digests.length === 0 ? (
          <div className="border border-text-muted/20 rounded-xl p-12 text-center bg-bg-base space-y-4">
            <div className="flex justify-center"><BarChart2 className="w-10 h-10 text-accent-primary" /></div>
            <div className="text-lg font-semibold text-text-primary">No Fortnightly Digests Found</div>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              No performance digests have been generated yet. Click "Trigger New Digest" above to generate your first fortnightly summary report.
            </p>
            <button
              onClick={handleTriggerDigest}
              disabled={triggering}
              className="px-5 py-2.5 bg-accent-primary text-bg-base font-mono font-bold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {triggering ? 'Generating...' : <><Zap className="w-4 h-4" /> Trigger First Fortnightly Digest</>}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Digest List Sidebar */}
            <div className="lg:col-span-1 border border-text-muted/20 rounded-xl p-4 bg-bg-base space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Stored Digests ({digests.length})
              </h2>
              <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                {digests.map((d) => {
                  const isSelected = selectedDigest?.id === d.id;
                  const s = d.summary || {};
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDigest(d)}
                      className={`w-full text-left p-3.5 rounded-lg text-sm transition-all flex flex-col space-y-2 border ${
                        isSelected
                          ? 'bg-accent-primary/10 border-accent-primary/50 text-accent-primary font-semibold'
                          : 'border-text-muted/15 text-text-muted hover:bg-text-muted/10 hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs">{d.digest_code}</span>
                        <span className="text-[10px] font-mono opacity-80">{formatDate(d.created_at)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                        <div className="bg-bg-base/60 p-1 rounded text-center border border-text-muted/10">
                          <div className="text-[9px] text-text-muted">LEADS</div>
                          <div className="text-accent-primary font-bold">{s.total_leads ?? 0}</div>
                        </div>
                        <div className="bg-bg-base/60 p-1 rounded text-center border border-text-muted/10">
                          <div className="text-[9px] text-text-muted">VERIFIED</div>
                          <div className="text-accent-primary font-bold">{s.verified_leads_count ?? 0}</div>
                        </div>
                        <div className="bg-bg-base/60 p-1 rounded text-center border border-text-muted/10">
                          <div className="text-[9px] text-text-muted">BOOKINGS</div>
                          <div className="text-accent-warn font-bold">{s.bookings_count ?? 0}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Digest Detail View */}
            <div className="lg:col-span-2 border border-text-muted/20 rounded-xl p-6 bg-bg-base space-y-6">
              {selectedDigest ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-text-muted/20 pb-4 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold font-mono text-accent-primary">
                          {selectedDigest.digest_code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary font-mono">
                          Digest #{selectedDigest.id}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-text-muted mt-1">
                        Generated At: {formatDate(selectedDigest.created_at)}
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono text-text-muted">
                      <div>Period Start: {formatDate(selectedDigest.period_start)}</div>
                      <div>Period End: {formatDate(selectedDigest.period_end)}</div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border border-accent-primary/20 bg-accent-primary/5 space-y-1">
                      <div className="text-xs font-mono text-text-muted uppercase">Total Leads</div>
                      <div className="text-2xl font-bold font-mono text-accent-primary">
                        {selectedDigest.summary?.total_leads ?? 0}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">New contact entries</div>
                    </div>

                    <div className="p-4 rounded-lg border border-accent-primary/20 bg-accent-primary/5 space-y-1">
                      <div className="text-xs font-mono text-text-muted uppercase">OTP Verified Leads</div>
                      <div className="text-2xl font-bold font-mono text-accent-primary">
                        {selectedDigest.summary?.verified_leads_count ?? 0}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">Verified email leads</div>
                    </div>

                    <div className="p-4 rounded-lg border border-accent-warn/20 bg-accent-warn/5 space-y-1">
                      <div className="text-xs font-mono text-text-muted uppercase">Bookings Count</div>
                      <div className="text-2xl font-bold font-mono text-accent-warn">
                        {selectedDigest.summary?.bookings_count ?? 0}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">Consultations booked</div>
                    </div>

                    <div className="p-4 rounded-lg border border-text-muted/20 bg-text-muted/5 space-y-1">
                      <div className="text-xs font-mono text-text-muted uppercase">Conversation Turns</div>
                      <div className="text-2xl font-bold font-mono text-text-primary">
                        {selectedDigest.summary?.conversation_turns_count ?? 0}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">Agent chat turns</div>
                    </div>

                    <div className="p-4 rounded-lg border border-text-muted/20 bg-text-muted/5 space-y-1">
                      <div className="text-xs font-mono text-text-muted uppercase">Unique Sessions</div>
                      <div className="text-2xl font-bold font-mono text-text-primary">
                        {selectedDigest.summary?.unique_sessions_count ?? 0}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">Visitor chat sessions</div>
                    </div>
                  </div>

                  {/* Top Recurring Question Themes */}
                  <div className="space-y-3 border-t border-text-muted/20 pt-4">
                    <h3 className="text-sm font-bold font-mono text-accent-primary uppercase tracking-wider inline-flex items-center gap-1.5">
                      <Tag className="w-4 h-4" /> Top 5 Recurring Query Themes
                    </h3>
                    {selectedDigest.summary?.top_query_themes && selectedDigest.summary.top_query_themes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDigest.summary.top_query_themes.map((t, idx) => {
                          if (typeof t === 'object' && t !== null && 'theme' in t) {
                            return (
                              <div
                                key={idx}
                                className="px-3 py-1.5 rounded-lg bg-bg-base border border-accent-primary/30 text-xs font-mono flex items-center space-x-2 text-text-primary"
                              >
                                <span className="font-semibold text-accent-primary">#{t.theme}</span>
                                <span className="px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary text-[10px]">
                                  {t.count} queries
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div
                              key={idx}
                              className="px-3 py-1.5 rounded-lg bg-bg-base border border-accent-primary/30 text-xs font-mono text-accent-primary"
                            >
                              {String(t)}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-text-muted italic">
                        No query themes recorded during this reporting window.
                      </p>
                    )}
                  </div>

                  {/* Raw Summary JSON Drawer */}
                  <div className="space-y-2 border-t border-text-muted/20 pt-4">
                    <h3 className="text-xs font-mono text-text-muted uppercase">Summary JSON Output</h3>
                    <pre className="p-4 rounded-lg bg-bg-base border border-text-muted/20 text-xs font-mono text-accent-primary overflow-x-auto">
                      {JSON.stringify(selectedDigest.summary || {}, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-text-muted font-mono text-sm">
                  Select a digest record from the sidebar to view metrics.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
