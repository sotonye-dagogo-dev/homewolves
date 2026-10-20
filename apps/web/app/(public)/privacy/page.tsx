import Link from 'next/link';

const LAST_UPDATED = 'October 20, 2026';

const SECTIONS = [
  {
    title: '1. What we collect',
    body: [
      'Account information such as your name, email address, phone number, role, and profile photo. If you sign in with a third-party provider, we receive the account details you authorise that provider to share.',
      'Property and transaction information you submit, including listings, enquiries, messages, documents, payment evidence, and support or bug reports.',
      'Technical information such as device type, browser, approximate location derived from your IP address, and usage events that help us keep the platform secure and improve the experience.',
    ],
  },
  {
    title: '2. How we use information',
    body: [
      'To provide and operate the marketplace, including publishing listings, connecting buyers with agents, delivering messages and notifications, and tracking transaction progress.',
      'To verify accounts, prevent fraud and abuse, moderate content, and comply with legal obligations.',
      'To send transactional messages such as verification codes, enquiry alerts, and transaction updates. Marketing messages are only sent where permitted, and you can opt out at any time.',
    ],
  },
  {
    title: '3. Sharing and processors',
    body: [
      'We share information with service providers that help us run HomeWolves, including database hosting, payment processing, document signing, email delivery, file storage, and analytics. These providers process data on our instructions and under contractual safeguards.',
      'We may disclose information where required by law, to protect the rights and safety of users, or as part of a merger, acquisition, or restructuring.',
      'We do not sell your personal information.',
    ],
  },
  {
    title: '4. Cookies and local storage',
    body: [
      'We use cookies and browser storage to keep you signed in, remember preferences such as your theme, protect against abuse, and understand how the platform is used. You can control cookies through your browser settings, although some features may stop working if you disable them.',
    ],
  },
  {
    title: '5. Retention and security',
    body: [
      'We retain account, transaction, and communication records for as long as needed to provide the service, resolve disputes, meet legal requirements, and prevent fraud. When data is no longer needed, we delete or anonymise it.',
      'We use encryption in transit, access controls, and monitoring to protect data. No system is completely secure, so please use a strong password and keep your sign-in details private.',
    ],
  },
  {
    title: '6. Your choices and rights',
    body: [
      'Depending on where you live, you may have the right to access, correct, export, or delete your personal information, or to object to certain processing. You can update most account details from your dashboard.',
      'To make a privacy request, contact us through the contact page. We may need to verify your identity before acting on the request.',
    ],
  },
  {
    title: '7. Children',
    body: [
      'HomeWolves is not intended for anyone under 18. We do not knowingly collect personal information from children. If you believe a child has provided information, please contact us so we can remove it.',
    ],
  },
  {
    title: '8. Changes to this policy',
    body: [
      'We may update this policy as the platform evolves. Material changes will be communicated through the platform or by email before they take effect. The date at the top of this page shows when the policy was last revised.',
    ],
  },
  {
    title: '9. Contact',
    body: [
      'For privacy questions or requests, contact our team through the contact page. We aim to respond within a reasonable period and within any timeframe required by applicable law.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-16 lg:px-10" style={{ background: 'var(--color-bg-base)' }}>
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--color-text-muted)' }}>
          Privacy
        </p>
        <h1 className="mb-2 font-display text-4xl font-bold" style={{ color: 'var(--color-brand-primary)' }}>
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 font-display text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mb-3 text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div
          className="mt-10 rounded-xl p-5 text-sm"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)' }}
        >
          Want to exercise a privacy right?{' '}
          <Link href="/contact" className="font-semibold" style={{ color: 'var(--color-brand-accent)' }}>
            Contact our team
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
