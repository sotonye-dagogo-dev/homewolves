import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/drizzle/schema';
import { SEED_USERS, SEED_LISTINGS, SEED_MEDIA, SEED_BLOG_POSTS, SEED_ACTIVITY_RULES } from './seed.data';
import { DEFAULT_EMAIL_TEMPLATES } from '../src/modules/email/email-templates.defaults';
import { revertSeed, revertPlatformConfigAndPlans, revertSeedUsers } from './seed.revert';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Set it to run the seed.');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema });

const ADMIN_ID = 'seed-system';

const FALLBACK_AMENITIES = [
  { id: 'parking', label: 'Parking', icon: 'Car', active: true, display_order: 1 },
  { id: 'swimming-pool', label: 'Swimming Pool', icon: 'Pool', active: true, display_order: 2 },
  { id: 'security', label: '24/7 Security', icon: 'Shield', active: true, display_order: 3 },
  { id: 'generator', label: 'Generator', icon: 'Zap', active: true, display_order: 4 },
  { id: 'wifi', label: 'Wi-Fi', icon: 'Wifi', active: true, display_order: 5 },
  { id: 'cctv', label: 'CCTV', icon: 'Camera', active: true, display_order: 6 },
  { id: 'water-supply', label: 'Water Supply', icon: 'Droplets', active: true, display_order: 7 },
  { id: 'serviced', label: 'Serviced', icon: 'Tool', active: true, display_order: 8 },
  { id: 'gym', label: 'Gym', icon: 'Dumbbell', active: true, display_order: 9 },
  { id: 'elevator', label: 'Elevator', icon: 'ArrowUpDown', active: true, display_order: 10 },
];

const FALLBACK_FILTER_PILLS = [
  { id: 'all', label: 'All', query_param: '', active: true, display_order: 1 },
  { id: 'for-sale', label: 'For Sale', query_param: 'category=SALE', active: true, display_order: 2 },
  { id: 'rent', label: 'Rent', query_param: 'category=RENT', active: true, display_order: 3 },
  { id: 'shortlet', label: 'Shortlet', query_param: 'category=SHORTLET', active: true, display_order: 4 },
  { id: 'land', label: 'Land', query_param: 'category=LAND', active: true, display_order: 5 },
  { id: 'new-development', label: 'New Development', query_param: 'propertyType=new-dev', active: true, display_order: 6 },
  { id: 'furnished', label: 'Furnished', query_param: 'furnished=true', active: true, display_order: 7 },
  { id: 'verified', label: 'Verified', query_param: 'verified=true', active: true, display_order: 8 },
];

const FALLBACK_NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/', icon: 'Home', roles: ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN'], active: true, display_order: 1 },
  { id: 'properties', label: 'Properties', path: '/properties', icon: 'Building2', roles: ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN'], active: true, display_order: 2 },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard/agent', icon: 'LayoutDashboard', roles: ['AGENT', 'DEVELOPER', 'ADMIN'], active: true, display_order: 3 },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: 'ArrowLeftRight', roles: ['AGENT', 'BUYER', 'ADMIN'], active: true, display_order: 4 },
  { id: 'messages', label: 'Messages', path: '/messages', icon: 'MessageCircle', roles: ['AGENT', 'BUYER', 'ADMIN'], active: true, display_order: 5 },
  { id: 'admin', label: 'Admin', path: '/admin', icon: 'Shield', roles: ['ADMIN', 'SUPER_ADMIN'], active: true, display_order: 6 },
];

const FALLBACK_PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: 'Building', active: true, display_order: 1 },
  { id: 'house', label: 'House', icon: 'Home', active: true, display_order: 2 },
  { id: 'duplex', label: 'Duplex', icon: 'Building2', active: true, display_order: 3 },
  { id: 'terrace', label: 'Terrace', icon: 'Rows', active: true, display_order: 4 },
  { id: 'bungalow', label: 'Bungalow', icon: 'Home', active: true, display_order: 5 },
  { id: 'penthouse', label: 'Penthouse', icon: 'Building', active: true, display_order: 6 },
  { id: 'studio', label: 'Studio', icon: 'Door', active: true, display_order: 7 },
  { id: 'warehouse', label: 'Warehouse', icon: 'Warehouse', active: true, display_order: 8 },
  { id: 'commercial', label: 'Commercial', icon: 'Store', active: true, display_order: 9 },
];

