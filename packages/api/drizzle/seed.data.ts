export const SEED_IDS = {
  users: {
    admin: 'seed-user-admin-0001',
    agent1: 'seed-user-agent-0001',
    agent2: 'seed-user-agent-0002',
    buyer1: 'seed-user-buyer-0001',
    buyer2: 'seed-user-buyer-0002',
  },
  listings: [
    'seed-listing-0001',
    'seed-listing-0002',
    'seed-listing-0003',
    'seed-listing-0004',
    'seed-listing-0005',
    'seed-listing-0006',
  ],
  media: [
    'seed-media-0001',
    'seed-media-0002',
    'seed-media-0003',
    'seed-media-0004',
    'seed-media-0005',
    'seed-media-0006',
  ],
  blogPosts: [
    'seed-blog-0001',
    'seed-blog-0002',
    'seed-blog-0003',
  ],
  activityRules: [
    'seed-activity-listing_created',
    'seed-activity-listing_approved',
    'seed-activity-listing_sold',
    'seed-activity-client_added',
    'seed-activity-inspection_scheduled',
    'seed-activity-message_sent',
    'seed-activity-transaction_created',
    'seed-activity-transaction_completed',
    'seed-activity-review_received',
    'seed-activity-daily_login',
  ],
} as const;

export const SEED_PLATFORM_CONFIG_KEYS = [
  'amenities',
  'filter_pills',
  'nav_items',
  'property_types',
  'feature_flags',
  'hero_content',
  'stats',
  'referral_commission_rate',
  'featured_listing_price_daily',
] as const;

export const SEED_SUBSCRIPTION_PLAN_SLUGS = ['free', 'starter', 'professional', 'enterprise'] as const;

export const SEED_EMAIL_TEMPLATE_KEYS = [
  'otp_code',
  'welcome',
  'transaction_created',
  'transaction_completed',
  'transaction_rejected',
  'transaction_cancelled',
  'payment_confirmed',
  'subscription_activated',
  'signature_requested',
  'listing_approved',
  'listing_rejected',
  'referral_signup',
  'price_drop',
] as const;

export const SEED_MANIFEST = {
  ids: SEED_IDS,
  platformConfigKeys: [...SEED_PLATFORM_CONFIG_KEYS],
  subscriptionPlanSlugs: [...SEED_SUBSCRIPTION_PLAN_SLUGS],
  emailTemplateKeys: [...SEED_EMAIL_TEMPLATE_KEYS],
} as const;

/**
 * Default password for seed/demo accounts (`admin@`, `agent1@`, …).
 * Stored format mirrors the app hasher: `scrypt:<salt-hex>:<hash-hex>`
 * (see `hashPassword` in `apps/web/lib/server/auth-local.ts` and
 * `AuthService.hashPassword` in `packages/api`). Hash of `Homewolves123!`.
 *
 * Demo-only convenience so password sign-in works against seeded rows
 * (previously `passwordHash` was NULL, forcing every seed-account login
 * down the email-code path). Rotate for real environments — never reuse
 * for production users.
 */
export const SEED_USER_PASSWORD_HASH =
  'scrypt:b84dc5f8db52434d630dfe55fb013e51:2dab385a2f25af6bd2dfae799c51ee5e6adb6afbc25d551357c53e864b15543a7c3e52b0419ddd2ec6dd744a305d2dba54bd538aad43d43743a8479985f86d81';

export const SEED_USERS = [
  {
    id: SEED_IDS.users.admin,
    email: 'admin@homewolves.com',
    phone: '+2348000000001',
    firstName: 'Homewolves',
    lastName: 'Admin',
    role: 'ADMIN' as const,
    verified: true,
    referralCode: 'HW-ADMIN',
    passwordHash: SEED_USER_PASSWORD_HASH,
  },
  {
    id: SEED_IDS.users.agent1,
    email: 'agent1@homewolves.com',
    phone: '+2348000000002',
    firstName: 'Emeka',
    lastName: 'Okonkwo',
    role: 'AGENT' as const,
    verified: true,
    referralCode: 'HW-AGENT1',
    passwordHash: SEED_USER_PASSWORD_HASH,
  },
  {
    id: SEED_IDS.users.agent2,
    email: 'agent2@homewolves.com',
    phone: '+2348000000003',
    firstName: 'Aisha',
    lastName: 'Bello',
    role: 'AGENT' as const,
    verified: true,
    referralCode: 'HW-AGENT2',
    passwordHash: SEED_USER_PASSWORD_HASH,
  },
  {
    id: SEED_IDS.users.buyer1,
    email: 'buyer1@homewolves.com',
    phone: '+2348000000004',
    firstName: 'Chidi',
    lastName: 'Eze',
    role: 'BUYER' as const,
    verified: true,
    referralCode: 'HW-BUYER1',
    passwordHash: SEED_USER_PASSWORD_HASH,
  },
  {
    id: SEED_IDS.users.buyer2,
    email: 'buyer2@homewolves.com',
    phone: '+2348000000005',
    firstName: 'Ngozi',
    lastName: 'Okafor',
    role: 'BUYER' as const,
    verified: true,
    referralCode: 'HW-BUYER2',
    passwordHash: SEED_USER_PASSWORD_HASH,
  },
];

