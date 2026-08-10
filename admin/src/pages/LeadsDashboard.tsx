import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Lead {
  id: number;
  email: string;
  name: string;
  message: string;
  project_slug?: string;
  created_at: string;
  status: string;
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
  const { adminEmail, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'leads' | 'bookings'>('leads');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-bg-base text-text-primary font-display flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-text-muted/20 bg-bg-base/80 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold font-mono text-accent-primary">⚡ Admin Portal</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono">
            {adminEmail || 'authenticated'}
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            to="/leads"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-accent-primary bg-accent-primary/10 border border-accent-primary/30"
          >
            Leads & Bookings
          </Link>
          <Link
            to="/kb"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Knowledge Base Editor
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
              Leads & Booking Requests
            </h1>
            <p className="text-sm text-text-muted">
              Monitor incoming contact inquiries, project interest tags, and scheduled consultation slots.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-bg-base border border-accent-primary/40 text-accent-primary rounded-lg text-sm font-mono hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
            >
              🔄 {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-accent-warn/10 border border-accent-warn/30 text-accent-warn text-sm font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-text-muted/20 space-x-6 font-mono text-sm">
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'leads'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Contact Leads ({leads.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'bookings'
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Calendar Bookings ({bookings.length})
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-16 text-center text-text-muted font-mono animate-pulse">
            Loading leads data from broker API...
          </div>
        ) : activeTab === 'leads' ? (
          <div className="border border-text-muted/20 rounded-xl overflow-hidden bg-bg-base">
            {leads.length === 0 ? (
              <div className="py-12 text-center text-text-muted font-mono text-sm">
                No contact leads recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-text-muted/20 bg-text-muted/5 font-mono text-xs text-text-muted uppercase">
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Project Interest</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-muted/10 text-sm">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-text-muted/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-text-primary">{lead.name}</div>
                          <div className="text-xs font-mono text-text-muted">{lead.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lead.project_slug ? (
                            <span className="px-2.5 py-1 rounded bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono text-xs">
                              {lead.project_slug}
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs font-mono">General</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-accent-primary/20 text-accent-primary uppercase tracking-wider">
                            {lead.status || 'new'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-muted max-w-md truncate">
                          {lead.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-text-muted/20 rounded-xl overflow-hidden bg-bg-base">
            {bookings.length === 0 ? (
              <div className="py-12 text-center text-text-muted font-mono text-sm">
                No calendar booking requests recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-text-muted/20 bg-text-muted/5 font-mono text-xs text-text-muted uppercase">
                      <th className="py-3 px-4">Client Email</th>
                      <th className="py-3 px-4">Slot Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Meeting Link</th>
                      <th className="py-3 px-4">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-text-muted/10 text-sm">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-text-muted/5 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-text-primary">
                          {booking.email}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-accent-primary whitespace-nowrap">
                          📅 {formatDate(booking.slot_time)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-accent-primary/20 text-accent-primary uppercase tracking-wider">
                            {booking.status || 'confirmed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {booking.meeting_link ? (
                            <a
                              href={booking.meeting_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent-primary hover:underline"
                            >
                              🔗 Join Meeting
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
      </main>
    </div>
  );
};
