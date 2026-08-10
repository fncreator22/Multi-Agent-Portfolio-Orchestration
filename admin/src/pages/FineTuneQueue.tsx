import React, { useEffect, useState } from 'react';
import { Cpu, Check, X, RotateCcw, Play, Database, Activity, Layers, AlertCircle, Clock, Sparkles } from 'lucide-react';

interface FinetuneItem {
  id: number;
  session_id: string;
  visitor_query: string;
  context_retrieved: string;
  llm_response: string;
  grounding_score: number;
  status: string;
  approved_at?: string | null;
  created_at: string;
}

interface ModelVersion {
  id: number;
  version_tag: string;
  base_model: string;
  dataset_size: number;
  is_active: number;
  created_at: string;
}

interface FinetuneStatus {
  last_finetune_date?: string | null;
  dataset_size?: number;
  active_model_version?: string | null;
  pending_queue_count?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const FineTuneQueue: React.FC = () => {
  const [statusData, setStatusData] = useState<FinetuneStatus | null>(null);
  const [queue, setQueue] = useState<FinetuneItem[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, queueRes, versionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/finetune/status`),
        fetch(`${API_BASE_URL}/api/admin/finetune/queue?status=${filterStatus}`),
        fetch(`${API_BASE_URL}/api/admin/finetune/versions`),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatusData(sData);
      }
      if (queueRes.ok) {
        const qData = await queueRes.json();
        setQueue(qData.queue || []);
      }
      if (versionsRes.ok) {
        const vData = await versionsRes.json();
        setVersions(vData.versions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching SLM fine-tune data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [filterStatus]);

  const handleReview = async (itemId: number, newStatus: 'approved' | 'rejected') => {
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/finetune/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Item #${itemId} marked as ${newStatus}.`);
        await fetchAllData();
      } else {
        setError(data.detail || 'Failed to update review status.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating review status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunFinetune = async () => {
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/finetune/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Fine-tune cycle completed successfully!');
        await fetchAllData();
      } else {
        setError(data.detail || 'Failed to trigger fine-tune cycle.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error triggering fine-tune cycle.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (versionId: number, versionTag: string) => {
    if (!window.confirm(`Are you sure you want to rollback active model to version ${versionTag}?`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/finetune/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Successfully rolled back active model to ${versionTag}.`);
        await fetchAllData();
      } else {
        setError(data.detail || 'Failed to rollback model version.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error rolling back model version.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString();
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Cpu className="w-6 h-6 text-accent-primary" /> SLM Fine-Tune Queue & Version Controller
          </h1>
          <p className="text-sm text-text-muted font-body">
            Review Stage 3 LLM interaction turns, approve grounding samples, trigger automated fine-tuning, and manage active model version rollbacks.
          </p>
        </div>

        <button
          onClick={handleRunFinetune}
          disabled={actionLoading}
          className="px-5 py-2.5 bg-accent-primary text-bg-base rounded-lg text-sm font-mono font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2 shadow-soft shrink-0"
        >
          {actionLoading ? (
            <><Clock className="w-4 h-4 animate-spin" /> Processing Job...</>
          ) : (
            <><Play className="w-4 h-4" /> Trigger Fine-Tune Cycle</>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-sm font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-4 rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-sm font-mono flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-accent-primary" />
          <span>{message}</span>
        </div>
      )}

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-1">
          <div className="text-xs font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Active Model Version</span>
            <Layers className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-accent-primary truncate">
            {statusData?.active_model_version || 'None'}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Current deployed SLM tag</div>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-1">
          <div className="text-xs font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Approved Dataset Size</span>
            <Database className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">
            {statusData?.dataset_size ?? 0}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Approved fine-tune turns</div>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-1">
          <div className="text-xs font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-accent-warn" />
          </div>
          <div className="text-2xl font-bold font-mono text-accent-warn">
            {statusData?.pending_queue_count ?? 0}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Awaiting admin review</div>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-1">
          <div className="text-xs font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Last Fine-Tune</span>
            <Sparkles className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-xs font-bold font-mono text-text-primary truncate">
            {formatDate(statusData?.last_finetune_date)}
          </div>
          <div className="text-[10px] text-text-muted font-mono">Last executed training job</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fine-Tune Review Queue (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-accent-primary/20 pb-4">
              <h2 className="text-sm font-bold font-mono text-accent-primary uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Stage 3 Turn Review Queue
              </h2>

              {/* Status Filter Buttons */}
              <div className="flex items-center space-x-1.5 bg-bg-base/60 p-1 rounded-lg border border-accent-primary/10 font-mono text-xs">
                {['pending', 'approved', 'rejected', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-md capitalize transition-all ${
                      filterStatus === st
                        ? 'bg-accent-primary text-bg-base font-bold shadow-sm'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-text-muted font-mono animate-pulse">
                Loading fine-tune queue items...
              </div>
            ) : queue.length === 0 ? (
              <div className="py-12 text-center text-text-muted font-mono text-sm space-y-2">
                <div>No queue items found matching filter "{filterStatus}".</div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl bg-bg-base/60 border border-accent-primary/20 space-y-3 shadow-sm hover:border-accent-primary/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent-primary/10 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-accent-primary">
                          Item #{item.id}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted bg-panel px-2 py-0.5 rounded border border-accent-primary/10">
                          Sess: {item.session_id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            item.grounding_score >= 0.7
                              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                              : 'bg-accent-warn/10 text-accent-warn border-accent-warn/30'
                          }`}
                        >
                          Score: {item.grounding_score.toFixed(2)}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            item.status === 'approved'
                              ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/40'
                              : item.status === 'rejected'
                              ? 'bg-accent-warn/20 text-accent-warn border-accent-warn/40'
                              : 'bg-panel text-text-muted border-accent-primary/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-text-muted uppercase text-[10px]">Visitor Query:</span>
                        <p className="text-text-primary mt-0.5 bg-panel/80 p-2.5 rounded-lg border border-accent-primary/10">
                          {item.visitor_query}
                        </p>
                      </div>

                      <div>
                        <span className="text-text-muted uppercase text-[10px]">Retrieved Context:</span>
                        <p className="text-text-muted mt-0.5 bg-panel/50 p-2 rounded-lg border border-accent-primary/10 text-[11px] max-h-24 overflow-y-auto">
                          {item.context_retrieved || 'No context'}
                        </p>
                      </div>

                      <div>
                        <span className="text-text-muted uppercase text-[10px]">LLM Response:</span>
                        <p className="text-accent-primary mt-0.5 bg-panel/80 p-2.5 rounded-lg border border-accent-primary/10">
                          {item.llm_response}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-accent-primary/10">
                      <span className="text-[10px] font-mono text-text-muted">
                        Created: {formatDate(item.created_at)}
                      </span>

                      {item.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReview(item.id, 'approved')}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-accent-primary text-bg-base text-xs font-mono font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" /> <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReview(item.id, 'rejected')}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg border border-accent-warn/40 text-accent-warn hover:bg-accent-warn/10 text-xs font-mono font-bold transition-colors disabled:opacity-50 flex items-center space-x-1"
                          >
                            <X className="w-3.5 h-3.5" /> <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Model Version History & Rollback Sidebar (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-4">
            <h2 className="text-sm font-bold font-mono text-accent-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Model Version History
            </h2>

            {versions.length === 0 ? (
              <div className="py-8 text-center text-text-muted font-mono text-xs">
                No model versions recorded yet. Trigger a fine-tune cycle to build version history.
              </div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-xl border space-y-2 transition-all ${
                      ver.is_active
                        ? 'bg-accent-primary/10 border-accent-primary/50 shadow-sm'
                        : 'bg-bg-base/40 border-accent-primary/10 hover:border-accent-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-text-primary">
                        {ver.version_tag}
                      </span>
                      {ver.is_active === 1 ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-primary text-bg-base">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded-full bg-panel border border-accent-primary/10">
                          INACTIVE
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-text-muted">
                      <div>Base: <span className="text-text-primary">{ver.base_model}</span></div>
                      <div>Dataset: <span className="text-text-primary">{ver.dataset_size} items</span></div>
                    </div>

                    <div className="text-[10px] font-mono text-text-muted">
                      Created: {formatDate(ver.created_at)}
                    </div>

                    {!ver.is_active && (
                      <button
                        onClick={() => handleRollback(ver.id, ver.version_tag)}
                        disabled={actionLoading}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/10 text-xs font-mono transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback to Version</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FineTuneQueue;