export const SEED_ACTIVITY_RULES = [
  { id: SEED_IDS.activityRules[0]!, key: 'listing_created', label: 'Listing Created', points: 10, category: 'listing' },
  { id: SEED_IDS.activityRules[1]!, key: 'listing_approved', label: 'Listing Approved', points: 20, category: 'listing' },
  { id: SEED_IDS.activityRules[2]!, key: 'listing_sold', label: 'Listing Sold', points: 100, category: 'deal' },
  { id: SEED_IDS.activityRules[3]!, key: 'client_added', label: 'Client Added', points: 5, category: 'crm' },
  { id: SEED_IDS.activityRules[4]!, key: 'inspection_scheduled', label: 'Inspection Scheduled', points: 3, category: 'crm' },
  { id: SEED_IDS.activityRules[5]!, key: 'message_sent', label: 'Message Sent', points: 1, category: 'communication', cooldownMs: 60000 },
  { id: SEED_IDS.activityRules[6]!, key: 'transaction_created', label: 'Transaction Created', points: 15, category: 'deal' },
  { id: SEED_IDS.activityRules[7]!, key: 'transaction_completed', label: 'Deal Closed', points: 200, category: 'deal' },
  { id: SEED_IDS.activityRules[8]!, key: 'review_received', label: '5-Star Review', points: 20, category: 'crm' },
  { id: SEED_IDS.activityRules[9]!, key: 'daily_login', label: 'Daily Login', points: 2, category: 'engagement', cooldownMs: 86400000 },
];

