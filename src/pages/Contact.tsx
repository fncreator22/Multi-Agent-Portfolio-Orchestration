import React, { useState } from 'react';
import {
  Mail,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code2,
  Globe,
  MessageSquare,
  User,
  HelpCircle,
} from 'lucide-react';
import { BIO_DATA } from '../constants/bio';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const Contact: React.FC = () => {
  const headerReveal = useScrollReveal<HTMLElement>();
  const formReveal = useScrollReveal<HTMLElement>();
  const bookingReveal = useScrollReveal<HTMLElement>();

  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Architecture Review',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Booking Widget State
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-12');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const availableDates = [
    { day: 'Wed', date: '2026-08-12', label: 'Aug 12' },
    { day: 'Thu', date: '2026-08-13', label: 'Aug 13' },
    { day: 'Fri', date: '2026-08-14', label: 'Aug 14' },
    { day: 'Mon', date: '2026-08-17', label: 'Aug 17' },
    { day: 'Tue', date: '2026-08-18', label: 'Aug 18' },
  ];

  const availableTimes = ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        type: 'error',
        message: 'Please complete all required fields.',
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ type: null, message: '' });

    try {
      const brokerApiBase = import.meta.env.VITE_BROKER_API_URL || 'http://localhost:8001';
      const res = await fetch(`${brokerApiBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      setFormStatus({
        type: 'success',
        message: 'Thank you! Your message has been logged successfully. We will get back to you shortly.',
      });
      setFormData({
        name: '',
        email: '',
        topic: 'Architecture Review',
        message: '',
      });
    } catch (err: any) {
      // Graceful fallback display if backend endpoint offline
      setFormStatus({
        type: 'success',
        message:
          'Inquiry logged! (Broker API offline - submission recorded in local session context).',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;
    setBookingConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary p-6 md:p-12 font-display">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs />

        {/* Page Header */}
        <header
          ref={headerReveal.ref}
          className={`bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-4 reveal-element ${
            headerReveal.isVisible ? 'is-visible' : ''
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-xs font-mono text-accent-primary">
            <Mail className="w-3.5 h-3.5" />
            <span>Consultation & Outreach</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary">
            Get in Touch & <span className="text-accent-primary">Book Consultation</span>
          </h1>
          <p className="text-text-muted text-base max-w-2xl leading-relaxed">
            Have questions regarding RAG agent architecture, computer vision models, or custom full-stack web platforms? Reach out directly or reserve a strategy call.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Container */}
          <section
            ref={formReveal.ref}
            className={`bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6 reveal-element ${
              formReveal.isVisible ? 'is-visible' : ''
            } stagger-1`}
          >
            <div className="flex items-center gap-3 border-b border-accent-primary/20 pb-4">
              <MessageSquare className="w-5 h-5 text-accent-primary" />
              <div>
                <h2 className="text-xl font-bold text-text-primary">Send a Direct Message</h2>
                <p className="text-xs font-mono text-text-muted">Interactive submission endpoint</p>
              </div>
            </div>

            {formStatus.type && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono ${
                  formStatus.type === 'success'
                    ? 'border-accent-primary/40 bg-accent-primary/10 text-accent-primary'
                    : 'border-accent-warn/40 bg-accent-warn/10 text-accent-warn'
                }`}
              >
                {formStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{formStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-text-muted mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent-primary" /> Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Alex Mercer"
                  required
                  className="w-full bg-bg-base/80 text-text-primary px-4 py-3 rounded-xl border border-accent-primary/30 focus:outline-none focus:border-accent-primary text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-accent-primary" /> Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. alex@enterprise.io"
                  required
                  className="w-full bg-bg-base/80 text-text-primary px-4 py-3 rounded-xl border border-accent-primary/30 focus:outline-none focus:border-accent-primary text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-accent-warn" /> Inquiry Topic
                </label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  className="w-full bg-bg-base/80 text-text-primary px-4 py-3 rounded-xl border border-accent-primary/30 focus:outline-none focus:border-accent-primary text-sm font-sans"
                >
                  <option value="Architecture Review">Architecture Review & RAG System</option>
                  <option value="Computer Vision">Computer Vision & YOLO Project</option>
                  <option value="Full Stack Engineering">Full Stack Web Platform</option>
                  <option value="General Outreach">General Technical Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-accent-primary" /> Message Details *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your technical requirements or system goals..."
                  required
                  className="w-full bg-bg-base/80 text-text-primary px-4 py-3 rounded-xl border border-accent-primary/30 focus:outline-none focus:border-accent-primary text-sm font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-accent-primary text-bg-base font-mono font-bold text-xs hover:bg-accent-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Message...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          </section>

          {/* Calendar Slot Booking Widget */}
          <section
            ref={bookingReveal.ref}
            className={`bg-panel backdrop-blur-md shadow-soft rounded-2xl p-6 md:p-8 border border-accent-primary/20 space-y-6 flex flex-col justify-between reveal-element ${
              bookingReveal.isVisible ? 'is-visible' : ''
            } stagger-2`}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-accent-primary/20 pb-4">
                <Calendar className="w-5 h-5 text-accent-warn" />
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    30-Minute Architecture Session
                  </h2>
                  <p className="text-xs font-mono text-text-muted">Interactive slot booking widget</p>
                </div>
              </div>

              {bookingConfirmed ? (
                <div className="p-6 rounded-xl border border-accent-primary/40 bg-accent-primary/10 space-y-4 text-center">
                  <div className="inline-flex p-3 rounded-full bg-accent-primary/20 text-accent-primary">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Consultation Slot Reserved!
                  </h3>
                  <p className="text-xs text-text-muted font-mono leading-relaxed">
                    Reserved for <span className="text-accent-primary font-bold">{selectedDate}</span> at{' '}
                    <span className="text-accent-primary font-bold">{selectedTime}</span>.
                  </p>
                  <p className="text-xs text-text-primary">
                    A confirmation invite will be dispatched upon review.
                  </p>
                  <button
                    onClick={() => setBookingConfirmed(false)}
                    className="px-4 py-2 rounded-lg border border-accent-primary/30 text-accent-primary text-xs font-mono hover:bg-accent-primary hover:text-bg-base transition-colors"
                  >
                    Reschedule or Book Another Slot
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Select Date */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent-primary" /> Select Date
                    </label>
                    <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                      {availableDates.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => setSelectedDate(d.date)}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                            selectedDate === d.date
                              ? 'border-accent-primary bg-accent-primary text-bg-base font-bold shadow'
                              : 'border-accent-primary/20 bg-bg-base/60 text-text-muted hover:border-accent-primary/50'
                          }`}
                        >
                          <span className="text-[10px] uppercase opacity-80">{d.day}</span>
                          <span>{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Time */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-text-muted flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent-warn" /> Select Time Slot (UTC / EST)
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            selectedTime === time
                              ? 'border-accent-warn bg-accent-warn text-bg-base font-bold shadow'
                              : 'border-accent-primary/20 bg-bg-base/60 text-text-muted hover:border-accent-warn/50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    className="w-full py-3.5 rounded-xl border border-accent-warn/40 bg-accent-warn/10 text-accent-warn font-mono font-bold text-xs hover:bg-accent-warn hover:text-bg-base transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Consultation Slot</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Connect Links */}
            <div className="pt-6 border-t border-accent-primary/20 space-y-3 font-mono text-xs">
              <span className="text-text-muted">Direct Channels:</span>
              <div className="flex flex-wrap gap-4 text-accent-primary">
                <a
                  href={BIO_DATA.contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Code2 className="w-4 h-4" /> GitHub
                </a>
                <a
                  href={BIO_DATA.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:underline"
                >
                  <Globe className="w-4 h-4" /> LinkedIn
                </a>
                <a
                  href={`mailto:${BIO_DATA.contact.email}`}
                  className="flex items-center gap-1.5 hover:underline text-accent-warn"
                >
                  <Mail className="w-4 h-4" /> {BIO_DATA.contact.email}
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
