// ─── ALL FALLBACK CONFIGURATIONS ────────────────────────────
// These activate only when PlatformConfig API is unreachable.

export const FALLBACK_AMENITIES: AmenityConfig[] = [
  { id: 'pool', label: 'Swimming Pool', icon: 'Pool', active: true, displayOrder: 1 },
  { id: 'parking', label: 'Parking Space', icon: 'Car', active: true, displayOrder: 2 },
  { id: 'generator', label: 'Generator', icon: 'Zap', active: true, displayOrder: 3 },
  { id: 'security', label: '24/7 Security', icon: 'Shield', active: true, displayOrder: 4 },
  { id: 'cctv', label: 'CCTV', icon: 'Camera', active: true, displayOrder: 5 },
  { id: 'ac', label: 'Air Conditioning', icon: 'Wind', active: true, displayOrder: 6 },
  { id: 'gym', label: 'Gym', icon: 'Dumbbell', active: true, displayOrder: 7 },
  { id: 'garden', label: 'Garden', icon: 'Trees', active: true, displayOrder: 8 },
  { id: 'water', label: 'Borehole Water', icon: 'Droplets', active: true, displayOrder: 9 },
  { id: 'internet', label: 'Internet Ready', icon: 'Wifi', active: true, displayOrder: 10 },
];

export const FALLBACK_FILTER_PILLS: FilterPillConfig[] = [
  { id: 'all', label: 'All', queryParam: 'category', active: true, displayOrder: 1 },
  { id: 'sale', label: 'For Sale', queryParam: 'category', active: true, displayOrder: 2 },
  { id: 'rent', label: 'Rent', queryParam: 'category', active: true, displayOrder: 3 },
  { id: 'shortlet', label: 'Shortlet', queryParam: 'category', active: true, displayOrder: 4 },
  { id: 'land', label: 'Land', queryParam: 'category', active: true, displayOrder: 5 },
  { id: 'new_dev', label: 'New Development', queryParam: 'type', active: true, displayOrder: 6 },
  { id: 'furnished', label: 'Furnished', queryParam: 'furnished', active: true, displayOrder: 7 },
  { id: 'verified', label: 'Verified', queryParam: 'verified', active: true, displayOrder: 8 },
];

export const FALLBACK_NAV_ITEMS: NavItemConfig[] = [
  { id: 'explore', label: 'Explore', path: '/', icon: 'Compass', roles: ['GUEST', 'BUYER'] as UserRole[], active: true, displayOrder: 1 },
  { id: 'properties', label: 'Properties', path: '/properties', icon: 'Building2', roles: ['GUEST', 'BUYER'] as UserRole[], active: true, displayOrder: 2 },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard/agent', icon: 'LayoutDashboard', roles: ['AGENT'] as UserRole[], active: true, displayOrder: 3 },
  { id: 'messages', label: 'Messages', path: '/messages', icon: 'MessageCircle', roles: ['AGENT', 'BUYER'] as UserRole[], active: true, displayOrder: 4 },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: 'ArrowLeftRight', roles: ['AGENT', 'BUYER', 'ADMIN'] as UserRole[], active: true, displayOrder: 5 },
  { id: 'admin', label: 'Admin', path: '/admin', icon: 'Shield', roles: ['ADMIN', 'SUPER_ADMIN'] as UserRole[], active: true, displayOrder: 6 },
];

export const FALLBACK_PROPERTY_TYPES: PropertyTypeConfig[] = [
  { id: 'apartment', label: 'Apartment', icon: 'Building', category: 'RENT' as ListingCategory, active: true, displayOrder: 1 },
  { id: 'house', label: 'House', icon: 'Home', category: 'SALE' as ListingCategory, active: true, displayOrder: 2 },
  { id: 'duplex', label: 'Duplex', icon: 'Building2', category: 'SALE' as ListingCategory, active: true, displayOrder: 3 },
  { id: 'bunglow', label: 'Bungalow', icon: 'Home', category: 'SALE' as ListingCategory, active: true, displayOrder: 4 },
  { id: 'terrace', label: 'Terrace', icon: 'Rows', category: 'RENT' as ListingCategory, active: true, displayOrder: 5 },
  { id: 'penthouse', label: 'Penthouse', icon: 'Building', category: 'SALE' as ListingCategory, active: true, displayOrder: 6 },
  { id: 'studio', label: 'Studio', icon: 'DoorOpen', category: 'RENT' as ListingCategory, active: true, displayOrder: 7 },
  { id: 'land', label: 'Land Plot', icon: 'Map', category: 'LAND' as ListingCategory, active: true, displayOrder: 8 },
  { id: 'commercial', label: 'Commercial', icon: 'Store', category: 'RENT' as ListingCategory, active: true, displayOrder: 9 },
];

