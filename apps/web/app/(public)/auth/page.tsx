'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Upload } from 'lucide-react';
import { loadGoogleScript, exchangeGoogleCredential, getGoogleClientId } from '@/lib/google-auth';
import { useRouter } from 'next/navigation';

type AuthStep = 'email' | 'otp' | 'profile' | 'agent-id';

function readReferralCode(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return (params.get('ref') ?? '').trim().toUpperCase().slice(0, 20);
}

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('BUYER');
  const [otpTimer, setOtpTimer] = useState(120);
  const [referralCode] = useState(readReferralCode);
  const [oauthError, setOauthError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { register, verifyOtp, completeProfile, isLoading, error, clearError } = useAuth();

  const handleGoogleCredential = useCallback(async (credential: string) => {
    clearError();
    setOauthError('');
    try {
      const data = await exchangeGoogleCredential(credential, referralCode ? { referralCode } : undefined);
      // Directly hydrate auth store without roundtrip
      const { useAuth: authStore } = await import('@/hooks/use-auth');
      (authStore as any).setState({ accessToken: data.accessToken, user: data.user });
      router.push('/');
    } catch (e: any) {
      setOauthError(e.message ?? 'Google sign-in failed');
    }
  }, [clearError, referralCode, router]);

  useEffect(() => {
    const cid = getGoogleClientId();
    if (!cid || !googleBtnRef.current) return;
    loadGoogleScript(cid).then(() => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: (resp: any) => handleGoogleCredential(resp.credential),
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', width: 360 });
      }
      setGoogleReady(true);
    }).catch(() => setGoogleReady(false));
  }, [handleGoogleCredential]);

  useEffect(() => {
    if (step === 'otp' && otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, otpTimer]);

  const handleEmailSubmit = async () => {
    clearError();
    try {
      await register(email);
      setStep('otp');
      setOtpTimer(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      void error;
    }
  };

  const handleOtpSubmit = async () => {
    clearError();
    const otp = otpValues.join('');
    if (otp.length !== 6) return;
    try {
      await verifyOtp(email, otp);
      setStep('profile');
    } catch (error) {
      void error;
    }
  };

  const handleProfileSubmit = async () => {
    clearError();
    try {
      await completeProfile({
        email,
        firstName,
        lastName,
        phone,
        role: selectedRole,
        ...(referralCode ? { referralCode } : {}),
      });
      setStep('agent-id');
    } catch (error) {
      void error;
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const paste = e.clipboardData
        .getData('text')
        .replace(/[^0-9]/g, '')
        .slice(0, 6);
      const newOtp = [...otpValues];
      paste.split('').forEach((d, i) => (newOtp[i] = d));
      setOtpValues(newOtp);
      const focusIdx = Math.min(paste.length, 5);
      otpRefs.current[focusIdx]?.focus();
    },
    [otpValues],
  );

  const timerDisplay = `${String(Math.floor(otpTimer / 60)).padStart(2, '0')}:${String(otpTimer % 60).padStart(2, '0')}`;

  return (
    <div className="flex min-h-screen bg-background">
      <a href="#auth-form" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop hero side */}
      <div className="hidden lg:flex flex-[0_0_55%] relative overflow-hidden bg-gradient-to-br from-primary to-secondary items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1280&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="absolute top-6 left-6 z-[3] text-inverse flex items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded-md grid place-items-center text-lg">HW</div>
          <span className="font-display text-xl font-bold">Homewolves</span>
        </div>
        <div className="relative z-[2] text-center px-10 max-w-[500px]">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-inverse)] mb-3">
            Join Africa&apos;s Real Estate Revolution
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Connect with verified agents, discover premium properties, and transact with confidence
            across the continent.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 lg:flex-[0_0_45%] flex items-center justify-center px-4 lg:px-8 py-10 lg:py-8 bg-background">
        <div
          id="auth-form"
          className="w-full max-w-[420px] p-8 rounded-xl bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border border-[var(--color-border-glass)] shadow-glass"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 bg-accent rounded-md grid place-items-center text-2xl text-inverse">
              HW
            </div>
            <span className="font-display text-xl font-bold text-primary">Homewolves</span>
          </div>

          {/* Email Entry State */}
          {step === 'email' && (
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">
                Welcome to Homewolves
              </h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">
                Enter your email to get started
              </p>

              {referralCode && (
                <div className="rounded-md p-3 border border-accent bg-warning-bg mb-4">
                  <div className="text-xs font-semibold text-warning tracking-wider uppercase">
                    Referral Applied
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-md font-bold text-primary">{referralCode}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-inverse">
                      Applied
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full min-h-[52px] px-4 pt-5 pb-2 font-body text-base text-foreground bg-elevated border border-border rounded-md shadow-xs focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_rgba(45,106,159,0.15)] transition-all duration-fast"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-error mb-3">{error}</p>}

              <button
                onClick={handleEmailSubmit}
                disabled={isLoading || !email}
                className="btn-primary w-full"
              >
                {isLoading ? 'Sending...' : 'Continue'}
              </button>

              <div className="flex items-center gap-3 my-5 text-muted-foreground text-xs">
                <div className="flex-1 h-px bg-border" />
                or continue with
                <div className="flex-1 h-px bg-border" />
              </div>

              {oauthError && <p className="text-sm text-error mb-3 text-center">{oauthError}</p>}

              {/* Direct Google OAuth (preferred) — Supabase soft fallback if no client id */}
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]">
                {!googleReady && (
                  <button
                    disabled
                    className="btn-outline w-full flex items-center justify-center gap-2 opacity-60"
                  >
                    <svg viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    {getGoogleClientId() ? 'Loading Google...' : 'Configure Google OAuth'}
                  </button>
                )}
              </div>
              {!getGoogleClientId() && (
                <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
              )}

              <p className="text-center text-sm text-muted-foreground mt-4">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-secondary hover:underline">
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-secondary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          )}

          {/* OTP Verification State */}
          {step === 'otp' && (
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">
                Check Your Email
              </h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">
                We sent a code to <strong>{email}</strong>
              </p>

              <div className="flex gap-2 lg:gap-3 justify-center my-6">
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    aria-label={`OTP digit ${i + 1}`}
                    className={`w-11 h-14 lg:w-[52px] lg:h-[60px] text-center font-display text-xl lg:text-2xl font-bold text-foreground bg-elevated border-2 rounded-md shadow-xs transition-all duration-fast outline-none focus:border-secondary focus:shadow-[0_0_0_3px_rgba(45,106,159,0.15)] focus:scale-105 ${
                      val ? 'border-success bg-success-bg' : 'border-border'
                    }`}
                  />
                ))}
              </div>

              <div className="text-center text-sm text-muted-foreground mb-4">
                <span className="font-mono text-lg font-bold text-accent">{timerDisplay}</span>
                <span className="ml-1">remaining</span>
                <div className="mt-2">
                  <button
                    disabled={otpTimer > 0}
                    className="text-secondary font-semibold underline underline-offset-2 disabled:opacity-40 disabled:cursor-default"
                    onClick={() => {
                      setOtpTimer(120);
                      handleEmailSubmit();
                    }}
                  >
                    Resend code
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-error mb-3 text-center">{error}</p>}

              <button
                onClick={handleOtpSubmit}
                disabled={isLoading || otpValues.join('').length !== 6}
                className="btn-primary w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>

              <button onClick={() => setStep('email')} className="btn-secondary w-full mt-3">
                Back to email
              </button>
            </div>
          )}

          {/* Profile Completion State */}
          {step === 'profile' && (
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">
                Complete Your Profile
              </h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">
                Tell us a bit about yourself
              </p>

              <div className="mb-4">
                <label
                  htmlFor="auth-firstname"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  First Name
                </label>
                <input
                  id="auth-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  autoComplete="given-name"
                  className="w-full min-h-[52px] px-4 pt-5 pb-2 font-body text-base text-foreground bg-elevated border border-border rounded-md shadow-xs focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_rgba(45,106,159,0.15)] transition-all duration-fast"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="auth-lastname"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  Last Name
                </label>
                <input
                  id="auth-lastname"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                  autoComplete="family-name"
                  className="w-full min-h-[52px] px-4 pt-5 pb-2 font-body text-base text-foreground bg-elevated border border-border rounded-md shadow-xs focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_rgba(45,106,159,0.15)] transition-all duration-fast"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="auth-phone"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                  className="w-full min-h-[52px] px-4 pt-5 pb-2 font-body text-base text-foreground bg-elevated border border-border rounded-md shadow-xs focus:outline-none focus:border-secondary focus:shadow-[0_0_0_3px_rgba(45,106,159,0.15)] transition-all duration-fast"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for OTP verification and agent contact
                </p>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="auth-role"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  I am a...
                </label>
                <select
                  id="auth-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full min-h-[52px] px-4 font-body text-base text-foreground bg-elevated border border-border rounded-md shadow-xs focus:outline-none focus:border-secondary"
                >
                  <option value="BUYER">Buyer / Renter</option>
                  <option value="AGENT">Real Estate Agent</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="HOMEOWNER">Homeowner</option>
                </select>
              </div>

              {error && <p className="text-sm text-error mb-3">{error}</p>}

              <button
                onClick={handleProfileSubmit}
                disabled={isLoading || !firstName || !lastName || !phone}
                className="btn-primary w-full mt-3"
              >
                {isLoading ? 'Saving...' : 'Continue'}
              </button>

              <button onClick={() => setStep('otp')} className="btn-secondary w-full mt-2">
                Back
              </button>
            </div>
          )}

          {/* Agent ID Upload State */}
          {step === 'agent-id' && (
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning mb-3">
                Agent Verification
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">
                Verify Your Identity
              </h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">
                Upload a valid government-issued ID to complete your agent registration
              </p>

              <div
                className="border-2 border-dashed border-strong rounded-lg py-8 px-4 text-center bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] transition-all duration-fast cursor-pointer hover:border-secondary hover:bg-info-bg mb-4"
                role="button"
                tabIndex={0}
              >
                <Upload className="w-9 h-9 mx-auto mb-2 opacity-70 text-muted-foreground" />
                <div className="text-md font-semibold text-foreground">Upload ID Document</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Drag & drop or click to browse
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, or PNG (max 10MB)
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="id-type"
                  className="block text-sm font-semibold text-secondary mb-1"
                >
                  ID Type
                </label>
                <select
                  id="id-type"
                  className="w-full min-h-[52px] px-4 font-body text-base text-foreground bg-elevated border border-border rounded-md shadow-xs focus:outline-none focus:border-secondary"
                >
                  <option value="">Select ID type</option>
                  <option value="passport">International Passport</option>
                  <option value="national-id">National ID</option>
                  <option value="drivers-license">Driver&apos;s License</option>
                  <option value="voters-card">Voter&apos;s Card</option>
                </select>
              </div>

              <button className="btn-primary w-full mt-4">Submit for Verification</button>

              <button onClick={() => setStep('profile')} className="btn-secondary w-full mt-2">
                Back
              </button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Your documents are encrypted and used only for verification
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