const FALLBACK_FEATURE_FLAGS = [
  { id: 'map_view', enabled: true, rollout_percentage: 100, roles: ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN'] },
  { id: 'ai_chatbot', enabled: false, rollout_percentage: 0, roles: ['AGENT', 'ADMIN'] },
  { id: 'e_signature', enabled: false, rollout_percentage: 0, roles: ['AGENT', 'BUYER', 'ADMIN'] },
  { id: 'whatsapp_integration', enabled: true, rollout_percentage: 100, roles: ['AGENT', 'BUYER'] },
  { id: 'referral_system', enabled: true, rollout_percentage: 100, roles: ['AGENT', 'DEVELOPER'] },
];

async function seedConfig() {
  const seeds: { key: string; value: unknown }[] = [
    { key: 'amenities', value: FALLBACK_AMENITIES },
    { key: 'filter_pills', value: FALLBACK_FILTER_PILLS },
    { key: 'nav_items', value: FALLBACK_NAV_ITEMS },
    { key: 'property_types', value: FALLBACK_PROPERTY_TYPES },
    { key: 'feature_flags', value: FALLBACK_FEATURE_FLAGS },
    { key: 'hero_content', value: { headline: 'Discover Your Next Home in Africa', subheadline: 'Verified properties, trusted agents, and seamless transactions across the continent.', backgroundImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2560&q=80' } },
    { key: 'stats', value: [{ value: '12,000+', label: 'Listings' }, { value: '1,500+', label: 'Agents' }, { value: '₦85B+', label: 'Deals Closed' }] },
    { key: 'referral_commission_rate', value: 0.05 },
    { key: 'featured_listing_price_daily', value: 5000 },
  ];
  for (const seed of seeds) {
    await db.insert(schema.platformConfig).values({ key: seed.key, value: seed.value, updatedById: ADMIN_ID }).onConflictDoUpdate({ target: schema.platformConfig.key, set: { value: seed.value, updatedById: ADMIN_ID } });
  }
  console.log('PlatformConfig seeded successfully.');
}

const FALLBACK_SUBSCRIPTION_PLANS = [
  { name: 'Free', slug: 'free', description: 'For homeowners exploring the market', price: 0, currency: 'NGN', interval: 'monthly', features: ['basic_listing', 'messaging'], limits: { listings: 1 } },
  { name: 'Starter', slug: 'starter', description: 'For new agents listing up to 10 properties', price: 10000, currency: 'NGN', interval: 'monthly', features: ['basic_listing', 'messaging', 'crm', 'analytics_basic'], limits: { listings: 10 } },
  { name: 'Professional', slug: 'professional', description: 'For growing agencies with full CRM and analytics', price: 30000, currency: 'NGN', interval: 'monthly', features: ['basic_listing', 'featured_listing', 'messaging', 'crm', 'analytics', 'e_signature'], limits: { listings: 50 } },
  { name: 'Enterprise', slug: 'enterprise', description: 'For large portfolios with priority support', price: 100000, currency: 'NGN', interval: 'monthly', features: ['*'], limits: { listings: -1 } },
];

async function seedSubscriptionPlans() {
  for (const plan of FALLBACK_SUBSCRIPTION_PLANS) {
    await db.insert(schema.subscriptionPlans).values(plan as never).onConflictDoUpdate({ target: schema.subscriptionPlans.slug, set: plan as never });
  }
  console.log('SubscriptionPlans seeded successfully.');
}

async function seedUsers() {
  for (const u of SEED_USERS) {
    await db.insert(schema.users).values(u as never).onConflictDoUpdate({ target: schema.users.id, set: u as never });
  }
  console.log(`Users seeded (${SEED_USERS.length})`);
}

async function seedActivityRules() {
  for (const r of SEED_ACTIVITY_RULES) {
    await db.insert(schema.activityRules).values(r as never).onConflictDoUpdate({ target: schema.activityRules.key, set: { label: r.label, points: r.points, category: r.category, cooldownMs: (r as unknown as { cooldownMs?: number }).cooldownMs ?? null } as never });
  }
  console.log(`ActivityRules seeded (${SEED_ACTIVITY_RULES.length})`);
}

async function seedEmailTemplates() {
  for (const t of DEFAULT_EMAIL_TEMPLATES) {
    await db.insert(schema.emailTemplates).values({ key: t.key, name: t.name, subject: t.subject, htmlBody: t.htmlBody, textBody: t.textBody ?? null, active: t.active }).onConflictDoUpdate({ target: schema.emailTemplates.key, set: { name: t.name, subject: t.subject, htmlBody: t.htmlBody, textBody: t.textBody ?? null, active: t.active } });
  }
  console.log(`EmailTemplates seeded (${DEFAULT_EMAIL_TEMPLATES.length})`);
}

async function seedListingsAndMedia() {
  for (const l of SEED_LISTINGS) {
    await db.insert(schema.listings).values(l as never).onConflictDoUpdate({ target: schema.listings.id, set: l as never });
  }
  console.log(`Listings seeded (${SEED_LISTINGS.length})`);
  for (const m of SEED_MEDIA) {
    await db.insert(schema.media).values(m as never).onConflictDoUpdate({ target: schema.media.id, set: m as never });
  }
  console.log(`Media seeded (${SEED_MEDIA.length})`);
}

async function seedBlogPosts() {
  for (const p of SEED_BLOG_POSTS) {
    await db.insert(schema.blogPosts).values(p as never).onConflictDoUpdate({ target: schema.blogPosts.slug, set: p as never });
  }
  console.log(`BlogPosts seeded (${SEED_BLOG_POSTS.length})`);
}

async function main() {
  const args = process.argv.slice(2);
  const isRevert = args.includes('--revert') || args.includes('--rollback');
  const includeConfig = args.includes('--with-config');

  if (isRevert) {
    console.log('Reverting seeded data (only seed- prefixed rows / manifest keys)...');
    await revertSeed(db as unknown as never);
    if (includeConfig) {
      await revertPlatformConfigAndPlans(db as unknown as never);
    } else {
      console.log('Skipping platformConfig/subscriptionPlans revert (use --with-config to remove them). Post-seed config is preserved.');
    }
    if (args.includes('--with-users')) {
      await revertSeedUsers(db as unknown as never);
    } else {
      console.log('Skipping seed users revert (use --with-users to remove seed users). Add it after dependent data is cleared.');
      // Still revert users if no FK blockers — try lightweight
      try { await revertSeedUsers(db as unknown as never); } catch (e) { console.warn(`Seed users revert deferred: ${(e as Error).message.slice(0,120)}`); }
    }
    console.log('Revert complete. Post-seed data untouched (only seed- rows removed).');
    return;
  }

  await seedConfig();
  await seedSubscriptionPlans();
  await seedUsers();
  await seedActivityRules();
  await seedEmailTemplates();
  await seedListingsAndMedia();
  await seedBlogPosts();
  console.log('Seed complete. Revert with: npm run db:seed -- --revert [--with-config] [--with-users]  or  npm run db:seed:revert');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await client.end(); });
