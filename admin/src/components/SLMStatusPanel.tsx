import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, RefreshCw, Activity, Layers, Database, Clock, ArrowRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export interface SLMStatusData {
  reachability?: string;
  base_url?: string;
  model?: string;
  latency_ms?: number;
  active_model_version?: string | null;
  last_finetune_date?: string | null;
  dataset_size?: number;
  pending_queue_count?: number;
  details?: string;
  slm_health?: {
    reachability?: string;
    base_url?: string;
    model?: string;
    latency_ms?: number;
  };
  finetune_stats?: {
    active_model_version?: string | null;
    last_finetune_date?: string | null;
    pending_queue_count?: number;
    dataset_size?: number;
  };
}

interface SLMStatusPanelProps {
  className?: string;
  onRefreshFinished?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const SLMStatusPanel: React.FC<SLMStatusPanelProps> = ({ className = '', onRefreshFinished }) => {
  const [data, setData] = useState<SLMStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/slm/status`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError(`Failed to fetch SLM status (HTTP ${res.status})`);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to SLM status endpoint');
    } finally {
      setLoading(false);
      if (onRefreshFinished) onRefreshFinished();
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const reachability = (data?.reachability || data?.slm_health?.reachability || 'OFFLINE').toUpperCase();
  const isOnline = reachability === 'ONLINE';

  const baseUrl = data?.base_url || data?.slm_health?.base_url || 'http://localhost:11434';
  const modelName = data?.model || data?.slm_health?.model || 'llama3.2:3b';
  const latencyMs = data?.latency_ms ?? data?.slm_health?.latency_ms ?? 0;

  const activeVersion = data?.active_model_version || data?.finetune_stats?.active_model_version || 'None';
  const lastFinetuneDate = data?.last_finetune_date || data?.finetune_stats?.last_finetune_date || null;
  const datasetSize = data?.dataset_size ?? data?.finetune_stats?.dataset_size ?? 0;
  const pendingCount = data?.pending_queue_count ?? data?.finetune_stats?.pending_queue_count ?? 0;

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
    <div className={`bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent-primary/10 pb-3">
        <div className="flex items-center space-x-3">
          <Cpu className="w-5 h-5 text-accent-primary" />
          <div>
            <h3 className="text-sm font-bold font-mono text-text-primary tracking-wide flex items-center gap-2">
              SLM Endpoint & Model Monitor
            </h3>
            <p className="text-[11px] text-text-muted font-body">
              Real-time Ollama host health, latency telemetry, and fine-tuning version status.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Pulse Indicator */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 border ${
              isOnline
                ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                : 'bg-accent-warn/10 border-accent-warn/30 text-accent-warn'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-accent-primary animate-pulse' : 'bg-accent-warn'
              }`}
            />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchStatus()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-accent-primary/20 text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Manual Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Host & Model */}
        <div className="bg-bg-base/60 rounded-lg p-3.5 border border-accent-primary/10 space-y-1">
          <div className="text-[10px] font-mono text-text-muted uppercase flex items-center justify-between">
            <span>SLM Host & Model</span>
            <Activity className="w-3.5 h-3.5 text-accent-primary" />
          </div>
          <div className="text-xs font-bold font-mono text-text-primary truncate">
            {modelName}
          </div>
          <div className="text-[10px] font-mono text-text-muted truncate">
            {baseUrl}
          </div>
        </div>

        {/* Latency & Active Version */}
        <div className="bg-bg-base/60 rounded-lg p-3.5 border border-accent-primary/10 space-y-1">
          <div className="text-[10px] font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Latency & Active Tag</span>
            <Layers className="w-3.5 h-3.5 text-accent-primary" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold font-mono text-accent-primary">
              {latencyMs} ms
            </span>
            <span className="text-[10px] font-mono text-text-muted">•</span>
            <span className="text-xs font-mono font-semibold text-text-primary truncate">
              {activeVersion}
            </span>
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            Active version deployment
          </div>
        </div>

        {/* Fine-Tune & Dataset Size */}
        <div className="bg-bg-base/60 rounded-lg p-3.5 border border-accent-primary/10 space-y-1">
          <div className="text-[10px] font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Last Fine-Tune & Dataset</span>
            <Database className="w-3.5 h-3.5 text-accent-primary" />
          </div>
          <div className="text-xs font-bold font-mono text-text-primary truncate">
            {formatDate(lastFinetuneDate)}
          </div>
          <div className="text-[10px] font-mono text-text-muted">
            Dataset Size: <span className="font-bold text-accent-primary">{datasetSize} items</span>
          </div>
        </div>

        {/* Pending Queue Review Quick Link */}
        <div className="bg-bg-base/60 rounded-lg p-3.5 border border-accent-primary/10 space-y-1 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-text-muted uppercase flex items-center justify-between">
            <span>Pending Review Queue</span>
            <Clock className="w-3.5 h-3.5 text-accent-warn" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-lg font-bold font-mono text-accent-warn">
              {pendingCount} pending
            </div>
            <Link
              to="/finetune"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-accent-primary/10 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/20 text-[11px] font-mono transition-colors"
            >
              <span>Review</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLMStatusPanel;