export const FALLBACK_TRANSACTION_STEPS: TransactionStepTemplate[] = [
  { id: 'inspection_scheduled', label: 'Inspection Scheduled', order: 1, requiredRoles: ['AGENT', 'BUYER'] as UserRole[], requiresEvidence: false, active: true },
  { id: 'inspection_completed', label: 'Inspection Completed', order: 2, requiredRoles: ['AGENT'] as UserRole[], requiresEvidence: true, active: true },
  { id: 'documents_received', label: 'Documents Received', order: 3, requiredRoles: ['AGENT'] as UserRole[], requiresEvidence: true, active: true },
  { id: 'due_diligence', label: 'Due Diligence', order: 4, requiredRoles: ['ADMIN'] as UserRole[], requiresEvidence: true, active: true },
  { id: 'contract_signed', label: 'Contract Signed', order: 5, requiredRoles: ['AGENT', 'BUYER'] as UserRole[], requiresEvidence: true, active: true },
  { id: 'payment_submitted', label: 'Payment Submitted', order: 6, requiredRoles: ['BUYER'] as UserRole[], requiresEvidence: true, active: true },
  { id: 'admin_approval', label: 'Admin Approval', order: 7, requiredRoles: ['ADMIN'] as UserRole[], requiresEvidence: false, active: true },
  { id: 'completed', label: 'Completed', order: 8, requiredRoles: ['ADMIN'] as UserRole[], requiresEvidence: false, active: true },
];

export const FALLBACK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'map_view', enabled: true, rolloutPercentage: 100, roles: ['GUEST', 'BUYER', 'AGENT'] as UserRole[] },
  { id: 'ai_chatbot', enabled: false, rolloutPercentage: 0, roles: ['GUEST', 'BUYER'] as UserRole[] },
  { id: 'e_signature', enabled: false, rolloutPercentage: 0, roles: ['AGENT', 'BUYER'] as UserRole[] },
  { id: 'offline_mode', enabled: false, rolloutPercentage: 0, roles: ['BUYER'] as UserRole[] },
  { id: 'referral_system', enabled: true, rolloutPercentage: 100, roles: ['AGENT'] as UserRole[] },
];

export const FALLBACK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free', name: 'Free', description: 'List up to 3 properties', price: { amount: 0, currency: 'NGN' },
    interval: 'monthly', features: [
      { id: 'listings_3', label: '3 Active Listings', included: true, limit: 3 },
      { id: 'crm_basic', label: 'Basic CRM', included: true },
      { id: 'analytics_basic', label: 'Basic Analytics', included: true },
      { id: 'priority_support', label: 'Priority Support', included: false },
    ], highlighted: false, active: true,
  },
  {
    id: 'pro', name: 'Professional', description: 'List up to 20 properties with full CRM', price: { amount: 15000, currency: 'NGN' },
    interval: 'monthly', features: [
      { id: 'listings_20', label: '20 Active Listings', included: true, limit: 20 },
      { id: 'crm_full', label: 'Full CRM', included: true },
      { id: 'analytics_full', label: 'Advanced Analytics', included: true },
      { id: 'priority_support', label: 'Priority Support', included: true },
    ], highlighted: true, active: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', description: 'Unlimited listings and dedicated account manager', price: { amount: 50000, currency: 'NGN' },
    interval: 'monthly', features: [
      { id: 'listings_unlimited', label: 'Unlimited Listings', included: true },
      { id: 'crm_full', label: 'Full CRM', included: true },
      { id: 'analytics_full', label: 'Advanced Analytics', included: true },
      { id: 'priority_support', label: 'Dedicated Support', included: true },
    ], highlighted: false, active: true,
  },
];

export const FALLBACK_PROPERTY_CARD_CONFIG: PropertyCardConfig = {
  showAgent: true,
  showBadges: true,
  maxPills: 3,
  imageAspectRatio: '16:9',
};

export const FALLBACK_BENTO_CONFIG: BentoCellConfig = {
  size: '1x1',
};

