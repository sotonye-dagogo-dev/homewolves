import { relations, sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  index,
} from 'drizzle-orm/pg-core';

// ─── ENUMS ─────────────────────────────────────────────────

export const userRoleEnum = pgEnum('UserRole', [
  'GUEST',
  'BUYER',
  'AGENT',
  'DEVELOPER',
  'HOMEOWNER',
  'ADMIN',
  'SUPER_ADMIN',
]);

export const listingCategoryEnum = pgEnum('ListingCategory', [
  'SALE',
  'RENT',
  'SHORTLET',
  'LAND',
]);

export const listingStatusEnum = pgEnum('ListingStatus', [
  'DRAFT',
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'SOLD',
  'RENTED',
]);

export const transactionTypeEnum = pgEnum('TransactionType', [
  'PURCHASE',
  'RENTAL',
  'SHORTLET',
]);

export const transactionStatusEnum = pgEnum('TransactionStatus', [
  'INITIATED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]);

export const bugReportStatusEnum = pgEnum('BugReportStatus', [
  'OPEN',
  'UNDER_REVIEW',
  'CLOSED',
]);

export const bugReportTypeEnum = pgEnum('BugReportType', [
  'BUG',
  'FEATURE_REQUEST',
  'UI_ISSUE',
  'PERFORMANCE',
  'OTHER',
]);

// Zod-friendly string enum constants (replaces `@prisma/client` enum imports).
export const UserRole = {
  GUEST: 'GUEST',
  BUYER: 'BUYER',
  AGENT: 'AGENT',
  DEVELOPER: 'DEVELOPER',
  HOMEOWNER: 'HOMEOWNER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const ListingCategory = {
  SALE: 'SALE',
  RENT: 'RENT',
  SHORTLET: 'SHORTLET',
  LAND: 'LAND',
} as const;

export const ListingStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  SOLD: 'SOLD',
  RENTED: 'RENTED',
} as const;

export const TransactionType = {
  PURCHASE: 'PURCHASE',
  RENTAL: 'RENTAL',
  SHORTLET: 'SHORTLET',
} as const;

export const TransactionStatus = {
  INITIATED: 'INITIATED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const BugReportStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLOSED: 'CLOSED',
} as const;

export const BugReportType = {
  BUG: 'BUG',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  UI_ISSUE: 'UI_ISSUE',
  PERFORMANCE: 'PERFORMANCE',
  OTHER: 'OTHER',
} as const;

const cuid = (column: string) =>
  text(column).primaryKey().$defaultFn(() => crypto.randomUUID());

const updatedAt = (column: string) =>
  timestamp(column, { withTimezone: true, mode: 'date' })
    .notNull()
    .$onUpdateFn(() => new Date());

const createdAt = (column: string) =>
  timestamp(column, { withTimezone: true, mode: 'date' }).notNull().$defaultFn(() => new Date());

// ─── MODELS ────────────────────────────────────────────────

export const users = pgTable('User', {
  id: cuid('id'),
  email: text('email').notNull().unique(),
  phone: text('phone').unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  avatar: text('avatar'),
  role: userRoleEnum('role').notNull(),
  verified: boolean('verified').notNull().default(false),
  preferences: jsonb('preferences').notNull().default(sql`'{}'::jsonb`),
  referralCode: text('referralCode').unique(),
  referredById: text('referredById'),
  provider: text('provider'),
  providerId: text('providerId'),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('User_role_idx').on(t.role),
  index('User_providerId_idx').on(t.providerId),
]);

export const listings = pgTable('Listing', {
  id: cuid('id'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  category: listingCategoryEnum('category').notNull(),
  propertyType: text('propertyType').notNull(),
  status: listingStatusEnum('status').notNull().default('DRAFT'),
  verified: boolean('verified').notNull().default(false),
  featured: boolean('featured').notNull().default(false),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  locationJson: jsonb('locationJson').notNull(),
  amenityIds: text('amenityIds').array().notNull(),
  ownerId: text('ownerId').notNull().references(() => users.id),
  agentId: text('agentId').references(() => users.id),
  viewCount: integer('viewCount').notNull().default(0),
  enquiryCount: integer('enquiryCount').notNull().default(0),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('Listing_status_idx').on(t.status),
  index('Listing_category_idx').on(t.category),
  index('Listing_ownerId_idx').on(t.ownerId),
  index('Listing_agentId_idx').on(t.agentId),
  index('Listing_createdAt_idx').on(t.createdAt),
]);

export const media = pgTable('Media', {
  id: cuid('id'),
  listingId: text('listingId').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  type: text('type').notNull().default('image'),
  altText: text('altText'),
  dominantColor: text('dominantColor'),
  width: integer('width'),
  height: integer('height'),
  isPrimary: boolean('isPrimary').notNull().default(false),
  displayOrder: integer('displayOrder').notNull().default(0),
}, (t) => [
  index('Media_listingId_idx').on(t.listingId),
]);

export const transactions = pgTable('Transaction', {
  id: cuid('id'),
  listingId: text('listingId').notNull().references(() => listings.id),
  buyerId: text('buyerId').notNull().references(() => users.id),
  agentId: text('agentId').notNull().references(() => users.id),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull().default('INITIATED'),
  currentStep: integer('currentStep').notNull().default(0),
  stepsJson: jsonb('stepsJson').notNull(),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('Transaction_listingId_idx').on(t.listingId),
  index('Transaction_buyerId_idx').on(t.buyerId),
  index('Transaction_agentId_idx').on(t.agentId),
  index('Transaction_status_idx').on(t.status),
]);

export const transactionDocuments = pgTable('TransactionDocument', {
  id: cuid('id'),
  transactionId: text('transactionId').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  url: text('url').notNull(),
  size: integer('size').notNull().default(0),
  uploadedBy: text('uploadedBy').notNull(),
  uploadedById: text('uploadedById').notNull(),
  visibility: text('visibility').notNull().default('shared'),
  virusScanStatus: text('virusScanStatus').notNull().default('pending'),
  signedUrl: text('signedUrl'),
  signedAt: timestamp('signedAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('TransactionDocument_transactionId_idx').on(t.transactionId),
  index('TransactionDocument_uploadedById_idx').on(t.uploadedById),
]);

export const signatureRequests = pgTable('SignatureRequest', {
  id: cuid('id'),
  transactionId: text('transactionId').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  documentId: text('documentId').references(() => transactionDocuments.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('pending'),
  signerId: text('signerId').notNull(),
  signerEmail: text('signerEmail').notNull(),
  signerName: text('signerName').notNull(),
  embedUrl: text('embedUrl'),
  externalId: text('externalId'),
  completedAt: timestamp('completedAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('SignatureRequest_transactionId_idx').on(t.transactionId),
  index('SignatureRequest_status_idx').on(t.status),
]);

export const subscriptionPlans = pgTable('SubscriptionPlan', {
  id: cuid('id'),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  interval: text('interval').notNull().default('monthly'),
  features: jsonb('features').notNull(),
  limits: jsonb('limits').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('SubscriptionPlan_slug_idx').on(t.slug),
  index('SubscriptionPlan_active_idx').on(t.active),
]);

export const subscriptions = pgTable('Subscription', {
  id: cuid('id'),
  userId: text('userId').notNull(),
  planId: text('planId').notNull().references(() => subscriptionPlans.id),
  status: text('status').notNull().default('active'),
  paystackRef: text('paystackRef'),
  currentPeriodStart: timestamp('currentPeriodStart', { withTimezone: true, mode: 'date' }),
  currentPeriodEnd: timestamp('currentPeriodEnd', { withTimezone: true, mode: 'date' }),
  cancelledAt: timestamp('cancelledAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('Subscription_userId_idx').on(t.userId),
  index('Subscription_status_idx').on(t.status),
]);

export const paymentRecords = pgTable('PaymentRecord', {
  id: cuid('id'),
  transactionId: text('transactionId').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'),
  evidenceUrl: text('evidenceUrl'),
  confirmedBy: text('confirmedBy'),
  confirmedAt: timestamp('confirmedAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('PaymentRecord_transactionId_idx').on(t.transactionId),
]);

export const auditEvents = pgTable('AuditEvent', {
  id: cuid('id'),
  entityType: text('entityType').notNull(),
  entityId: text('entityId').notNull(),
  action: text('action').notNull(),
  actorId: text('actorId').notNull().references(() => users.id),
  actorRole: text('actorRole').notNull(),
  actorName: text('actorName').notNull(),
  ipAddress: text('ipAddress'),
  deviceInfo: jsonb('deviceInfo'),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (t) => [
  index('AuditEvent_entity_idx').on(t.entityType, t.entityId),
  index('AuditEvent_actorId_idx').on(t.actorId),
  index('AuditEvent_timestamp_idx').on(t.timestamp),
]);

export const platformConfig = pgTable('PlatformConfig', {
  id: cuid('id'),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  updatedById: text('updatedById').notNull(),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('PlatformConfig_key_idx').on(t.key),
]);

export const recentlyViewed = pgTable('RecentlyViewed', {
  id: cuid('id'),
  userId: text('userId'),
  sessionId: text('sessionId'),
  listingId: text('listingId').notNull(),
  viewedAt: timestamp('viewedAt', { withTimezone: true, mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (t) => [
  index('RecentlyViewed_userId_idx').on(t.userId),
  index('RecentlyViewed_sessionId_idx').on(t.sessionId),
  index('RecentlyViewed_listingId_idx').on(t.listingId),
]);

export const savedCollections = pgTable('SavedCollection', {
  id: cuid('id'),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  listingIds: text('listingIds').array().notNull(),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('SavedCollection_userId_idx').on(t.userId),
]);

export const notifications = pgTable('Notification', {
  id: cuid('id'),
  userId: text('userId').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  data: jsonb('data'),
  read: boolean('read').notNull().default(false),
  channel: text('channel').notNull().default('in_app'),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('Notification_userId_read_idx').on(t.userId, t.read),
  index('Notification_createdAt_idx').on(t.createdAt),
]);

export const emailTemplates = pgTable('EmailTemplate', {
  id: cuid('id'),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  htmlBody: text('htmlBody').notNull(),
  textBody: text('textBody'),
  fromEmail: text('fromEmail'),
  active: boolean('active').notNull().default(true),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('EmailTemplate_key_idx').on(t.key),
]);

export const emailLogs = pgTable('EmailLog', {
  id: cuid('id'),
  toEmail: text('toEmail').notNull(),
  templateKey: text('templateKey').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull().default('sent'),
  providerMessageId: text('providerMessageId'),
  error: text('error'),
  metadata: jsonb('metadata'),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('EmailLog_toEmail_idx').on(t.toEmail),
  index('EmailLog_createdAt_idx').on(t.createdAt),
]);

export const messages = pgTable('Message', {
  id: cuid('id'),
  conversationId: text('conversationId').notNull().references(() => conversations.id),
  senderId: text('senderId').notNull().references(() => users.id),
  content: text('content').notNull(),
  type: text('type').notNull().default('text'),
  mediaUrl: text('mediaUrl'),
  readAt: timestamp('readAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('Message_conversationId_idx').on(t.conversationId),
  index('Message_createdAt_idx').on(t.createdAt),
]);

export const conversations = pgTable('Conversation', {
  id: cuid('id'),
  propertyId: text('propertyId'),
  participantIds: text('participantIds').array().notNull(),
  lastMessageAt: timestamp('lastMessageAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('Conversation_participantIds_idx').on(t.participantIds),
]);

export const clients = pgTable('Client', {
  id: cuid('id'),
  agentId: text('agentId').notNull().references(() => users.id),
  buyerId: text('buyerId').notNull().references(() => users.id),
  status: text('status').notNull().default('active'),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('Client_agentId_idx').on(t.agentId),
  index('Client_buyerId_idx').on(t.buyerId),
  index('Client_status_idx').on(t.status),
]);

export const notes = pgTable('Note', {
  id: cuid('id'),
  clientId: text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  authorId: text('authorId').notNull().references(() => users.id),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('Note_clientId_idx').on(t.clientId),
]);

export const ratings = pgTable('Rating', {
  id: cuid('id'),
  clientId: text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  review: text('review'),
  authorId: text('authorId').notNull().references(() => users.id),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('Rating_clientId_idx').on(t.clientId),
]);

export const inspections = pgTable('Inspection', {
  id: cuid('id'),
  clientId: text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  listingId: text('listingId').notNull().references(() => listings.id),
  scheduledAt: timestamp('scheduledAt', { withTimezone: true, mode: 'date' }).notNull(),
  status: text('status').notNull().default('scheduled'),
  notes: text('notes'),
  authorId: text('authorId').notNull().references(() => users.id),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('Inspection_clientId_idx').on(t.clientId),
  index('Inspection_listingId_idx').on(t.listingId),
  index('Inspection_scheduledAt_idx').on(t.scheduledAt),
  index('Inspection_status_idx').on(t.status),
]);

export const activityRules = pgTable('ActivityRule', {
  id: cuid('id'),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  points: integer('points').notNull(),
  category: text('category').notNull().default('general'),
  cooldownMs: integer('cooldownMs'),
  active: boolean('active').notNull().default(true),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('ActivityRule_key_idx').on(t.key),
]);

export const agentActivities = pgTable('AgentActivity', {
  id: cuid('id'),
  agentId: text('agentId').notNull().references(() => users.id),
  ruleId: text('ruleId').notNull().references(() => activityRules.id),
  points: integer('points').notNull(),
  metadata: jsonb('metadata'),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('AgentActivity_agentId_idx').on(t.agentId),
  index('AgentActivity_createdAt_idx').on(t.createdAt),
]);

export const agentPoints = pgTable('AgentPoints', {
  id: cuid('id'),
  agentId: text('agentId').notNull().unique().references(() => users.id),
  totalPoints: integer('totalPoints').notNull().default(0),
  tier: text('tier').notNull().default('bronze'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('AgentPoints_totalPoints_idx').on(t.totalPoints),
]);

export const blogPosts = pgTable('BlogPost', {
  id: cuid('id'),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  coverImage: text('coverImage'),
  authorId: text('authorId').notNull().references(() => users.id),
  categories: text('categories').array().notNull(),
  tags: text('tags').array().notNull(),
  published: boolean('published').notNull().default(false),
  featured: boolean('featured').notNull().default(false),
  publishedAt: timestamp('publishedAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('BlogPost_slug_idx').on(t.slug),
  index('BlogPost_published_idx').on(t.published),
  index('BlogPost_featured_idx').on(t.featured),
  index('BlogPost_publishedAt_idx').on(t.publishedAt),
  index('BlogPost_categories_idx').on(t.categories),
]);

export const referrals = pgTable('Referral', {
  id: cuid('id'),
  code: text('code').notNull(),
  referrerId: text('referrerId').notNull().references(() => users.id),
  referredId: text('referredId').notNull().unique().references(() => users.id),
  status: text('status').notNull().default('pending'),
  convertedAt: timestamp('convertedAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('Referral_referrerId_idx').on(t.referrerId),
  index('Referral_status_idx').on(t.status),
  index('Referral_code_idx').on(t.code),
]);

export const commissions = pgTable('Commission', {
  id: cuid('id'),
  referralId: text('referralId').notNull().references(() => referrals.id, { onDelete: 'cascade' }),
  referrerId: text('referrerId').notNull().references(() => users.id),
  referredId: text('referredId').notNull(),
  transactionId: text('transactionId').notNull(),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  rate: numeric('rate', { precision: 5, scale: 4 }).notNull(),
  status: text('status').notNull().default('pending'),
  paidAt: timestamp('paidAt', { withTimezone: true, mode: 'date' }),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('Commission_referrerId_idx').on(t.referrerId),
  index('Commission_transactionId_idx').on(t.transactionId),
  index('Commission_status_idx').on(t.status),
]);

export const featuredPlacements = pgTable('FeaturedPlacement', {
  id: cuid('id'),
  listingId: text('listingId').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  startDate: timestamp('startDate', { withTimezone: true, mode: 'date' }).notNull().$defaultFn(() => new Date()),
  endDate: timestamp('endDate', { withTimezone: true, mode: 'date' }).notNull(),
  amountPaid: numeric('amountPaid', { precision: 18, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull().default('pending_payment'),
  paystackRef: text('paystackRef'),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('FeaturedPlacement_listingId_idx').on(t.listingId),
  index('FeaturedPlacement_status_idx').on(t.status),
  index('FeaturedPlacement_endDate_idx').on(t.endDate),
]);

export const analyticsEvents = pgTable('AnalyticsEvent', {
  id: cuid('id'),
  event: text('event').notNull(),
  userId: text('userId'),
  sessionId: text('sessionId'),
  listingId: text('listingId'),
  agentId: text('agentId'),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  createdAt: createdAt('createdAt'),
}, (t) => [
  index('AnalyticsEvent_event_idx').on(t.event),
  index('AnalyticsEvent_userId_idx').on(t.userId),
  index('AnalyticsEvent_listingId_idx').on(t.listingId),
  index('AnalyticsEvent_agentId_idx').on(t.agentId),
  index('AnalyticsEvent_createdAt_idx').on(t.createdAt),
]);

export const bugReports = pgTable('BugReport', {
  id: cuid('id'),
  userId: text('userId').notNull().references(() => users.id),
  type: bugReportTypeEnum('type').notNull(),
  description: text('description').notNull(),
  screenshots: jsonb('screenshots').notNull().default(sql`'[]'::jsonb`),
  status: bugReportStatusEnum('status').notNull().default('OPEN'),
  adminNote: text('adminNote'),
  errorMessage: text('errorMessage'),
  stackTrace: text('stackTrace'),
  componentName: text('componentName'),
  url: text('url'),
  createdAt: createdAt('createdAt'),
  updatedAt: updatedAt('updatedAt'),
}, (t) => [
  index('BugReport_userId_idx').on(t.userId),
  index('BugReport_status_idx').on(t.status),
  index('BugReport_type_idx').on(t.type),
  index('BugReport_createdAt_idx').on(t.createdAt),
]);

// ─── RELATIONS ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  ownedListings: many(listings, { relationName: 'listingOwner' }),
  agentListings: many(listings, { relationName: 'listingAgent' }),
  buyerTransactions: many(transactions, { relationName: 'transactionBuyer' }),
  agentTransactions: many(transactions, { relationName: 'transactionAgent' }),
  auditEvents: many(auditEvents, { relationName: 'actor' }),
  notifications: many(notifications),
  sentMessages: many(messages),
  agentClients: many(clients, { relationName: 'agentClients' }),
  buyerClients: many(clients, { relationName: 'buyerClients' }),
  createdNotes: many(notes, { relationName: 'noteAuthor' }),
  createdRatings: many(ratings, { relationName: 'ratingAuthor' }),
  createdInspections: many(inspections, { relationName: 'inspectionAuthor' }),
  agentActivities: many(agentActivities, { relationName: 'agentActivities' }),
  agentPoints: many(agentPoints, { relationName: 'agentPoints' }),
  blogPosts: many(blogPosts, { relationName: 'blogAuthor' }),
  referralsMade: many(referrals, { relationName: 'referralsMade' }),
  referredVia: one(referrals, { relationName: 'referredVia', fields: [users.referredById], references: [referrals.referredId] }),
  commissions: many(commissions, { relationName: 'commissionEarners' }),
  bugReports: many(bugReports),
}));

export const listingsRelations = relations(listings, ({ many, one }) => ({
  owner: one(users, { relationName: 'listingOwner', fields: [listings.ownerId], references: [users.id] }),
  agent: one(users, { relationName: 'listingAgent', fields: [listings.agentId], references: [users.id] }),
  media: many(media),
  transactions: many(transactions),
  inspections: many(inspections),
  featuredPlacements: many(featuredPlacements),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  listing: one(listings, { fields: [media.listingId], references: [listings.id] }),
}));

export const transactionsRelations = relations(transactions, ({ many, one }) => ({
  listing: one(listings, { fields: [transactions.listingId], references: [listings.id] }),
  buyer: one(users, { relationName: 'transactionBuyer', fields: [transactions.buyerId], references: [users.id] }),
  agent: one(users, { relationName: 'transactionAgent', fields: [transactions.agentId], references: [users.id] }),
  documents: many(transactionDocuments),
  payments: many(paymentRecords),
  signatureRequests: many(signatureRequests),
}));

export const transactionDocumentsRelations = relations(transactionDocuments, ({ many, one }) => ({
  transaction: one(transactions, { fields: [transactionDocuments.transactionId], references: [transactions.id] }),
  signatureRequests: many(signatureRequests),
}));

export const signatureRequestsRelations = relations(signatureRequests, ({ one }) => ({
  transaction: one(transactions, { fields: [signatureRequests.transactionId], references: [transactions.id] }),
  document: one(transactionDocuments, { fields: [signatureRequests.documentId], references: [transactionDocuments.id] }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  plan: one(subscriptionPlans, { fields: [subscriptions.planId], references: [subscriptionPlans.id] }),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  transaction: one(transactions, { fields: [paymentRecords.transactionId], references: [transactions.id] }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  actor: one(users, { relationName: 'actor', fields: [auditEvents.actorId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  agent: one(users, { relationName: 'agentClients', fields: [clients.agentId], references: [users.id] }),
  buyer: one(users, { relationName: 'buyerClients', fields: [clients.buyerId], references: [users.id] }),
  notes: many(notes),
  ratings: many(ratings),
  inspections: many(inspections),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  client: one(clients, { fields: [notes.clientId], references: [clients.id] }),
  author: one(users, { relationName: 'noteAuthor', fields: [notes.authorId], references: [users.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  client: one(clients, { fields: [ratings.clientId], references: [clients.id] }),
  author: one(users, { relationName: 'ratingAuthor', fields: [ratings.authorId], references: [users.id] }),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  client: one(clients, { fields: [inspections.clientId], references: [clients.id] }),
  listing: one(listings, { fields: [inspections.listingId], references: [listings.id] }),
  author: one(users, { relationName: 'inspectionAuthor', fields: [inspections.authorId], references: [users.id] }),
}));

export const activityRulesRelations = relations(activityRules, ({ many }) => ({
  activities: many(agentActivities),
}));

export const agentActivitiesRelations = relations(agentActivities, ({ one }) => ({
  agent: one(users, { relationName: 'agentActivities', fields: [agentActivities.agentId], references: [users.id] }),
  rule: one(activityRules, { fields: [agentActivities.ruleId], references: [activityRules.id] }),
}));

export const agentPointsRelations = relations(agentPoints, ({ one }) => ({
  agent: one(users, { relationName: 'agentPoints', fields: [agentPoints.agentId], references: [users.id] }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, { relationName: 'blogAuthor', fields: [blogPosts.authorId], references: [users.id] }),
}));

export const referralsRelations = relations(referrals, ({ many, one }) => ({
  referrer: one(users, { relationName: 'referralsMade', fields: [referrals.referrerId], references: [users.id] }),
  referred: one(users, { relationName: 'referredVia', fields: [referrals.referredId], references: [users.id] }),
  commissions: many(commissions),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  referral: one(referrals, { fields: [commissions.referralId], references: [referrals.id] }),
  referrer: one(users, { relationName: 'commissionEarners', fields: [commissions.referrerId], references: [users.id] }),
}));

export const featuredPlacementsRelations = relations(featuredPlacements, ({ one }) => ({
  listing: one(listings, { fields: [featuredPlacements.listingId], references: [listings.id] }),
}));

export const bugReportsRelations = relations(bugReports, ({ one }) => ({
  user: one(users, { fields: [bugReports.userId], references: [users.id] }),
}));
