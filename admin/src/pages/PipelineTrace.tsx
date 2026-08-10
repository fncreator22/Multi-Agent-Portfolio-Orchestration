import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  Search,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart2,
  Clock,
  Filter
} from 'lucide-react';
import { SLMStatusPanel } from '../components/SLMStatusPanel';

export interface TraceItem {
  query: string;
  timestamp: string;
  stage1_hits: number | any[];
  stage2_decision: string;
  confidence_score: number;
  stage3_response: string | null;
  grounding_score: number;
  grounding_verified: boolean;
}

const API_BASE_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000';

export const PipelineTrace: React.FC = () => {
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'RETRIEVAL_ONLY' | 'ESCALATE_LLM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedTraceIndex, setExpandedTraceIndex] = useState<number | null>(null);

  const fetchTraces = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/trace`);
      if (res.ok) {
        const data = await res.json();
        setTraces(data.traces || []);
        setError(null);
        setLastRefreshed(new Date());
      } else {
        setError(`Failed to fetch traces: HTTP ${res.status}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to agent backend pipeline endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
    const interval = setInterval(() => {
      fetchTraces();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const totalQueries = traces.length;
  const retrievalOnlyCount = traces.filter((t) => t.stage2_decision === 'RETRIEVAL_ONLY').length;
  const escalatedCount = traces.filter((t) => t.stage2_decision === 'ESCALATE_LLM').length;

  const retrievalOnlyPct = totalQueries > 0 ? ((retrievalOnlyCount / totalQueries) * 100).toFixed(1) : '0.0';
  const escalatedPct = totalQueries > 0 ? ((escalatedCount / totalQueries) * 100).toFixed(1) : '0.0';

  const totalConfidence = traces.reduce((acc, t) => acc + (t.confidence_score || 0), 0);
  const avgConfidence = totalQueries > 0 ? ((totalConfidence / totalQueries) * 100).toFixed(1) : '0.0';

  const groundedCount = traces.filter((t) => t.grounding_verified).length;
  const groundingPassRate = totalQueries > 0 ? ((groundedCount / totalQueries) * 100).toFixed(1) : '0.0';

  const filteredTraces = traces.filter((t) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'RETRIEVAL_ONLY'
        ? t.stage2_decision === 'RETRIEVAL_ONLY'
        : t.stage2_decision === 'ESCALATE_LLM';

    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : t.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.stage3_response && t.stage3_response.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Live Polling Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent-primary" /> Admin Live Pipeline Visualizer
          </h1>
          <p className="text-sm text-text-muted font-body">
            Real-time execution telemetry and step-by-step traces across Stage 1 (ChromaDB), Stage 2 (TF-IDF Gate), and Stage 3 (Ollama LLM).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            <span>Polling 4s</span>
          </div>

          <button
            onClick={() => fetchTraces()}
            className="px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/20 transition-all rounded-lg text-xs font-mono font-semibold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-sm font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SLM Model Monitoring Panel */}
      <SLMStatusPanel />

      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Queries */}
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Total Queries</span>
            <Layers className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-text-primary">{totalQueries}</div>
          <div className="text-[10px] text-text-muted font-mono">
            {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString()}` : 'Live stream'}
          </div>
        </div>

        {/* Card 2: Retrieval Only % */}
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Retrieval Only %</span>
            <Database className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-primary">{retrievalOnlyPct}%</div>
          <div className="text-[10px] text-text-muted font-mono">{retrievalOnlyCount} direct matches</div>
        </div>

        {/* Card 3: Escalated % */}
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Escalated %</span>
            <Cpu className="w-4 h-4 text-accent-warn" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-warn">{escalatedPct}%</div>
          <div className="text-[10px] text-text-muted font-mono">{escalatedCount} LLM generations</div>
        </div>

        {/* Card 4: Avg Confidence */}
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Confidence</span>
            <BarChart2 className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-primary">{avgConfidence}%</div>
          <div className="text-[10px] text-text-muted font-mono">TF-IDF Gate score</div>
        </div>

        {/* Card 5: Grounding Pass Rate % */}
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-5 space-y-2">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">Grounding Pass Rate</span>
            <ShieldCheck className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-primary">{groundingPassRate}%</div>
          <div className="text-[10px] text-text-muted font-mono">{groundedCount} verified responses</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-accent-primary shrink-0" />
          <span className="text-xs font-mono text-text-muted uppercase mr-2">Filter:</span>
          {(['ALL', 'RETRIEVAL_ONLY', 'ESCALATE_LLM'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filter === f
                  ? 'bg-accent-primary text-bg-base font-bold shadow-sm'
                  : 'bg-bg-base/60 text-text-muted border border-accent-primary/10 hover:text-text-primary'
              }`}
            >
              {f === 'ALL' ? 'All Traces' : f === 'RETRIEVAL_ONLY' ? 'Retrieval Only' : 'Escalated LLM'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search query or response..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-base/80 border border-accent-primary/20 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Request Trace Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-primary" /> Request Trace Feed ({filteredTraces.length})
          </h2>
        </div>

        {loading && traces.length === 0 ? (
          <div className="py-16 text-center text-text-muted font-mono animate-pulse bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6">
            Loading live request traces...
          </div>
        ) : filteredTraces.length === 0 ? (
          <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-12 text-center text-text-muted font-mono space-y-2">
            <AlertCircle className="w-8 h-8 text-accent-primary mx-auto" />
            <div className="text-sm font-semibold text-text-primary">No Matching Request Traces</div>
            <p className="text-xs text-text-muted font-body max-w-md mx-auto">
              No queries match the selected filter or search criteria. Execute queries against the Agent API to view real-time traces.
            </p>
          </div>
        ) : (
          filteredTraces.map((trace, idx) => {
            const hitsCount =
              typeof trace.stage1_hits === 'number'
                ? trace.stage1_hits
                : Array.isArray(trace.stage1_hits)
                ? trace.stage1_hits.length
                : 3;

            const isEscalated = trace.stage2_decision === 'ESCALATE_LLM';
            const isExpanded = expandedTraceIndex === idx;

            return (
              <div
                key={`${trace.timestamp}-${idx}`}
                className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-4 transition-all"
              >
                {/* Header: Timestamp & Decision Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-accent-primary/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent-primary" />
                      {formatDate(trace.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                        isEscalated
                          ? 'bg-accent-warn/10 border border-accent-warn/30 text-accent-warn'
                          : 'bg-accent-primary/10 border border-accent-primary/30 text-accent-primary'
                      }`}
                    >
                      {isEscalated ? (
                        <>
                          <Cpu className="w-3.5 h-3.5" /> ESCALATED TO OLLAMA
                        </>
                      ) : (
                        <>
                          <Database className="w-3.5 h-3.5" /> RETRIEVAL ONLY
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Query Header */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">USER QUERY</div>
                  <div className="text-base font-semibold font-display text-text-primary bg-bg-base/60 p-3 rounded-lg border border-accent-primary/10">
                    "{trace.query}"
                  </div>
                </div>

                {/* 3-Stage Execution Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Stage 1 Card */}
                  <div className="bg-bg-base/60 rounded-xl p-4 border border-accent-primary/15 space-y-2">
                    <div className="flex items-center justify-between border-b border-accent-primary/10 pb-2">
                      <span className="text-xs font-mono font-bold text-accent-primary flex items-center gap-1.5">
                        <Database className="w-4 h-4" /> Stage 1: ChromaDB
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                        {hitsCount} Hits
                      </span>
                    </div>
                    <div className="text-xs font-mono text-text-primary">Vector Retrieval Complete</div>
                    <div className="text-[10px] font-mono text-text-muted">
                      Top-{hitsCount} nearest document embeddings extracted from collection.
                    </div>
                  </div>

                  {/* Stage 2 Card */}
                  <div className="bg-bg-base/60 rounded-xl p-4 border border-accent-primary/15 space-y-2">
                    <div className="flex items-center justify-between border-b border-accent-primary/10 pb-2">
                      <span className="text-xs font-mono font-bold text-accent-primary flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Stage 2: Gate Decision
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isEscalated
                            ? 'bg-accent-warn/10 text-accent-warn border-accent-warn/30'
                            : 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                        }`}
                      >
                        {(trace.confidence_score * 100).toFixed(1)}% Conf
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-text-primary">{trace.stage2_decision}</div>
                    <div className="text-[10px] font-mono text-text-muted">
                      TF-IDF & vector similarity gate threshold evaluation.
                    </div>
                  </div>

                  {/* Stage 3 Card */}
                  <div className="bg-bg-base/60 rounded-xl p-4 border border-accent-primary/15 space-y-2">
                    <div className="flex items-center justify-between border-b border-accent-primary/10 pb-2">
                      <span className="text-xs font-mono font-bold text-accent-primary flex items-center gap-1.5">
                        <Cpu className="w-4 h-4" /> Stage 3: LLM Output
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                          trace.grounding_verified
                            ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
                            : 'bg-accent-warn/10 text-accent-warn border-accent-warn/30'
                        }`}
                      >
                        {trace.grounding_verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {(trace.grounding_score * 100).toFixed(0)}% Grounded
                      </span>
                    </div>
                    <div className="text-xs font-mono text-text-primary">
                      {isEscalated ? (trace.grounding_verified ? 'Grounded Generation' : 'Fallback Synthesized') : 'Direct Retrieval'}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted">
                      {isEscalated ? 'Ollama Llama-3.2 SLM execution' : 'LLM Bypassed (High confidence)'}
                    </div>
                  </div>
                </div>

                {/* LLM Response Output Box (if escalated or populated) */}
                {trace.stage3_response && (
                  <div className="space-y-2 pt-2 border-t border-accent-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                        Stage 3 Synthesized Response / Fallback Content
                      </span>
                      <button
                        onClick={() => setExpandedTraceIndex(isExpanded ? null : idx)}
                        className="text-[10px] font-mono text-accent-primary hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? 'Collapse Response' : 'Expand Response'}
                      </button>
                    </div>

                    <div
                      className={`p-3 rounded-lg bg-bg-base/90 border border-accent-primary/20 text-xs font-mono text-text-primary overflow-x-auto ${
                        isExpanded ? 'max-h-none' : 'max-h-24 overflow-y-hidden relative'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-mono">{trace.stage3_response}</pre>
                      {!isExpanded && trace.stage3_response.length > 200 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-base/90 to-transparent pointer-events-none" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
