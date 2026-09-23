// ─── ALL FALLBACK CONFIGURATIONS ────────────────────────────
// These activate only when PlatformConfig API is unreachable.

export const FALLBACK_BRAND: BrandConfig = {
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  ogImageUrl: '/og-image.png',
  companyName: 'Homewolves',
  tagline: 'African Real Estate Operating System',
};

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

// Google OAuth — client ID is public (not a secret). Server env GOOGLE_CLIENT_ID
// takes precedence when served by the API/config route; this is the hardcoded
// admin-editable fallback.
export const FALLBACK_GOOGLE_OAUTH = {
  clientId: '741943434744-0p05rl562etpe48t90qdbatu15l6n1kc.apps.googleusercontent.com',
  enabled: true,
};

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
