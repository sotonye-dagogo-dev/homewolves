'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { usePlans, useInitiateCheckout, useMySubscription } from '@/hooks/use-subscriptions';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    description: 'Get started with basic listing access',
    price: 0,
    currency: 'NGN',
    interval: 'monthly',
    features: ['3 active listings', 'Basic analytics', 'Email support'],
    limits: { listings: 3, team_members: 1 },
    highlighted: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    slug: 'basic',
    description: 'For growing agents',
    price: 15000,
    currency: 'NGN',
    interval: 'monthly',
    features: ['15 active listings', 'Advanced analytics', 'CRM access', 'Messaging', 'Priority support'],
    limits: { listings: 15, team_members: 3 },
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    slug: 'pro',
    description: 'For serious agencies',
    price: 35000,
    currency: 'NGN',
    interval: 'monthly',
    features: ['Unlimited listings', 'All analytics', 'Full CRM', 'Transaction management', 'E-signature', 'Dedicated support'],
    limits: { listings: -1, team_members: 10 },
    highlighted: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For large brokerages',
    price: 100000,
    currency: 'NGN',
    interval: 'monthly',
    features: ['Everything in Pro', 'API access', 'White-label', 'Custom integrations', '24/7 support', 'Account manager'],
    limits: { listings: -1, team_members: -1 },
    highlighted: false,
  },
];

export default function PricingPage() {
  const { data: plans, isLoading, isError, error } = usePlans();
  const { data: mySub } = useMySubscription();
  const checkout = useInitiateCheckout();
  const { user } = useAuth();
  const router = useRouter();
  const [annual, setAnnual] = useState(false);

  // Normalize: usePlans may return array or {plans: array} depending on proxy; handle both
  const rawPlans: any[] = Array.isArray(plans) ? plans : (plans as any)?.plans ?? (plans as any)?.value ?? [];
  const displayPlans = (rawPlans.length > 0 ? rawPlans : FALLBACK_PLANS) as any[];

  const handleCheckout = async (planId: string) => {
    if (!user) {
      router.push('/auth?redirect=/pricing');
      return;
    }
    try {
      const result = await checkout.mutateAsync(planId) as any;
      if (result?.authorizationUrl) {
        window.open(result.authorizationUrl, '_blank');
      }
    } catch (e: any) {
      // error toast handled via mutation onError; fallback alert
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      {/* Header */}
      <div className="text-center px-4 pt-16 pb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>
          Choose Your Plan
        </h1>
        <p className="text-sm mt-2 mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          Everything you need to grow your real estate business
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-3 p-1 rounded-full" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)' }}>
          <button
            onClick={() => setAnnual(false)}
            className="px-4 py-1.5 text-sm font-semibold rounded-full transition-all"
            style={{
              background: !annual ? 'var(--color-brand-accent)' : 'transparent',
              color: !annual ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className="px-4 py-1.5 text-sm font-semibold rounded-full transition-all"
            style={{
              background: annual ? 'var(--color-brand-accent)' : 'transparent',
              color: annual ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
            }}
          >
            Annual <span className="text-xs opacity-70">(Save 20%)</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {isError && (
          <div className="rounded-xl p-4 mb-4 text-sm text-center" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
            Plans failed to load, showing default options. {(error as Error)?.message ?? ''}
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)' }}>
                <div className="h-4 skeleton rounded w-1/3 mb-4" />
                <div className="h-8 skeleton rounded w-1/2 mb-3" />
                <div className="h-3 skeleton rounded w-3/4 mb-2" />
                <div className="h-3 skeleton rounded w-2/3 mb-6" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-3 skeleton rounded w-full mb-2" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.isArray(displayPlans) && displayPlans.map((plan: any) => {
              const isCurrent = mySub?.plan?.id === plan.id;
              const price = annual ? Math.round(plan.price * 0.8) : plan.price;

              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-xl transition-all hover:translate-y-[-4px] ${
                    plan.highlighted ? 'ring-2' : ''
                  }`}
                  style={{
                    background: 'var(--color-bg-glass)',
                    backdropFilter: 'var(--glass-blur)',
                    border: `1px solid ${plan.highlighted ? 'var(--color-brand-accent)' : 'var(--color-border-glass)'}`,
                    boxShadow: plan.highlighted ? 'var(--shadow-lg)' : 'var(--shadow-glass)',
                  }}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 text-xs font-semibold rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                      Most Popular
                    </span>
                  )}

                  <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    {plan.name}
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
                      ₦{Number(price).toLocaleString()}
                    </span>
                    {Number(price) > 0 && (
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        /{annual ? 'yr' : 'mo'}
                      </span>
                    )}
                  </div>

                  {Number(price) === 0 && (
                    <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-brand-accent)' }}>
                      Free forever
                    </div>
                  )}

                  <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                    {plan.description}
                  </p>

                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isCurrent}
                    className="w-full mb-6 px-5 py-2.5 text-sm font-semibold rounded-full transition-all"
                    style={{
                      background: plan.highlighted ? 'var(--color-brand-accent)' : 'var(--color-bg-elevated)',
                      color: plan.highlighted ? 'var(--color-text-inverse)' : 'var(--color-brand-primary)',
                      border: plan.highlighted ? 'none' : '1px solid var(--color-brand-primary)',
                      opacity: isCurrent ? 0.5 : 1,
                    }}
                  >
                    {isCurrent ? 'Current Plan' : Number(price) === 0 ? 'Get Started' : 'Subscribe'}
                  </button>

                  <div className="space-y-3">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feat: any, i: number) => {
                      const label = typeof feat === 'string' ? feat : feat?.label ?? String(feat);
                      return (
                      <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {label}
                      </div>
                    );})}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ section */}
        <div className="mt-16 text-center">
          <h2 className="text-xl font-bold font-display mb-6" style={{ color: 'var(--color-brand-primary)' }}>
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto text-left space-y-4">
            {[
              { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect on your next billing cycle.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major Nigerian bank cards, bank transfers, and USSD via Paystack.' },
              { q: 'Is there a free trial?', a: 'Yes, new agents get a 14-day free trial on the Basic plan with full access.' },
              { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime. You will retain access until the end of your billing period.' },
            ].map((faq, i) => (
              <details key={i} className="p-4 rounded-xl" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)' }}>
                <summary className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>{faq.q}</summary>
                <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