export const FALLBACK_LISTINGS: Array<{
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  propertyType: string;
  status: string;
  verified: boolean;
  featured: boolean;
  viewCount: number;
  locationJson: Record<string, string>;
  amenityIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  owner: { id: string; firstName: string; lastName: string; email: string; role: string };
  media: Array<{ id: string; listingId: string; url: string; type: string; isPrimary: boolean; displayOrder: number; altText: string }>;
}> = [
  {
    id: 'seed-listing-0001',
    title: '4-Bedroom Duplex in Lekki Phase 1',
    description: 'Spacious duplex with fitted kitchen, BQ, and swimming pool access. Secure estate with 24/7 power.',
    price: '85000000',
    currency: 'NGN',
    category: 'SALE',
    propertyType: 'duplex',
    status: 'ACTIVE',
    verified: true,
    featured: true,
    viewCount: 142,
    locationJson: { city: 'Lagos', state: 'Lagos', area: 'Lekki Phase 1', address: 'Admiralty Way, Lekki' },
    amenityIds: ['parking', 'security', 'generator', 'cctv'],
    metadata: { beds: 4, baths: 4, size: 420 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    owner: { id: 'seed-user-agent-0001', firstName: 'Emeka', lastName: 'Okonkwo', email: 'agent1@homewolves.com', role: 'AGENT' },
    media: [{ id: 'seed-media-0001', listingId: 'seed-listing-0001', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&seed=seed-listing-0001', type: 'image', isPrimary: true, displayOrder: 0, altText: '4-Bedroom Duplex in Lekki Phase 1' }],
  },
  {
    id: 'seed-listing-0002',
    title: '2-Bedroom Apartment in Yaba',
    description: 'Modern apartment near UNILAG, tiled floors and prepaid meter. Ideal for young professionals.',
    price: '2500000',
    currency: 'NGN',
    category: 'RENT',
    propertyType: 'apartment',
    status: 'ACTIVE',
    verified: true,
    featured: false,
    viewCount: 89,
    locationJson: { city: 'Lagos', state: 'Lagos', area: 'Yaba', address: 'Herbert Macaulay Way, Yaba' },
    amenityIds: ['parking', 'water-supply', 'security'],
    metadata: { beds: 2, baths: 2, size: 85 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    owner: { id: 'seed-user-agent-0001', firstName: 'Emeka', lastName: 'Okonkwo', email: 'agent1@homewolves.com', role: 'AGENT' },
    media: [{ id: 'seed-media-0002', listingId: 'seed-listing-0002', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&seed=seed-listing-0002', type: 'image', isPrimary: true, displayOrder: 0, altText: '2-Bedroom Apartment in Yaba' }],
  },
  {
    id: 'seed-listing-0003',
    title: 'Luxury Shortlet in Victoria Island',
    description: 'Fully serviced shortlet with sea view, daily cleaning, and high-speed Wi-Fi. Minimum 2 nights.',
    price: '75000',
    currency: 'NGN',
    category: 'SHORTLET',
    propertyType: 'penthouse',
    status: 'ACTIVE',
    verified: true,
    featured: true,
    viewCount: 210,
    locationJson: { city: 'Lagos', state: 'Lagos', area: 'Victoria Island', address: 'Adeola Odeku, VI' },
    amenityIds: ['wifi', 'gym', 'swimming-pool', 'elevator'],
    metadata: { beds: 3, baths: 3, size: 180 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    owner: { id: 'seed-user-agent-0002', firstName: 'Aisha', lastName: 'Bello', email: 'agent2@homewolves.com', role: 'AGENT' },
    media: [{ id: 'seed-media-0003', listingId: 'seed-listing-0003', url: 'https://images.unsplash.com/photo-1600607688961-a5bf58b5b2fc?w=800&q=80&seed=seed-listing-0003', type: 'image', isPrimary: true, displayOrder: 0, altText: 'Luxury Shortlet in Victoria Island' }],
  },
  {
    id: 'seed-listing-0004',
    title: 'Half Plot in Epe - Dry Land',
    description: 'Verified dry land with C of O in view, accessible road network and close to Epe Resort.',
    price: '3500000',
    currency: 'NGN',
    category: 'LAND',
    propertyType: 'commercial',
    status: 'ACTIVE',
    verified: false,
    featured: false,
    viewCount: 34,
    locationJson: { city: 'Lagos', state: 'Lagos', area: 'Epe', address: 'Epe-Ijebu Ode Road' },
    amenityIds: ['security', 'water-supply'],
    metadata: { size: 600 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    owner: { id: 'seed-user-agent-0002', firstName: 'Aisha', lastName: 'Bello', email: 'agent2@homewolves.com', role: 'AGENT' },
    media: [{ id: 'seed-media-0004', listingId: 'seed-listing-0004', url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80&seed=seed-listing-0004', type: 'image', isPrimary: true, displayOrder: 0, altText: 'Half Plot in Epe - Dry Land' }],
  },
  {
    id: 'seed-listing-0005',
    title: '3-Bedroom Terrace in Wuye, Abuja',
    description: 'New development terrace with smart home wiring, fitted wardrobes, and balcony.',
    price: '62000000',
    currency: 'NGN',
    category: 'SALE',
    propertyType: 'terrace',
    status: 'ACTIVE',
    verified: false,
    featured: false,
    viewCount: 67,
    locationJson: { city: 'Abuja', state: 'FCT', area: 'Wuye', address: 'Wuye District, Abuja' },
    amenityIds: ['parking', 'gym', 'security', 'generator'],
    metadata: { beds: 3, baths: 3, size: 280 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    owner: { id: 'seed-user-agent-0001', firstName: 'Emeka', lastName: 'Okonkwo', email: 'agent1@homewolves.com', role: 'AGENT' },
    media: [{ id: 'seed-media-0005', listingId: 'seed-listing-0005', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&seed=seed-listing-0005', type: 'image', isPrimary: true, displayOrder: 0, altText: '3-Bedroom Terrace in Wuye, Abuja' }],
  },
  {
    id: 'seed-listing-0006',
    title: 'Studio Apartment in Ikeja GRA',
    description: 'Compact studio for shortlet and monthly rent, furnished with en-suite and kitchenette.',
    price: '1800000',
    currency: 'NGN',
    category: 'RENT',
    propertyType: 'studio',
    status: 'ACTIVE',
    verified: true,
    featured: false,
    viewCount: 52,
    locationJson: { city: 'Lagos', state: 'Lagos', area: 'Ikeja GRA', address: 'Oduduwa Crescent, Ikeja' },
    amenityIds: ['wifi', 'parking', 'water-supply'],
    metadata: { beds: 1, baths: 1, size: 45 },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    owner: { id: 'seed-user-agent-0002', firstName: 'Aisha', lastName: 'Bello', email: 'agent2@homewolves.com', role: 'AGENT' },
    media: [{ id: 'seed-media-0006', listingId: 'seed-listing-0006', url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80&seed=seed-listing-0006', type: 'image', isPrimary: true, displayOrder: 0, altText: 'Studio Apartment in Ikeja GRA' }],
  },
];

export const FALLBACK_BLOG_POSTS: Array<{
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: { firstName: string; lastName: string };
  categories: string[];
  tags: string[];
  published: boolean;
  featured: boolean;
  publishedAt: string;
}> = [
  {
    id: 'seed-blog-0001',
    title: 'Lagos Real Estate Outlook 2026',
    slug: 'lagos-real-estate-outlook-2026',
    excerpt: 'What buyers and investors should know about Lagos this year — prices, yields, and emerging corridors.',
    content: '<p>Lagos remains the engine of Nigerian real estate. From Lekki to Epe, demand is steady...</p><p>Investors should watch infrastructure corridors and verified title land.</p>',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    author: { firstName: 'Homewolves', lastName: 'Admin' },
    categories: ['Market', 'Investment'],
    tags: ['lagos', 'investment', '2026'],
    published: true,
    featured: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'seed-blog-0002',
    title: 'How to Verify a Property Before You Pay',
    slug: 'how-to-verify-a-property-before-you-pay',
    excerpt: 'A practical checklist — documents, site visits, and title verification.',
    content: '<p>Never pay without verification. Start with the title documents and a site visit...</p>',
    coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    author: { firstName: 'Homewolves', lastName: 'Admin' },
    categories: ['Guides'],
    tags: ['verification', 'guide'],
    published: true,
    featured: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'seed-blog-0003',
    title: 'Shortlets vs Long Lets: What Pays Better in VI?',
    slug: 'shortlets-vs-long-lets-what-pays-better-in-vi',
    excerpt: 'We compare yields for shortlet and annual rent in Victoria Island.',
    content: '<p>Victoria Island rewards shortlet operators during peak season, but annual lets offer stability...</p>',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    author: { firstName: 'Homewolves', lastName: 'Admin' },
    categories: ['Market', 'Rental'],
    tags: ['shortlet', 'vi', 'yield'],
    published: true,
    featured: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
];

// Lightweight email-template fallbacks — activation only when the templates
// API is unreachable. The API seeds its own full copies (email-templates.defaults.ts).
export const FALLBACK_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: 'otp_code',
    name: 'Login / Signup Code',
    subject: 'Your Homewolves verification code is {{otp}}',
    htmlBody: 'Hi {{firstName}},<br/><br/>Your verification code is <strong>{{otp}}</strong>. It expires in {{expiresInMinutes}} minutes.',
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
    htmlBody: 'Hi {{firstName}},<br/><br/>Your account is ready. Explore properties at {{siteUrl}}.',
    active: true,
    description: 'Sent after account creation / profile completion.',
    variables: [
      { name: 'firstName', label: 'Recipient first name', example: 'Ada' },
      { name: 'siteUrl', label: 'Platform URL', example: 'https://homewolves.com' },
    ],
  },
];
