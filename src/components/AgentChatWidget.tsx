import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShell } from '../context/ShellContext';
import { GuardianVisualizer } from './canvas/GuardianVisualizer';

interface RetrievedDoc {
  id: string;
  slug: string;
  name: string;
  category: string;
  tech: string;
  description: string;
  overview: string;
  problem: string;
  solution: string;
  architecture: string;
  metrics: string;
  githubUrl: string;
  liveUrl?: string;
  distance: number;
  document: string;
}

interface AgentQueryResponse {
  query: string;
  retrieved_docs: RetrievedDoc[];
  gate_decision: 'RETRIEVAL_ONLY' | 'ESCALATE_LLM';
  confidence_score: number;
  reason: string;
  llm_response?: string;
  grounding_verified?: boolean;
  active_stage: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  gateDecision?: 'RETRIEVAL_ONLY' | 'ESCALATE_LLM';
  confidenceScore?: number;
  groundingVerified?: boolean;
  sources?: { name: string; slug: string }[];
  error?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    sender: 'agent',
    text: 'Greetings! I am the Portfolio Guardian Agent. Ask me anything about projects, computer vision architecture, tech stacks, or RAG evaluation pipelines.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SUGGESTED_QUERIES = [
  'What tech stack was used for sentinel-mcp?',
  'How does the confidence gate work?',
  'Explain computer vision projects',
];

