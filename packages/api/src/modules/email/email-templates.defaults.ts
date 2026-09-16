// Default (fallback) transactional email templates, used when the
// `EmailTemplate` DB table is empty/unreachable and to seed the table.
// Keys match the flows wired in EmailService. Variables use `{{varName}}`.

// Local shape mirrors global `EmailTemplate` but avoids requiring global.d.ts
// when this file is loaded via ts-node from drizzle/seed.ts (outside src).
export interface EmailTemplateDefault {
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromEmail?: string;
  active: boolean;
  description?: string;
  variables: { name: string; label: string; example?: string }[];
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateDefault[] = [
  {
    key: 'otp_code',
    name: 'Login / Signup Code',
    subject: 'Your Homewolves verification code is {{otp}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">' +
      '<span style="background:#C8813A;color:#fff;font-weight:700;padding:6px 10px;border-radius:6px">HW</span>' +
      '<strong style="font-size:18px">Homewolves</strong></div>' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>Use the code below to sign in to your Homewolves account:</p>' +
      '<div style="background:#F7F6F3;border:1px solid #E3E0D8;border-radius:12px;padding:24px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#1A3A5C;margin:16px 0">{{otp}}</div>' +
      '<p style="color:#8A9BB0;font-size:14px">This code expires in {{expiresInMinutes}} minutes. If you did not request it, you can ignore this email.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nYour Homewolves verification code is {{otp}}.\n\nIt expires in {{expiresInMinutes}} minutes.\n',
    active: true,
    description: 'Six-digit code used for email/OTP login and registration.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'otp', label: 'Verification code', example: '482913' },
      { name: 'expiresInMinutes', label: 'Code expiry (minutes)', example: '10' },
    ],
  },
  {
    key: 'welcome',
    name: 'Welcome',
    subject: 'Welcome to Homewolves, {{firstName}}!',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">' +
      '<span style="background:#C8813A;color:#fff;font-weight:700;padding:6px 10px;border-radius:6px">HW</span>' +
      '<strong style="font-size:18px">Homewolves</strong></div>' +
      '<h2 style="margin:0 0 8px">Welcome aboard, {{firstName}}!</h2>' +
      '<p>Your account is ready. Explore verified properties, connect with agents, and manage every step of your real estate journey in one place.</p>' +
      '<p style="margin:24px 0"><a href="{{siteUrl}}" style="display:inline-block;background:#C8813A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">Start exploring</a></p>' +
      '<p style="color:#8A9BB0;font-size:14px">If this was not you, please contact support.</p>' +
      '</div>',
    textBody: 'Welcome aboard, {{firstName}}!\n\nYour account is ready. Explore properties and manage your real estate journey at {{siteUrl}}.\n',
    active: true,
    description: 'Sent after account creation / profile completion.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'siteUrl', label: 'Platform URL', example: 'https://homewolves.com' },
    ],
  },
  {
    key: 'transaction_created',
    name: 'Transaction Started',
    subject: 'A deal has started: {{listingTitle}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>A transaction has been started for <strong>{{listingTitle}}</strong>. You can track every step — inspection, documents, payment and handover — from the transaction page.</p>' +
      '<p style="margin:24px 0"><a href="{{transactionUrl}}" style="display:inline-block;background:#C8813A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">View deal</a></p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nA transaction has been started for {{listingTitle}}. Track it at {{transactionUrl}}.\n',
    active: true,
    description: 'Notifies buyer and agent when a deal is created.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
      { name: 'transactionUrl', label: 'Transaction page URL', example: 'https://homewolves.com/transactions/abc' },
    ],
  },
  {
    key: 'transaction_completed',
    name: 'Deal Completed',
    subject: 'Congratulations — {{listingTitle}} is complete',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Well done, {{firstName}}!</h2>' +
      '<p>Your deal on <strong>{{listingTitle}}</strong> has been completed successfully. Thank you for transacting with Homewolves.</p>' +
      '</div>',
    textBody: 'Well done, {{firstName}}!\n\nYour deal on {{listingTitle}} has been completed successfully.\n',
    active: true,
    description: 'Sent to buyer and agent when a deal completes.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
    ],
  },
  {
    key: 'transaction_rejected',
    name: 'Deal Rejected',
    subject: 'Update on your deal: {{listingTitle}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>Unfortunately the transaction for <strong>{{listingTitle}}</strong> was rejected. Contact your agent for more details.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nUnfortunately the transaction for {{listingTitle}} was rejected.\n',
    active: true,
    description: 'Sent to buyer and agent when a deal is rejected.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
    ],
  },
  {
    key: 'transaction_cancelled',
    name: 'Deal Cancelled',
    subject: 'Your deal on {{listingTitle}} was cancelled',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>The transaction for <strong>{{listingTitle}}</strong> was cancelled. If this was unexpected, get in touch with your agent.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nThe transaction for {{listingTitle}} was cancelled.\n',
    active: true,
    description: 'Sent to buyer and agent when a deal is cancelled.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
    ],
  },
  {
    key: 'payment_confirmed',
    name: 'Payment Confirmed',
    subject: 'Payment confirmed for {{listingTitle}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>Your payment of <strong>{{amount}}</strong> for <strong>{{listingTitle}}</strong> has been confirmed.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nYour payment of {{amount}} for {{listingTitle}} has been confirmed.\n',
    active: true,
    description: 'Sent when a payment record is confirmed by an admin.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'amount', label: 'Confirmed amount', example: '₦85,000,000' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
    ],
  },
  {
    key: 'subscription_activated',
    name: 'Subscription Activated',
    subject: 'Your {{planName}} plan is active',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>Your <strong>{{planName}}</strong> subscription is now active. Enjoy your Homewolves features.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nYour {{planName}} subscription is now active.\n',
    active: true,
    description: 'Sent when a subscription is activated.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'planName', label: 'Plan name', example: 'Professional' },
    ],
  },
  {
    key: 'signature_requested',
    name: 'Signature Requested',
    subject: 'You have a document to sign: {{documentName}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{signerName}},</h2>' +
      '<p>Please review and sign <strong>{{documentName}}</strong> to keep your Homewolves deal moving.</p>' +
      '<p style="margin:24px 0"><a href="{{signUrl}}" style="display:inline-block;background:#C8813A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">Review &amp; sign</a></p>' +
      '</div>',
    textBody: 'Hi {{signerName}},\n\nPlease review and sign {{documentName}} at {{signUrl}}.\n',
    active: true,
    description: 'Sent to a signature request signer.',
    variables: [
      { name: 'signerName', label: 'Signer name', example: 'Ada' },
      { name: 'documentName', label: 'Document title', example: 'Offer Letter' },
      { name: 'signUrl', label: 'Signing URL', example: 'https://docuseal.example.com/s/abc' },
    ],
  },
  {
    key: 'listing_approved',
    name: 'Listing Approved',
    subject: 'Great news — your listing is live!',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>Your listing <strong>{{listingTitle}}</strong> has been approved and is now visible to buyers.</p>' +
      '<p style="margin:24px 0"><a href="{{listingUrl}}" style="display:inline-block;background:#C8813A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">View listing</a></p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nYour listing {{listingTitle}} has been approved and is now live.\n',
    active: true,
    description: 'Sent when a listing is approved by an admin.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
      { name: 'listingUrl', label: 'Listing URL', example: 'https://homewolves.com/properties/abc' },
    ],
  },
  {
    key: 'listing_rejected',
    name: 'Listing Rejected',
    subject: 'Update on your listing: {{listingTitle}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>Unfortunately your listing <strong>{{listingTitle}}</strong> was not approved. Review the details and try again.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nUnfortunately your listing {{listingTitle}} was not approved.\n',
    active: true,
    description: 'Sent when a listing is rejected by an admin.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
    ],
  },
  {
    key: 'referral_signup',
    name: 'Referral Signup',
    subject: 'Someone joined Homewolves with your referral',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p>A new user signed up using your referral code. Keep sharing to earn more rewards.</p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\nA new user signed up using your referral code.\n',
    active: true,
    description: 'Sent to a referrer when their code is used.',
    variables: [{ name: 'firstName', label: 'Recipient first name', example: 'Ada' }],
  },
  {
    key: 'price_drop',
    name: 'Price Drop Alert',
    subject: 'Price drop: {{listingTitle}}',
    htmlBody:
      '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1117">' +
      '<h2 style="margin:0 0 8px">Hi {{firstName}},</h2>' +
      '<p><strong>{{listingTitle}}</strong> just dropped from <s>{{oldPrice}}</s> to <strong>{{newPrice}}</strong>.</p>' +
      '<p style="margin:24px 0"><a href="{{listingUrl}}" style="display:inline-block;background:#C8813A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">View listing</a></p>' +
      '</div>',
    textBody: 'Hi {{firstName}},\n\n{{listingTitle}} dropped from {{oldPrice}} to {{newPrice}}. See it at {{listingUrl}}.\n',
    active: true,
    description: 'Price-drop notification for saved/notified users.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'listingTitle', label: 'Property title', example: '3-Bedroom in Lekki' },
      { name: 'oldPrice', label: 'Old price', example: '₦90,000,000' },
      { name: 'newPrice', label: 'New price', example: '₦85,000,000' },
      { name: 'listingUrl', label: 'Listing URL', example: 'https://homewolves.com/properties/abc' },
    ],
  },
];