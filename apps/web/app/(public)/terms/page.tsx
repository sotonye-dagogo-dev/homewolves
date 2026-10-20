import Link from 'next/link';

const LAST_UPDATED = 'October 20, 2026';

const SECTIONS = [
  {
    title: '1. About these terms',
    body: [
      'These Terms of Service govern your access to and use of HomeWolves, including our website, property marketplace, agent tools, messaging, transaction workflows, and related services. By creating an account or using the platform, you agree to these terms.',
      'If you use HomeWolves on behalf of a business, you confirm that you have authority to bind that business to these terms.',
    ],
  },
  {
    title: '2. Eligibility and accounts',
    body: [
      'You must be at least 18 years old and legally able to enter into contracts. You are responsible for the accuracy of the information you provide and for keeping your login credentials secure.',
      'You must notify us promptly if you believe your account has been accessed without permission. We may suspend or close accounts that breach these terms or present a risk to other users.',
    ],
  },
  {
    title: '3. Listings and marketplace conduct',
    body: [
      'Agents, developers, and homeowners are responsible for the accuracy of listings they publish, including pricing, availability, ownership authority, and property details. Listings may be reviewed, approved, rejected, or removed by our moderation team.',
      'You may not post fraudulent, misleading, discriminatory, or unlawful content, or use the platform to harass other users, scrape data at scale, or interfere with the service.',
    ],
  },
  {
    title: '4. Transactions and payments',
    body: [
      'HomeWolves provides workflow tools that help buyers, agents, and admins track property transactions. A transaction recorded on the platform is not itself a guarantee of title, financing, or completion.',
      'Payments and payment evidence may be processed through third-party payment providers. You are responsible for verifying transaction details before making any payment. Fees, where applicable, are shown before you confirm a paid service.',
    ],
  },
  {
    title: '5. Documents and electronic signatures',
    body: [
      'Transaction documents may be uploaded to secure storage and sent for electronic signature through our signing provider. You agree that electronic signatures and records may satisfy writing and signature requirements to the extent permitted by applicable law.',
      'You are responsible for reviewing documents before signing and for keeping copies of anything you sign.',
    ],
  },
  {
    title: '6. Messaging and content',
    body: [
      'Messages sent through HomeWolves may be stored so that participants can access their conversation history and so that we can investigate abuse. Do not share sensitive financial credentials in messages.',
      'You retain ownership of content you submit. You grant us a limited licence to host, display, and process that content as needed to operate and improve the service.',
    ],
  },
  {
    title: '7. Availability and changes',
    body: [
      'We work to keep the platform available and secure, but we do not guarantee uninterrupted access. Features may change, and we may suspend parts of the service for maintenance or safety reasons.',
      'We may update these terms from time to time. Material changes will be communicated through the platform or by email before they take effect.',
    ],
  },
  {
    title: '8. Limitation of liability',
    body: [
      'To the maximum extent permitted by law, HomeWolves is not liable for indirect, incidental, or consequential losses arising from your use of the platform, or for the acts and omissions of independent agents, developers, homeowners, buyers, or third-party providers.',
      'Nothing in these terms excludes liability that cannot lawfully be excluded.',
    ],
  },
  {
    title: '9. Contact',
    body: [
      'Questions about these terms can be sent through our contact page. We aim to respond to legal and account enquiries within a reasonable period.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-16 lg:px-10" style={{ background: 'var(--color-bg-base)' }}>
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--color-text-muted)' }}>
          Terms
        </p>
        <h1 className="mb-2 font-display text-4xl font-bold" style={{ color: 'var(--color-brand-primary)' }}>
          Terms of Service
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
          Need help with an account, listing, or transaction?{' '}
          <Link href="/contact" className="font-semibold" style={{ color: 'var(--color-brand-accent)' }}>
            Contact support
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