export const AgentChatWidget: React.FC = () => {
  const { activeStage, setActiveStage, mode } = useShell();
  const isTerminal = mode === 'terminal';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sanitizeInput = (text: string): string => {
    if (!text) return '';
    // Strip HTML tags
    const clean = text.replace(/<[^>]*>?/gm, '');
    // Sanitize query max 500 characters
    return clean.slice(0, 500).trim();
  };

  const handleSend = async (queryToSend?: string) => {
    const rawQuery = queryToSend ?? inputText;
    const sanitized = sanitizeInput(rawQuery);
    if (!sanitized || isQuerying) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: sanitized,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsQuerying(true);

    // Update visualizer state to Stage 1
    setActiveStage('STAGE_1_RETRIEVAL');

    // Simulate progress tick to Stage 2 after 350ms
    const stage2Timeout = setTimeout(() => {
      setActiveStage('STAGE_2_GATE');
    }, 350);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sanitized, top_k: 3 }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'API Request failed' }));
        throw new Error(errJson.detail || `Server returned HTTP ${res.status}`);
      }

      const data: AgentQueryResponse = await res.json();

      // If gate decision was ESCALATE_LLM, update activeStage to STAGE_3_LLM
      if (data.gate_decision === 'ESCALATE_LLM') {
        setActiveStage('STAGE_3_LLM');
        await new Promise((r) => setTimeout(r, 600));
      }

      // Mark stage as COMPLETE
      setActiveStage('COMPLETE');

      let responseText = '';
      if (data.llm_response) {
        responseText = data.llm_response;
      } else if (data.retrieved_docs && data.retrieved_docs.length > 0) {
        const topDoc = data.retrieved_docs[0];
        responseText = `${topDoc.name}: ${topDoc.description}\n\nKey Tech: ${topDoc.tech}\nMetric: ${topDoc.metrics}`;
      } else {
        responseText = 'No matching portfolio case studies found. Try querying specific project names or technical domains.';
      }

      const sources = (data.retrieved_docs || []).map((doc) => ({
        name: doc.name,
        slug: doc.slug,
      }));

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gateDecision: data.gate_decision,
        confidenceScore: data.confidence_score,
        groundingVerified: data.grounding_verified,
        sources,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setActiveStage('IDLE');
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'agent',
        text: `Unable to process request: ${err.message || 'API connection failed'}. Check backend service.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      clearTimeout(stage2Timeout);
      setIsQuerying(false);
      // Reset active stage to IDLE after 4 seconds
      setTimeout(() => {
        setActiveStage('IDLE');
      }, 4000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full border border-accent-primary/40 bg-bg-base/90 text-accent-primary shadow-xl hover:border-accent-primary hover:bg-accent-primary/10 transition-all duration-300 ${
          isTerminal ? 'font-mono' : 'font-display'
        }`}
        aria-label="Toggle Agent Chat"
      >
        <span className="relative flex h-3 w-3">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${
              activeStage !== 'IDLE' ? 'bg-accent-warn animate-ping' : 'bg-accent-primary'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              activeStage !== 'IDLE' ? 'bg-accent-warn' : 'bg-accent-primary'
            }`}
          ></span>
        </span>
        <span className="text-sm font-semibold tracking-wide">
          {isOpen ? 'Close Agent' : 'Ask Agent'}
        </span>
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[560px] max-h-[85vh] flex flex-col border border-accent-primary/30 bg-bg-base/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isTerminal ? 'font-mono' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-accent-primary/20 bg-bg-base/80">
            <div className="flex items-center gap-2.5">
              <span className="text-accent-primary font-bold text-sm">
                {isTerminal ? '$ agent --chat' : 'Guardian RAG Agent'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded border border-accent-primary/30 text-accent-primary bg-accent-primary/10 font-mono">
                v1.0.0
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-accent-warn transition-colors text-sm font-mono px-2 py-1"
            >
              [X]
            </button>
          </div>

          {/* Mini Guardian Visualizer Header Display */}
          <div className="border-b border-accent-primary/10 bg-bg-base/40 p-2 flex justify-center scale-90 -my-2">
            <GuardianVisualizer activeStage={activeStage} />
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1 font-mono">
                  <span>{msg.sender === 'user' ? 'GUEST' : 'AGENT'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-xl max-w-[88%] whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-accent-primary/15 text-text-primary border border-accent-primary/30 rounded-tr-none'
                      : msg.error
                      ? 'bg-accent-warn/15 text-accent-warn border border-accent-warn/30 rounded-tl-none'
                      : 'bg-bg-base border border-accent-primary/20 text-text-primary rounded-tl-none'
                  }`}
                >
                  {/* Escaped & sanitized string rendering */}
                  {msg.text}

                  {/* Metadata Badges for Agent Responses */}
                  {msg.sender === 'agent' && !msg.error && (
                    <div className="mt-3 pt-2 border-t border-text-muted/20 space-y-2 font-mono text-[10px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Gate Decision Badge */}
                        {msg.gateDecision && (
                          <span
                            className={`px-2 py-0.5 rounded border ${
                              msg.gateDecision === 'ESCALATE_LLM'
                                ? 'border-accent-warn/40 bg-accent-warn/10 text-accent-warn'
                                : 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary'
                            }`}
                          >
                            GATE: {msg.gateDecision}
                          </span>
                        )}

                        {/* Confidence Score */}
                        {typeof msg.confidenceScore === 'number' && (
                          <span className="px-2 py-0.5 rounded border border-accent-primary/30 bg-bg-base text-accent-primary">
                            {(msg.confidenceScore * 100).toFixed(1)}% Confidence
                          </span>
                        )}

                        {/* Grounding Verification Badge */}
                        {typeof msg.groundingVerified === 'boolean' && (
                          <span
                            className={`px-2 py-0.5 rounded border ${
                              msg.groundingVerified
                                ? 'border-accent-primary/40 text-accent-primary'
                                : 'border-accent-warn/40 text-accent-warn'
                            }`}
                          >
                            {msg.groundingVerified ? 'Grounding: Verified' : 'Grounding: Fallback'}
                          </span>
                        )}
                      </div>

                      {/* Source Case Study Links */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-1">
                          <span className="text-text-muted mr-1">Sources:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {msg.sources.map((src) => (
                              <Link
                                key={src.slug}
                                to={`/projects/${src.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-accent-primary/30 text-accent-primary hover:bg-accent-primary hover:text-bg-base transition-colors"
                              >
                                <span>📄</span> {src.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Query Suggestion Chips */}
          <div className="px-3 py-1.5 border-t border-accent-primary/10 bg-bg-base/40 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
            <span className="text-text-muted shrink-0">Try:</span>
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={isQuerying}
                className="shrink-0 px-2 py-0.5 rounded border border-accent-primary/20 text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Controls */}
          <div className="p-3 border-t border-accent-primary/20 bg-bg-base flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDown}
                placeholder="Ask about projects, architecture, metrics..."
                disabled={isQuerying}
                className="flex-1 bg-bg-base text-text-primary text-xs px-3 py-2 rounded-lg border border-accent-primary/30 focus:outline-none focus:border-accent-primary font-mono placeholder:text-text-muted/60 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={isQuerying || !inputText.trim()}
                className="px-3 py-2 bg-accent-primary text-bg-base font-mono font-bold text-xs rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-40"
              >
                {isQuerying ? '...' : 'Send'}
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-text-muted px-1">
              <span>Sanitized Input (max 500 chars)</span>
              <span>{inputText.length}/500</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
