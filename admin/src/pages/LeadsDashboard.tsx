import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, MessageSquare, FileCode, User, Bot, Calendar, LinkIcon, Users, CheckCircle2 } from 'lucide-react';

interface ConversationTurn {
  id: number;
  session_id: string;
  lead_id?: number;
  email?: string;
  visitor_message: string;
  agent_stage: string;
  agent_response: string;
  created_at: string;
}

interface Lead {
  id: number;
  email: string;
  name: string;
  message: string;
  project_slug?: string;
  created_at: string;
  status: string;
  conversations?: ConversationTurn[];
}

interface Booking {
  id: number;
  email: string;
  slot_time: string;
  meeting_link?: string;
  created_at: string;
  status: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const LeadsDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'leads' | 'bookings'>('leads');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLeadIds, setExpandedLeadIds] = useState<Record<number, boolean>>({});

  const toggleExpand = (leadId: number) => {
    setExpandedLeadIds((prev) => ({
      ...prev,
      [leadId]: !prev[leadId],
    }));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/leads`),
        fetch(`${API_BASE_URL}/api/bookings`),
      ]);

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString();
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-primary" /> Leads & Booking Requests
          </h1>
          <p className="text-sm text-text-muted font-body">
            Monitor incoming contact inquiries, project interest tags, and scheduled consultation slots.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-panel border border-accent-primary/40 text-accent-primary rounded-lg text-sm font-mono hover:bg-accent-primary/10 transition-all disabled:opacity-50 inline-flex items-center gap-2 shadow-soft"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-sm font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards styled with bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Total Contact Leads</span>
            <Users className="w-5 h-5 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-primary">{leads.length}</div>
          <p className="text-xs font-body text-text-muted">Recorded client inquiry messages</p>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Calendar Bookings</span>
            <Calendar className="w-5 h-5 text-accent-warn" />
          </div>
          <div className="text-3xl font-bold font-mono text-accent-warn">{bookings.length}</div>
          <p className="text-xs font-body text-text-muted">Scheduled consultation sessions</p>
        </div>

        <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Active Transcripts</span>
            <MessageSquare className="w-5 h-5 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold font-mono text-text-primary">
            {leads.filter((l) => l.conversations && l.conversations.length > 0).length}
          </div>
          <p className="text-xs font-body text-text-muted">Leads with recorded agent dialogs</p>
        </div>
      </div>

      {/* Tab Switcher styled with bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 */}
      <div className="bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6 flex items-center justify-between">
        <div className="flex space-x-4 font-mono text-sm">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'leads'
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30 shadow-sm'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" /> Contact Leads ({leads.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30 shadow-sm'
                : 'text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendar Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {/* Content Table Container upgraded to bg-panel shadow-soft */}
      {loading ? (
        <div className="py-16 text-center text-text-muted font-mono animate-pulse bg-panel backdrop-blur shadow-soft rounded-xl border border-accent-primary/20 p-6">
          Loading leads data from broker API...
        </div>
      ) : activeTab === 'leads' ? (
        <div className="bg-panel shadow-soft border border-accent-primary/20 rounded-xl overflow-hidden">
          {leads.length === 0 ? (
            <div className="py-12 text-center text-text-muted font-mono text-sm">
              No contact leads recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent-primary/20 bg-accent-primary/5 font-mono text-xs text-text-muted uppercase">
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Project Interest</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Actions / History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text-muted/10 text-sm">
                  {leads.map((lead) => {
                    const isExpanded = !!expandedLeadIds[lead.id];
                    const turnCount = lead.conversations?.length || 0;
                    return (
                      <React.Fragment key={lead.id}>
                        <tr className="hover:bg-accent-primary/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-text-primary">{lead.name}</div>
                            <div className="text-xs font-mono text-text-muted">{lead.email}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {lead.project_slug ? (
                              <span className="px-2.5 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono text-xs">
                                {lead.project_slug}
                              </span>
                            ) : (
                              <span className="text-text-muted text-xs font-mono">General</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-accent-primary/10 text-accent-primary border border-accent-primary/30 uppercase tracking-wider inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {lead.status || 'new'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-muted max-w-xs truncate">
                            {lead.message}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleExpand(lead.id)}
                              className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all inline-flex items-center gap-1.5 ${
                                isExpanded
                                  ? 'bg-accent-primary text-bg-base border-accent-primary font-bold shadow-sm'
                                  : 'border-accent-primary/30 text-accent-primary hover:bg-accent-primary/10'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Transcript ({turnCount}) {isExpanded ? '▲' : '▼'}
                            </button>
                          </td>
                        </tr>

                        {/* Transcript Drawer Container upgraded to bg-panel shadow-soft */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-panel shadow-soft p-4 border-b border-accent-primary/20">
                              <div className="bg-bg-base/60 border border-accent-primary/20 rounded-xl p-4 space-y-3 font-mono text-xs max-h-96 overflow-y-auto">
                                <div className="flex items-center justify-between pb-2 border-b border-accent-primary/20 text-accent-primary font-bold">
                                  <span className="inline-flex items-center gap-1.5"><FileCode className="w-4 h-4" /> Agent Conversation History (Lead #{lead.id})</span>
                                  <span>{turnCount} turn(s) recorded</span>
                                </div>

                                {turnCount === 0 ? (
                                  <div className="py-4 text-center text-text-muted italic">
                                    No agent conversation history recorded for this lead.
                                  </div>
                                ) : (
                                  lead.conversations?.map((turn, idx) => (
                                    <div
                                      key={turn.id || idx}
                                      className="p-3 rounded-lg border border-accent-primary/20 bg-panel backdrop-blur space-y-2 shadow-sm"
                                    >
                                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                                        <div className="flex items-center gap-2">
                                          <span className="px-1.5 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/30 text-accent-primary">
                                            STAGE: {turn.agent_stage}
                                          </span>
                                          <span>Session: {turn.session_id}</span>
                                        </div>
                                        <span>{formatDate(turn.created_at)}</span>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="text-text-primary font-semibold flex items-center gap-1">
                                          <span className="text-accent-primary inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> Visitor:</span> {turn.visitor_message}
                                        </div>
                                        <div className="text-text-muted whitespace-pre-wrap pl-4 border-l-2 border-accent-primary/30">
                                          <span className="text-accent-primary font-semibold inline-flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> Agent:</span> {turn.agent_response}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-panel shadow-soft border border-accent-primary/20 rounded-xl overflow-hidden">
          {bookings.length === 0 ? (
            <div className="py-12 text-center text-text-muted font-mono text-sm">
              No calendar booking requests recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent-primary/20 bg-accent-primary/5 font-mono text-xs text-text-muted uppercase">
                    <th className="py-3 px-4">Client Email</th>
                    <th className="py-3 px-4">Slot Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Meeting Link</th>
                    <th className="py-3 px-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text-muted/10 text-sm">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-accent-primary/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-text-primary">
                        {booking.email}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-accent-primary whitespace-nowrap inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(booking.slot_time)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-accent-primary/10 text-accent-primary border border-accent-primary/30 uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {booking.status || 'confirmed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {booking.meeting_link ? (
                          <a
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-primary hover:underline inline-flex items-center gap-1"
                          >
                            <LinkIcon className="w-3.5 h-3.5" /> Join Meeting
                          </a>
                        ) : (
                          <span className="text-text-muted">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                        {formatDate(booking.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
