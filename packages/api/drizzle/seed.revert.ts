import { inArray, like, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../src/drizzle/schema';
import { SEED_MANIFEST } from './seed.data';

type DbType = PostgresJsDatabase<typeof schema>;

/**
 * Revert only seeded data — deletes rows whose IDs start with `seed-` or whose
 * keys/slugs are in the seed manifest. Post-seed user data is never touched.
 * FK-safe order: children first, parents last.
 */
export async function revertSeed(db: DbType): Promise<void> {
  const seedIdPattern = 'seed-%';

  const tryDelete = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      console.log(`Reverted ${label}`);
    } catch (err) {
      console.warn(`Revert ${label} skipped (FK or missing): ${(err as Error).message.slice(0, 200)}`);
    }
  };

  await tryDelete('media (seed)', () => db.delete(schema.media).where(like(schema.media.id, seedIdPattern)));
  await tryDelete('blogPosts (seed)', () => db.delete(schema.blogPosts).where(like(schema.blogPosts.id, seedIdPattern)));
  await tryDelete('media (recheck) + listings (seed)', async () => {
    // media already cleared; now listings
    await db.delete(schema.listings).where(like(schema.listings.id, seedIdPattern));
  });
  await tryDelete('emailTemplates (seed)', () =>
    db.delete(schema.emailTemplates).where(inArray(schema.emailTemplates.key, [...SEED_MANIFEST.emailTemplateKeys] as string[])),
  );
  // activityRules may be referenced by agentActivities; clear activities for seed users first
  await tryDelete('agentActivities (seed users)', async () => {
    const seedUserIds = Object.values(SEED_MANIFEST.ids.users) as string[];
    // safe: delete activities for seed agents only
    await db.delete(schema.agentActivities).where(inArray(schema.agentActivities.agentId, seedUserIds));
  });
  await tryDelete('agentPoints (seed users)', async () => {
    const seedUserIds = Object.values(SEED_MANIFEST.ids.users) as string[];
    await db.delete(schema.agentPoints).where(inArray(schema.agentPoints.agentId, seedUserIds));
  });
  // referrals pointing to seed users
  await tryDelete('commissions (seed)', async () => {
    const seedUserIds = Object.values(SEED_MANIFEST.ids.users) as string[];
    await db.delete(schema.commissions).where(inArray(schema.commissions.referrerId, seedUserIds));
  });
  await tryDelete('referrals (seed)', async () => {
    const seedUserIds = Object.values(SEED_MANIFEST.ids.users) as string[];
    // referrals has both referrerId and referredId; delete either side seed-related
    await db.execute(sql`DELETE FROM "Referral" WHERE "referrerId" LIKE 'seed-%' OR "referredId" LIKE 'seed-%'`);
    // fallback if above fails, try inArray on referrer
    void seedUserIds;
  });
  await tryDelete('activityRules (seed keys)', () =>
    db.delete(schema.activityRules).where(inArray(schema.activityRules.key, ['listing_created','listing_approved','listing_sold','client_added','inspection_scheduled','message_sent','transaction_created','transaction_completed','review_received','daily_login'])),
  );
  // Do NOT delete platformConfig keys if they may have been customized post-seed — only delete seed keys where value is still seed-default?
  // Per requirement we revert seeded data; safest is to delete keys that exactly match seed manifest — post-seed custom keys are untouched.
  // We keep platformConfig & subscriptionPlans by default unless --force is passed — see seed.ts revert flag handling.
  await tryDelete('analyticsEvents (seed)', () => db.delete(schema.analyticsEvents).where(like(schema.analyticsEvents.id, seedIdPattern)));
  await tryDelete('featuredPlacements (seed)', () => db.delete(schema.featuredPlacements).where(like(schema.featuredPlacements.id, seedIdPattern)));
  // Subscriptions referencing seeded plans — delete subs for seed users
  await tryDelete('subscriptions (seed users)', async () => {
    const seedUserIds = Object.values(SEED_MANIFEST.ids.users) as string[];
    // subscriptions.userId may be seed user
    await db.execute(sql`DELETE FROM "Subscription" WHERE "userId" LIKE 'seed-%'`);
    void seedUserIds;
  });
  // Platform config revert is opt-in (delete only seed keys) — caller in seed.ts decides
}

export async function revertPlatformConfigAndPlans(db: DbType): Promise<void> {
  await db.delete(schema.platformConfig).where(inArray(schema.platformConfig.key, [...SEED_MANIFEST.platformConfigKeys] as string[]));
  console.log('Reverted platformConfig seed keys');
  await db.delete(schema.subscriptionPlans).where(inArray(schema.subscriptionPlans.slug, [...SEED_MANIFEST.subscriptionPlanSlugs] as string[]));
  console.log('Reverted subscriptionPlans seed slugs');
  // email templates already handled in revertSeed
}

export async function revertSeedUsers(db: DbType): Promise<void> {
  const seedUserIds = Object.values(SEED_MANIFEST.ids.users) as string[];
  // Delete dependents that reference seed users still remaining
  try {
    await db.execute(sql`DELETE FROM "Client" WHERE "agentId" LIKE 'seed-%' OR "buyerId" LIKE 'seed-%'`);
  } catch {}
  try {
    await db.execute(sql`DELETE FROM "Transaction" WHERE "buyerId" LIKE 'seed-%' OR "agentId" LIKE 'seed-%'`);
  } catch {}
  await db.delete(schema.users).where(inArray(schema.users.id, seedUserIds));
  console.log('Reverted seed users');
}
