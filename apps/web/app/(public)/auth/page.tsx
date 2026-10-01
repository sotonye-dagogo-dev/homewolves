'use client';

import { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { BrandLogo } from '@/components/shared/brand-logo';
import { Upload, Eye, EyeOff, MailCheck } from 'lucide-react';
import { loadGoogleScript, exchangeGoogleCredential } from '@/lib/google-auth';
import { useGoogleOauth } from '@/hooks/use-platform-config';

type Mode = 'signin' | 'signup' | 'otp' | 'forgot' | 'reset' | 'profile' | 'agent-id' | 'verify-notice';

function readReferralCode(search: string): string {
  const params = new URLSearchParams(search);
  return (params.get('ref') ?? '').trim().toUpperCase().slice(0, 20);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  'w-full min-h-[52px] px-4 py-3 font-body text-base rounded-md shadow-xs transition-all duration-fast outline-none focus:ring-2 focus:ring-[rgba(45,106,159,0.35)] focus:border-[var(--color-brand-secondary)] border border-[var(--color-border-default)] placeholder:text-[var(--color-text-muted)]';
const inputStyle = {
  color: 'var(--color-text-primary)',
  backgroundColor: '#FFFFFF',
  colorScheme: 'light',
} as React.CSSProperties;

function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-sm font-medium rounded-md px-3 py-2.5 mb-4 border"
      style={{
        color: 'var(--color-error)',
        backgroundColor: 'var(--color-error-bg)',
        borderColor: 'var(--color-error)',
      }}
    >
      {message}
    </p>
  );
}

function SuccessAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="text-sm font-medium rounded-md px-3 py-2.5 mb-4 border"
      style={{
        color: 'var(--color-success)',
        backgroundColor: 'var(--color-success-bg)',
        borderColor: 'var(--color-success)',
      }}
    >
      {message}
    </p>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh grid place-items-center"><p className="text-secondary">Loading…</p></div>}>
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialReset = searchParams.get('reset') ?? '';
  const [mode, setMode] = useState<Mode>(initialReset ? 'reset' : 'signin');
  const [resetToken, setResetToken] = useState(initialReset);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('BUYER');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const [otpContext, setOtpContext] = useState<'signup' | 'signin'>('signup');
  const [notice, setNotice] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [oauthError, setOauthError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleRenderedRef = useRef(false);

  const referralCode = readReferralCode(searchParams.toString());
  const {
    register,
    verifyOtp,
    completeProfile,
    login,
    loginWithPassword,
    registerWithPassword,
    requestPasswordReset,
    resetPassword,
    resendVerification,
    isLoading,
    error,
    clearError,
    user,
  } = useAuth();
  const { clientId: googleClientId, enabled: googleEnabled } = useGoogleOauth();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    clearError();
    setOauthError('');
    try {
      const data = await exchangeGoogleCredential(credential, referralCode ? { referralCode } : undefined);
      const { useAuth: authStore } = await import('@/hooks/use-auth');
      (authStore as unknown as { setState: (s: object) => void }).setState({ accessToken: data.accessToken, user: data.user });
      router.push('/dashboard');
    } catch (e: unknown) {
      setOauthError(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  }, [clearError, referralCode, router]);

  useEffect(() => {
    const cid = googleClientId;
    if (!cid || !googleEnabled || !googleBtnRef.current) return;
    if (googleRenderedRef.current) return;
    loadGoogleScript(cid).then(() => {
      if (!window.google || googleRenderedRef.current || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: (resp: { credential: string }) => handleGoogleCredential(resp.credential),
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', width: 320 });
      googleRenderedRef.current = true;
      setGoogleReady(true);
    }).catch(() => setGoogleReady(false));
  }, [handleGoogleCredential, googleClientId, googleEnabled]);

  useEffect(() => {
    if (mode === 'otp' && otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [mode, otpTimer]);

  function validateEmail(v: string): boolean {
    if (!v.trim()) { setFieldError('Enter your email address.'); return false; }
    if (!EMAIL_RE.test(v.trim())) { setFieldError('That email address doesn’t look right — check for typos.'); return false; }
    setFieldError('');
    return true;
  }

  const switchMode = (m: Mode) => {
    clearError();
    setFieldError('');
    setNotice('');
    setOauthError('');
    setMode(m);
  };

  // ── Password sign-in ──
  const handlePasswordSignIn = async () => {
    clearError();
    setNotice('');
    if (!validateEmail(email)) return;
    if (!password) { setFieldError('Enter your password.'); return; }
    setFieldError('');
    try {
      await loginWithPassword(email.trim().toLowerCase(), password);
      setNotice('Signed in — redirecting…');
      router.push('/dashboard');
    } catch { /* error shown from store */ }
  };

  // ── Password sign-up ──
  const handlePasswordSignUp = async () => {
    clearError();
    setNotice('');
    if (!validateEmail(email)) return;
    if (!firstName.trim() || !lastName.trim()) { setFieldError('Enter your first and last name.'); return; }
    if (password.length < 8) { setFieldError('Choose a password of at least 8 characters.'); return; }
    setFieldError('');
    try {
      await registerWithPassword({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: selectedRole,
        ...(referralCode ? { referralCode } : {}),
      });
      // Password accounts start unverified → prompt for the emailed code.
      setOtpContext('signup');
      setOtpTimer(120);
      setMode('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { /* error shown from store */ }
  };

  // ── Email-code flows (no password) ──
  const handleEmailCode = async (kind: 'signup' | 'signin') => {
    clearError();
    setNotice('');
    if (!validateEmail(email)) return;
    try {
      if (kind === 'signup') await register(email.trim().toLowerCase());
      else await login(email.trim().toLowerCase());
      setOtpContext(kind);
      setOtpTimer(120);
      setMode('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { /* error shown from store */ }
  };

  const handleOtpSubmit = async () => {
    clearError();
    const otp = otpValues.join('');
    if (otp.length !== 6) { setFieldError('Enter the 6-digit code from your email.'); return; }
    setFieldError('');
    try {
      await verifyOtp(email.trim().toLowerCase(), otp);
      if (otpContext === 'signup') setMode('profile');
      else router.push('/dashboard');
    } catch { /* error shown from store */ }
  };

  const handleProfileSubmit = async () => {
    clearError();
    try {
      await completeProfile({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: selectedRole,
        ...(referralCode ? { referralCode } : {}),
      });
      if (selectedRole === 'AGENT') setMode('agent-id');
      else router.push('/dashboard');
    } catch { /* error shown from store */ }
  };

  const handleForgot = async () => {
    clearError();
    setNotice('');
    if (!validateEmail(email)) return;
    try {
      const data = await requestPasswordReset(email.trim().toLowerCase());
      const token = (data as { resetToken?: string }).resetToken;
      if (token) {
        setResetToken(token);
        setMode('reset');
        setNotice('Dev mode: reset token received — set your new password below.');
      } else {
        setMode('verify-notice');
        setNotice('If that email has an account, a reset link is on its way. Check your inbox.');
      }
    } catch { /* error shown from store */ }
  };

  const handleReset = async () => {
    clearError();
    setNotice('');
    if (password.length < 8) { setFieldError('Choose a password of at least 8 characters.'); return; }
    setFieldError('');
    try {
      await resetPassword(resetToken, password);
      setNotice('Password updated — redirecting…');
      router.push('/dashboard');
    } catch { /* error shown from store */ }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const next = [...otpValues];
    next[index] = digit;
    setOtpValues(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = useCallback((e: React.ClipboardEvent, current: string[]) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const next = [...current];
    paste.split('').forEach((d, i) => { next[i] = d; });
    setOtpValues(next);
    otpRefs.current[Math.min(paste.length, 5)]?.focus();
  }, []);

  const timerDisplay = `${String(Math.floor(otpTimer / 60)).padStart(2, '0')}:${String(otpTimer % 60).padStart(2, '0')}`;

  return (
    <div className="flex min-h-dvh w-full max-w-full overflow-x-clip bg-background">
      <a href="#auth-form" className="skip-link">Skip to main content</a>

      {/* Desktop hero side */}
      <div className="hidden lg:flex flex-[0_0_55%] relative overflow-hidden bg-gradient-to-br from-primary to-secondary items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1280&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-overlay" />
        <div className="absolute top-6 left-6 z-[3]">
          <BrandLogo size="md" />
        </div>
        <div className="relative z-[2] text-center px-10 max-w-[500px]">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-inverse)] mb-3">
            Join Africa&apos;s Real Estate Revolution
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Connect with verified agents, discover premium properties, and transact with confidence across the continent.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 lg:flex-[0_0_45%] flex items-start lg:items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-8 bg-background overflow-y-auto">
        <div
          id="auth-form"
          className="w-full max-w-[420px] p-6 sm:p-8 rounded-xl bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border border-[var(--color-border-glass)] shadow-glass my-auto"
        >
          <div className="flex items-center justify-center mb-6">
            <BrandLogo size="lg" />
          </div>

          {/* Mode tabs */}
          {['signin', 'signup', 'forgot', 'reset'].includes(mode) && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full border border-[var(--color-border-default)] mb-6 bg-white" role="tablist" aria-label="Sign in or create account">
              <button
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => switchMode('signin')}
                className={`min-h-[44px] rounded-full text-sm font-semibold transition-colors ${mode === 'signin' ? 'bg-accent text-accent-foreground' : 'text-secondary'}`}
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => switchMode('signup')}
                className={`min-h-[44px] rounded-full text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-accent text-accent-foreground' : 'text-secondary'}`}
              >
                Create account
              </button>
            </div>
          )}

          {referralCode && (mode === 'signin' || mode === 'signup') && (
            <div className="rounded-md p-3 border border-accent bg-warning-bg mb-4">
              <div className="text-xs font-semibold text-warning tracking-wider uppercase">Referral Applied</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-md font-bold text-primary">{referralCode}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-inverse">Applied</span>
              </div>
            </div>
          )}

          <ErrorAlert message={fieldError || error || ''} />
          <SuccessAlert message={notice} />
          {oauthError && <ErrorAlert message={oauthError} />}

          {/* ── SIGN IN ── */}
          {mode === 'signin' && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); handlePasswordSignIn(); }}>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Welcome back</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">Sign in with your email and password</p>

              <div className="mb-4">
                <label htmlFor="auth-email" className="block text-sm font-semibold text-secondary mb-1">Email address</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="mb-2">
                <label htmlFor="auth-password" className="block text-sm font-semibold text-secondary mb-1">Password</label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className={`${inputCls} pr-12`}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-semibold text-secondary underline underline-offset-2">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={isLoading || !email || !password} className="btn-primary w-full">
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>

              <button
                type="button"
                onClick={() => handleEmailCode('signin')}
                disabled={isLoading || !email}
                className="btn-secondary w-full mt-3"
              >
                Email me a sign-in code instead
              </button>

              <GoogleBlock ready={googleReady} btnRef={googleBtnRef} enabled={googleEnabled} />

              <p className="text-center text-sm text-muted-foreground mt-4">
                New here?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-secondary font-semibold hover:underline">
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP ── */}
          {mode === 'signup' && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); handlePasswordSignUp(); }}>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Create your account</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">We&apos;ll email you a code to verify your address</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label htmlFor="auth-firstname" className="block text-sm font-semibold text-secondary mb-1">First name</label>
                  <input id="auth-firstname" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="auth-lastname" className="block text-sm font-semibold text-secondary mb-1">Last name</label>
                  <input id="auth-lastname" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Obi" className={inputCls} style={inputStyle} />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="auth-email-su" className="block text-sm font-semibold text-secondary mb-1">Email address</label>
                <input id="auth-email-su" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} style={inputStyle} />
              </div>

              <div className="mb-4">
                <label htmlFor="auth-phone-su" className="block text-sm font-semibold text-secondary mb-1">Phone <span className="font-normal">(optional)</span></label>
                <input id="auth-phone-su" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" className={inputCls} style={inputStyle} />
              </div>

              <div className="mb-4">
                <label htmlFor="auth-password-su" className="block text-sm font-semibold text-secondary mb-1">Password</label>
                <div className="relative">
                  <input
                    id="auth-password-su"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputCls} pr-12`}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="auth-role-su" className="block text-sm font-semibold text-secondary mb-1">I am a…</label>
                <select id="auth-role-su" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="BUYER">Buyer / Renter</option>
                  <option value="AGENT">Real Estate Agent</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="HOMEOWNER">Homeowner</option>
                </select>
              </div>

              <button type="submit" disabled={isLoading || !email || !password || !firstName || !lastName} className="btn-primary w-full">
                {isLoading ? 'Creating account…' : 'Create account'}
              </button>

              <button type="button" onClick={() => handleEmailCode('signup')} disabled={isLoading || !email} className="btn-secondary w-full mt-3">
                Email me a code instead
              </button>

              <GoogleBlock ready={googleReady} btnRef={googleBtnRef} enabled={googleEnabled} />

              <p className="text-center text-sm text-muted-foreground mt-4">
                By continuing, you agree to our <Link href="/terms" className="text-secondary hover:underline">Terms</Link> and <Link href="/privacy" className="text-secondary hover:underline">Privacy Policy</Link>
              </p>
            </form>
          )}

          {/* ── OTP ── */}
          {mode === 'otp' && (
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Check your email</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6 break-all">
                We sent a code to <strong>{email}</strong>
              </p>
              <div className="flex gap-2 justify-center my-6 flex-wrap">
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? (e) => handleOtpPaste(e, otpValues) : undefined}
                    aria-label={`Code digit ${i + 1}`}
                    className={`w-11 h-14 sm:w-[52px] sm:h-[60px] text-center font-display text-xl sm:text-2xl font-bold rounded-md shadow-xs transition-all outline-none border-2 focus:border-[var(--color-brand-secondary)] ${val ? 'border-[var(--color-success)]' : 'border-[var(--color-border-default)]'}`}
                    style={{ color: 'var(--color-text-primary)', backgroundColor: '#FFFFFF' }}
                  />
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground mb-4">
                <span className="font-mono text-lg font-bold text-accent">{timerDisplay}</span>
                <span className="ml-1">remaining</span>
                <div className="mt-2">
                  <button
                    disabled={otpTimer > 0 || isLoading}
                    className="text-secondary font-semibold underline underline-offset-2 disabled:opacity-40"
                    onClick={async () => {
                      setOtpTimer(120);
                      try {
                        if (otpContext === 'signup') await register(email.trim().toLowerCase());
                        else await login(email.trim().toLowerCase());
                      } catch { /* shown from store */ }
                    }}
                  >
                    Resend code
                  </button>
                </div>
              </div>
              <button onClick={handleOtpSubmit} disabled={isLoading || otpValues.join('').length !== 6} className="btn-primary w-full">
                {isLoading ? 'Verifying…' : 'Verify'}
              </button>
              <button onClick={() => setMode(otpContext === 'signup' ? 'signup' : 'signin')} className="btn-secondary w-full mt-3">
                Back
              </button>
            </div>
          )}

          {/* ── FORGOT ── */}
          {mode === 'forgot' && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); handleForgot(); }}>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Reset your password</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">Enter your email and we&apos;ll send a reset link</p>
              <div className="mb-4">
                <label htmlFor="auth-email-fp" className="block text-sm font-semibold text-secondary mb-1">Email address</label>
                <input id="auth-email-fp" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} style={inputStyle} />
              </div>
              <button type="submit" disabled={isLoading || !email} className="btn-primary w-full">
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => switchMode('signin')} className="btn-secondary w-full mt-3">
                Back to sign in
              </button>
            </form>
          )}

          {/* ── RESET ── */}
          {mode === 'reset' && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); handleReset(); }}>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Choose a new password</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">At least 8 characters</p>
              {!resetToken && (
                <ErrorAlert message="That reset link is missing. Request a new one from the Forgot password page." />
              )}
              <div className="mb-4">
                <label htmlFor="auth-password-rp" className="block text-sm font-semibold text-secondary mb-1">New password</label>
                <div className="relative">
                  <input
                    id="auth-password-rp"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputCls} pr-12`}
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-secondary">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading || !resetToken || password.length < 8} className="btn-primary w-full">
                {isLoading ? 'Updating…' : 'Update password'}
              </button>
              <button type="button" onClick={() => switchMode('forgot')} className="btn-secondary w-full mt-3">
                Request a new link
              </button>
            </form>
          )}

          {/* ── VERIFY NOTICE ── */}
          {mode === 'verify-notice' && (
            <div className="text-center">
              <MailCheck className="w-12 h-12 mx-auto mb-4 text-secondary" />
              <h2 className="font-display text-2xl font-bold text-foreground">Check your inbox</h2>
              <p className="text-secondary text-sm mt-2 mb-6">{notice || 'If that email has an account, a link is on its way.'}</p>
              <button onClick={() => switchMode('signin')} className="btn-primary w-full">Back to sign in</button>
              <button
                onClick={async () => {
                  try { await resendVerification(email.trim().toLowerCase()); setNotice('Verification code resent — check your inbox.'); } catch { /* shown */ }
                }}
                disabled={isLoading || !email}
                className="btn-secondary w-full mt-3"
              >
                Resend verification code
              </button>
            </div>
          )}

          {/* ── PROFILE (OTP signup completion) ── */}
          {mode === 'profile' && (
            <form noValidate onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(); }}>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Complete your profile</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">Tell us a bit about yourself</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label htmlFor="auth-firstname-p" className="block text-sm font-semibold text-secondary mb-1">First name</label>
                  <input id="auth-firstname-p" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="auth-lastname-p" className="block text-sm font-semibold text-secondary mb-1">Last name</label>
                  <input id="auth-lastname-p" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Obi" className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="auth-phone-p" className="block text-sm font-semibold text-secondary mb-1">Phone number</label>
                <input id="auth-phone-p" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" className={inputCls} style={inputStyle} />
              </div>
              <div className="mb-5">
                <label htmlFor="auth-role-p" className="block text-sm font-semibold text-secondary mb-1">I am a…</label>
                <select id="auth-role-p" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={inputCls} style={inputStyle}>
                  <option value="BUYER">Buyer / Renter</option>
                  <option value="AGENT">Real Estate Agent</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="HOMEOWNER">Homeowner</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading || !firstName || !lastName || !phone} className="btn-primary w-full">
                {isLoading ? 'Saving…' : 'Continue'}
              </button>
            </form>
          )}

          {/* ── AGENT ID ── */}
          {mode === 'agent-id' && (
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-bg text-warning mb-3">
                Agent Verification
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground text-center">Verify your identity</h2>
              <p className="text-center text-secondary text-sm mt-1 mb-6">Upload a valid government-issued ID</p>
              <div className="border-2 border-dashed border-strong rounded-lg py-8 px-4 text-center bg-[var(--color-bg-glass)] transition-all cursor-pointer hover:border-secondary mb-4" role="button" tabIndex={0}>
                <Upload className="w-9 h-9 mx-auto mb-2 opacity-70 text-muted-foreground" />
                <div className="text-md font-semibold text-foreground">Upload ID Document</div>
                <div className="text-sm text-muted-foreground mt-1">Drag &amp; drop or click to browse</div>
                <div className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG (max 10MB)</div>
              </div>
              <Link href="/dashboard" className="btn-primary w-full mt-4 text-center">Skip for now</Link>
              <p className="text-center text-sm text-muted-foreground mt-4">Your documents are encrypted and used only for verification</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleBlock({ ready, btnRef, enabled }: { ready: boolean; btnRef: React.RefObject<HTMLDivElement>; enabled: boolean }) {
  return (
    <>
      <div className="flex items-center gap-3 my-5 text-muted-foreground text-xs">
        <div className="flex-1 h-px bg-border" />
        or continue with
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="w-full flex justify-center min-h-[44px]">
        {!ready && (
          <button disabled className="btn-outline w-full flex items-center justify-center gap-2 opacity-60" type="button">
            <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {enabled ? 'Loading Google…' : 'Configure Google OAuth'}
          </button>
        )}
        <div ref={btnRef} className={ready ? 'w-full flex justify-center' : 'hidden'} />
      </div>
      {!enabled && (
        <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>Set GOOGLE_CLIENT_ID to enable Google sign-in.</p>
      )}
    </>
  );
}
