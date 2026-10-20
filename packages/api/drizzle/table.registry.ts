import { inArray, like, sql, type SQL } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import * as schema from '../src/drizzle/schema';
import { SEED_MANIFEST } from './seed.data';

export type Row = Record<string, unknown>;

export interface TableRef {
  /** Schema export name — also the key used in backup JSON files. */
  key: string;
  table: AnyPgTable;
  /**
   * Predicate limiting a seed-scope backup to exactly the rows a seed revert
   * would delete. `undefined` = the table has no seed-scoped rows (skipped in
   * seed backups; fully included in full backups). Targeting is deliberately
   * strict: `seed-` ID prefixes and seed-manifest keys only — never shared
   * business keys that post-seed data may also use.
   */
  seedWhere?: SQL;
}

const SEED_USER_IDS = [...Object.values(SEED_MANIFEST.ids.users)] as string[];

/**
 * All 31 schema tables in parents-first order (every table appears after every
 * table it can reference). Restore inserts in this order; purge deletes in the
 * exact reverse (children first) so FK constraints never block.
 */
export const TABLE_REGISTRY: TableRef[] = [
  // ── Parents ────────────────────────────────────────────────────────────
  { key: 'users', table: schema.users, seedWhere: inArray(schema.users.id, SEED_USER_IDS) },
  { key: 'listings', table: schema.listings, seedWhere: like(schema.listings.id, 'seed-%') },
  { key: 'subscriptionPlans', table: schema.subscriptionPlans, seedWhere: inArray(schema.subscriptionPlans.slug, [...SEED_MANIFEST.subscriptionPlanSlugs]) },
  // activityRules seed rows carry `seed-` IDs (SEED_IDS.activityRules) — revert
  // must target those, NOT the shared business keys (a post-seed customized
  // rule with the same key must survive a seed revert).
  { key: 'activityRules', table: schema.activityRules, seedWhere: like(schema.activityRules.id, 'seed-%') },
  { key: 'platformConfig', table: schema.platformConfig, seedWhere: inArray(schema.platformConfig.key, [...SEED_MANIFEST.platformConfigKeys]) },
  { key: 'emailTemplates', table: schema.emailTemplates, seedWhere: inArray(schema.emailTemplates.key, [...SEED_MANIFEST.emailTemplateKeys]) },
  { key: 'conversations', table: schema.conversations, seedWhere: like(schema.conversations.propertyId, 'seed-%') },
  { key: 'clients', table: schema.clients, seedWhere: sql`${schema.clients.agentId} LIKE ${'seed-%'} OR ${schema.clients.buyerId} LIKE ${'seed-%'}` },
  { key: 'referrals', table: schema.referrals, seedWhere: sql`${schema.referrals.referrerId} LIKE ${'seed-%'} OR ${schema.referrals.referredId} LIKE ${'seed-%'}` },

  // ── Children (safe to insert after their parents above) ────────────────
  { key: 'media', table: schema.media, seedWhere: like(schema.media.id, 'seed-%') },
  { key: 'transactions', table: schema.transactions, seedWhere: sql`${schema.transactions.buyerId} LIKE ${'seed-%'} OR ${schema.transactions.agentId} LIKE ${'seed-%'} OR ${schema.transactions.listingId} LIKE ${'seed-%'}` },
  { key: 'transactionDocuments', table: schema.transactionDocuments, seedWhere: like(schema.transactionDocuments.transactionId, 'seed-%') },
  { key: 'signatureRequests', table: schema.signatureRequests, seedWhere: like(schema.signatureRequests.transactionId, 'seed-%') },
  { key: 'subscriptions', table: schema.subscriptions, seedWhere: like(schema.subscriptions.userId, 'seed-%') },
  { key: 'paymentRecords', table: schema.paymentRecords, seedWhere: like(schema.paymentRecords.transactionId, 'seed-%') },
  { key: 'auditEvents', table: schema.auditEvents, seedWhere: like(schema.auditEvents.actorId, 'seed-%') },
  { key: 'recentlyViewed', table: schema.recentlyViewed, seedWhere: like(schema.recentlyViewed.userId, 'seed-%') },
  { key: 'savedCollections', table: schema.savedCollections, seedWhere: like(schema.savedCollections.userId, 'seed-%') },
  { key: 'notifications', table: schema.notifications, seedWhere: like(schema.notifications.userId, 'seed-%') },
  { key: 'emailLogs', table: schema.emailLogs, seedWhere: like(schema.emailLogs.id, 'seed-%') },
  { key: 'messages', table: schema.messages, seedWhere: like(schema.messages.senderId, 'seed-%') },
  { key: 'notes', table: schema.notes, seedWhere: like(schema.notes.authorId, 'seed-%') },
  { key: 'ratings', table: schema.ratings, seedWhere: like(schema.ratings.authorId, 'seed-%') },
  { key: 'inspections', table: schema.inspections, seedWhere: sql`${schema.inspections.authorId} LIKE ${'seed-%'} OR ${schema.inspections.listingId} LIKE ${'seed-%'}` },
  { key: 'agentActivities', table: schema.agentActivities, seedWhere: inArray(schema.agentActivities.agentId, SEED_USER_IDS) },
  { key: 'agentPoints', table: schema.agentPoints, seedWhere: inArray(schema.agentPoints.agentId, SEED_USER_IDS) },
  { key: 'blogPosts', table: schema.blogPosts, seedWhere: like(schema.blogPosts.id, 'seed-%') },
  { key: 'commissions', table: schema.commissions, seedWhere: inArray(schema.commissions.referrerId, SEED_USER_IDS) },
  { key: 'featuredPlacements', table: schema.featuredPlacements, seedWhere: like(schema.featuredPlacements.id, 'seed-%') },
  { key: 'analyticsEvents', table: schema.analyticsEvents, seedWhere: like(schema.analyticsEvents.id, 'seed-%') },
  { key: 'bugReports', table: schema.bugReports, seedWhere: like(schema.bugReports.userId, 'seed-%') },
];

/** Parents-first order — safe for INSERT/restore. */
export const TABLES_PARENTS_FIRST: TableRef[] = TABLE_REGISTRY;

/** Children-first order — safe for DELETE/purge (FK constraints). */
export const TABLES_CHILDREN_FIRST: TableRef[] = [...TABLE_REGISTRY].reverse();
