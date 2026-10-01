'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Megaphone, Check } from 'lucide-react';
import { submitAdApplication } from '@/lib/ads';

const inputCls =
  'w-full min-h-[52px] px-4 py-3 font-body text-base rounded-md border border-[var(--color-border-default)] placeholder:text-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[rgba(45,106,159,0.35)]';
const inputStyle = { color: 'var(--color-text-primary)', backgroundColor: '#FFFFFF' } as React.CSSProperties;

export default function AdvertisePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!company.trim()) { setError('Enter your company or brand name.'); return; }
    if (message.trim().length < 10) { setError('Tell us a little more (at least 10 characters).'); return; }
    setSending(true);
    try {
      await submitAdApplication({ name: name.trim(), email: email.trim().toLowerCase(), company: company.trim(), message: message.trim() });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="w-full max-w-[720px] mx-auto px-4 lg:px-10 py-8 lg:py-12 min-w-0">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent mb-6 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <span className="w-11 h-11 rounded-md bg-accent text-accent-foreground grid place-items-center shrink-0">
          <Megaphone className="w-6 h-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Advertise on Homewolves</h1>
          <p className="text-sm text-muted-foreground">Apply to use the homepage banner space</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-glass)] bg-[var(--color-bg-glass)] shadow-glass p-6 sm:p-8 mt-6">
        {done ? (
          <div className="text-center py-6">
            <span className="inline-grid place-items-center w-14 h-14 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success)] mb-4">
              <Check className="w-7 h-7" />
            </span>
            <h2 className="font-display text-xl font-bold text-foreground">Application received</h2>
            <p className="text-sm text-secondary mt-2">Our team will review your request and reply by email within 2 business days.</p>
            <Link href="/" className="btn-primary mt-6 inline-flex">Back to home</Link>
          </div>
        ) : (
          <form noValidate onSubmit={submit}>
            <p className="text-sm text-secondary mb-6">
              The homepage banner is managed by the Homewolves team. Tell us about your campaign and we&apos;ll
              get back to you with placement options and rates.
            </p>
            {error && (
              <p role="alert" className="text-sm font-medium rounded-md px-3 py-2.5 mb-4 border"
                style={{ color: 'var(--color-error)', backgroundColor: 'var(--color-error-bg)', borderColor: 'var(--color-error)' }}>
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label htmlFor="ad-name" className="block text-sm font-semibold text-secondary mb-1">Your name</label>
                <input id="ad-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Obi" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="ad-email" className="block text-sm font-semibold text-secondary mb-1">Email</label>
                <input id="ad-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="ad-company" className="block text-sm font-semibold text-secondary mb-1">Company / brand</label>
              <input id="ad-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Homes" className={inputCls} style={inputStyle} />
            </div>
            <div className="mb-5">
              <label htmlFor="ad-message" className="block text-sm font-semibold text-secondary mb-1">What do you want to promote?</label>
              <textarea
                id="ad-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Campaign goals, duration, budget range…"
                rows={4}
                className={`${inputCls} resize-y min-h-[120px]`}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full">
              {sending ? 'Submitting…' : 'Apply for ad space'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
