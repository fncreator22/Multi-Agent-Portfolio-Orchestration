import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, Info, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setInfoMsg(null);
    setLoading(true);

    const res = await requestOtp(email);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setInfoMsg(res.message);
      if (res.otp_code) {
        setDemoCode(res.otp_code);
        setOtpCode(res.otp_code);
      }
    } else {
      setError(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length === 0) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setError(null);
    setLoading(true);

    const res = await verifyOtp(email, otpCode.trim());
    setLoading(false);

    if (res.success) {
      navigate('/leads', { replace: true });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center p-4 font-display">
      <div className="w-full max-w-md bg-bg-base border border-text-muted/20 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-accent-primary mb-2 font-mono">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Admin Authentication
          </h1>
          <p className="text-sm text-text-muted">
            {step === 'email'
              ? 'Enter your email to receive a 6-digit login OTP code'
              : `Enter the 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm rounded-lg bg-accent-warn/10 border border-accent-warn/30 text-accent-warn font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 text-sm rounded-lg bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {demoCode && step === 'otp' && (
          <div className="p-3 text-xs rounded-lg bg-accent-primary/10 border border-accent-primary/40 text-accent-primary font-mono text-center flex items-center justify-center gap-1.5">
            <Key className="w-4 h-4 shrink-0" /> <span className="font-bold">Demo OTP Code Generated:</span>{' '}
            <span className="text-base tracking-widest underline">{demoCode}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-bg-base border border-text-muted/30 rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent-primary text-bg-base font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? 'Requesting OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-bg-base border border-accent-primary/50 rounded-lg text-accent-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary font-mono text-xl text-center tracking-[0.5em]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent-primary text-bg-base font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
            </button>

            <div className="flex justify-between items-center text-xs pt-2 font-mono">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setInfoMsg(null);
                }}
                className="text-text-muted hover:text-accent-primary transition-colors"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-accent-primary hover:underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