export const SEED_LISTINGS = [
  {
    id: SEED_IDS.listings[0]!,
    title: '4-Bedroom Duplex in Lekki Phase 1',
    description: 'Spacious duplex with fitted kitchen, BQ, and swimming pool access. Secure estate with 24/7 power.',
    price: '85000000',
    category: 'SALE' as const,
    propertyType: 'duplex',
    status: 'ACTIVE' as const,
    verified: true,
    featured: true,
    ownerId: SEED_IDS.users.agent1,
    agentId: SEED_IDS.users.agent1,
    locationJson: { city: 'Lagos', area: 'Lekki Phase 1', latitude: 6.4457, longitude: 3.471 },
    amenityIds: ['parking', 'security', 'generator', 'cctv'],
  },
  {
    id: SEED_IDS.listings[1]!,
    title: '2-Bedroom Apartment in Yaba',
    description: 'Modern apartment near UNILAG, tiled floors and prepaid meter. Ideal for young professionals.',
    price: '2500000',
    category: 'RENT' as const,
    propertyType: 'apartment',
    status: 'ACTIVE' as const,
    verified: true,
    featured: false,
    ownerId: SEED_IDS.users.agent1,
    agentId: SEED_IDS.users.agent1,
    locationJson: { city: 'Lagos', area: 'Yaba', latitude: 6.5095, longitude: 3.3711 },
    amenityIds: ['parking', 'water-supply', 'security'],
  },
  {
    id: SEED_IDS.listings[2]!,
    title: 'Luxury Shortlet in Victoria Island',
    description: 'Fully serviced shortlet with sea view, daily cleaning, and high-speed Wi-Fi. Minimum 2 nights.',
    price: '75000',
    category: 'SHORTLET' as const,
    propertyType: 'penthouse',
    status: 'ACTIVE' as const,
    verified: true,
    featured: true,
    ownerId: SEED_IDS.users.agent2,
    agentId: SEED_IDS.users.agent2,
    locationJson: { city: 'Lagos', area: 'Victoria Island', latitude: 6.4281, longitude: 3.4219 },
    amenityIds: ['wifi', 'gym', 'swimming-pool', 'elevator'],
  },
  {
    id: SEED_IDS.listings[3]!,
    title: 'Half Plot in Epe - Dry Land',
    description: 'Verified dry land with C of O in view, accessible road network and close to Epe Resort.',
    price: '3500000',
    category: 'LAND' as const,
    propertyType: 'commercial',
    status: 'ACTIVE' as const,
    verified: false,
    featured: false,
    ownerId: SEED_IDS.users.agent2,
    agentId: SEED_IDS.users.agent2,
    locationJson: { city: 'Lagos', area: 'Epe', latitude: 6.5868, longitude: 3.9842 },
    amenityIds: ['security', 'water-supply'],
  },
  {
    id: SEED_IDS.listings[4]!,
    title: '3-Bedroom Terrace in Wuye, Abuja',
    description: 'New development terrace with smart home wiring, fitted wardrobes, and balcony.',
    price: '62000000',
    category: 'SALE' as const,
    propertyType: 'terrace',
    status: 'PENDING' as const,
    verified: false,
    featured: false,
    ownerId: SEED_IDS.users.agent1,
    agentId: SEED_IDS.users.agent1,
    locationJson: { city: 'Abuja', area: 'Wuye', latitude: 9.065, longitude: 7.44 },
    amenityIds: ['parking', 'gym', 'security', 'generator'],
  },
  {
    id: SEED_IDS.listings[5]!,
    title: 'Studio Apartment in Ikeja GRA',
    description: 'Compact studio for shortlet and monthly rent, furnished with en-suite and kitchenette.',
    price: '1800000',
    category: 'RENT' as const,
    propertyType: 'studio',
    status: 'ACTIVE' as const,
    verified: true,
    featured: false,
    ownerId: SEED_IDS.users.agent2,
    agentId: SEED_IDS.users.agent2,
    locationJson: { city: 'Lagos', area: 'Ikeja GRA', latitude: 6.5836, longitude: 3.355 },
    amenityIds: ['wifi', 'parking', 'water-supply'],
  },
];

export const SEED_MEDIA = SEED_LISTINGS.map((l, i) => ({
  id: SEED_IDS.media[i]!,
  listingId: l.id,
  url: `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&seed=${l.id}`,
  type: 'image',
  altText: l.title,
  isPrimary: true,
  displayOrder: 0,
}));

export const SEED_BLOG_POSTS = [
  {
    id: SEED_IDS.blogPosts[0]!,
    title: 'Lagos Real Estate Outlook 2026',
    slug: 'lagos-real-estate-outlook-2026',
    excerpt: 'What buyers and investors should know about Lagos this year — prices, yields, and emerging corridors.',
    content: '<p>Lagos remains the engine of Nigerian real estate. From Lekki to Epe, demand is steady...</p><p>Investors should watch infrastructure corridors and verified title land.</p>',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    authorId: SEED_IDS.users.admin,
    categories: ['Market', 'Investment'],
    tags: ['lagos', 'investment', '2026'],
    published: true,
    featured: true,
  },
  {
    id: SEED_IDS.blogPosts[1]!,
    title: 'How to Verify a Property Before You Pay',
    slug: 'how-to-verify-a-property-before-you-pay',
    excerpt: 'A practical checklist — documents, site visits, and title verification.',
    content: '<p>Never pay without verification. Start with the title documents and a site visit...</p>',
    coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    authorId: SEED_IDS.users.admin,
    categories: ['Guides'],
    tags: ['verification', 'guide'],
    published: true,
    featured: false,
  },
  {
    id: SEED_IDS.blogPosts[2]!,
    title: 'Shortlets vs Long Lets: What Pays Better in VI?',
    slug: 'shortlets-vs-long-lets-what-pays-better-in-vi',
    excerpt: 'We compare yields for shortlet and annual rent in Victoria Island.',
    content: '<p>Victoria Island rewards shortlet operators during peak season, but annual lets offer stability...</p>',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    authorId: SEED_IDS.users.admin,
    categories: ['Market', 'Rental'],
    tags: ['shortlet', 'vi', 'yield'],
    published: false,
    featured: false,
  },
];
