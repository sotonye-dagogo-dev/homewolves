import { Injectable, ForbiddenException } from '@nestjs/common';
import { and, desc, eq, gte, lte, count, inArray, sql, or } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import {
  analyticsEvents,
  bugReports,
  listings,
  paymentRecords,
  transactions,
  agentPoints,
  users,
  media,
} from '../../drizzle/schema';

interface TrackEventInput {
  event: string;
  userId?: string;
  sessionId?: string;
  listingId?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

const FUNNEL_EVENTS = [
  'pageview',
  'listing_view',
  'listing_enquiry',
  'listing_saved',
  'transaction_started',
  'transaction_completed',
];

@Injectable()
export class AnalyticsService {
  constructor(private db: DrizzleService) {}

  async track(input: TrackEventInput) {
    const [event] = await this.db
      .insert(analyticsEvents)
      .values({
        event: input.event,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        listingId: input.listingId ?? null,
        agentId: input.agentId ?? null,
        metadata: input.metadata ?? {},
      })
      .returning();
    if (!event) throw new Error('Failed to track event');
    return { id: event.id, event: event.event };
  }

  private dateRange(days?: number): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    if (days && days > 0) {
      from.setDate(from.getDate() - days);
    } else {
      from.setFullYear(from.getFullYear() - 100);
    }
    return { from, to };
  }

  async getListingPerformance(listingId: string, days?: number) {
    const { from, to } = this.dateRange(days);

    const [listing, eventGroups] = await Promise.all([
      this.db
        .select({
          id: listings.id,
          title: listings.title,
          viewCount: listings.viewCount,
          enquiryCount: listings.enquiryCount,
          featured: listings.featured,
          status: listings.status,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(eq(listings.id, listingId)),
      this.db
        .select({ event: analyticsEvents.event, eventCount: count() })
        .from(analyticsEvents)
        .where(and(eq(analyticsEvents.listingId, listingId), gte(analyticsEvents.createdAt, from), lte(analyticsEvents.createdAt, to)))
        .groupBy(analyticsEvents.event),
    ]);

    if (!listing[0]) {
      return { error: 'Listing not found' };
    }

    const eventCounts = eventGroups.reduce(
      (acc, g) => {
        acc[g.event] = g.eventCount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      listing: listing[0],
      period: { from, to },
      events: eventCounts,
      totalEvents: eventGroups.reduce((sum, g) => sum + g.eventCount, 0),
    };
  }

  async getAgentPerformance(agentId: string, days?: number) {
    const { from, to } = this.dateRange(days);

    const [listingRows, transactionsRows, eventGroups, points, agent] = await Promise.all([
      this.db
        .select({
          id: listings.id,
          title: listings.title,
          viewCount: listings.viewCount,
          enquiryCount: listings.enquiryCount,
          status: listings.status,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(eq(listings.agentId, agentId))
        .orderBy(desc(listings.createdAt))
        .limit(500),
      this.db.select({ status: transactions.status }).from(transactions).where(eq(transactions.agentId, agentId)),
      this.db
        .select({ event: analyticsEvents.event, eventCount: count() })
        .from(analyticsEvents)
        .where(and(eq(analyticsEvents.agentId, agentId), gte(analyticsEvents.createdAt, from), lte(analyticsEvents.createdAt, to)))
        .groupBy(analyticsEvents.event),
      this.db.select().from(agentPoints).where(eq(agentPoints.agentId, agentId)).then((r) => r[0] ?? null),
      this.db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(eq(users.id, agentId))
        .then((r) => r[0] ?? null),
    ]);

    const eventCounts = eventGroups.reduce(
      (acc, g) => {
        acc[g.event] = g.eventCount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusBreakdown = transactionsRows.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      agent,
      period: { from, to },
      summary: {
        activeListings: listingRows.filter((l) => l.status === 'ACTIVE').length,
        totalListings: listingRows.length,
        totalViews: listingRows.reduce((sum, l) => sum + l.viewCount, 0),
        totalEnquiries: listingRows.reduce((sum, l) => sum + l.enquiryCount, 0),
        transactions: statusBreakdown,
        totalTransactions: transactionsRows.length,
        activityPoints: points?.totalPoints ?? 0,
        tier: points?.tier ?? 'bronze',
      },
      listings: listingRows.slice(0, 20),
      events: eventCounts,
    };
  }

  async getFunnel(days?: number) {
    const { from, to } = this.dateRange(days);

    const groups = await this.db
      .select({ event: analyticsEvents.event, eventCount: count() })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, from), lte(analyticsEvents.createdAt, to)))
      .groupBy(analyticsEvents.event);

    const counts = groups.reduce(
      (acc, g) => {
        acc[g.event] = g.eventCount;
        return acc;
      },
      {} as Record<string, number>,
    );

    return FUNNEL_EVENTS.map((event, i) => {
      const stepCount = counts[event] ?? 0;
      const previous = i === 0 ? null : counts[FUNNEL_EVENTS[i - 1]!] ?? 0;
      return {
        event,
        count: stepCount,
        conversionRate: previous && previous > 0 ? Number(((stepCount / previous) * 100).toFixed(1)) : (i === 0 ? 100 : 0),
      };
    });
  }

  async getAdminSummary() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      pendingListings,
      flaggedListings,
      openBugReports,
      activeTransactions,
      revenue,
    ] = await Promise.all([
      this.db
        .select({ value: count() })
        .from(listings)
        .where(eq(listings.status, 'PENDING'))
        .then((r) => Number(r[0]?.value ?? 0)),
      this.db
        .select({ value: count() })
        .from(listings)
        .where(eq(listings.status, 'SUSPENDED'))
        .then((r) => Number(r[0]?.value ?? 0)),
      this.db
        .select({ value: count() })
        .from(bugReports)
        .where(or(eq(bugReports.status, 'OPEN'), eq(bugReports.status, 'UNDER_REVIEW')))
        .then((r) => Number(r[0]?.value ?? 0)),
      this.db
        .select({ value: count() })
        .from(transactions)
        .where(or(eq(transactions.status, 'INITIATED'), eq(transactions.status, 'IN_PROGRESS')))
        .then((r) => Number(r[0]?.value ?? 0)),
      this.db
        .select({ value: sql<string>`coalesce(sum(${paymentRecords.amount}), 0)` })
        .from(paymentRecords)
        .where(
          and(
            eq(paymentRecords.status, 'confirmed'),
            gte(paymentRecords.confirmedAt, monthStart),
          ),
        )
        .then((r) => Number(r[0]?.value ?? 0)),
    ]);

    return {
      pendingListings,
      flaggedListings,
      openBugReports,
      activeTransactions,
      revenueMtd: Number.isFinite(revenue) ? revenue : 0,
      currency: 'NGN',
    };
  }

  async getOverview(days?: number) {
    const { from, to } = this.dateRange(days);

    const [events, listingsCreated, transactionCount, userCount] = await Promise.all([
      this.db
        .select({ event: analyticsEvents.event, eventCount: count() })
        .from(analyticsEvents)
        .where(and(gte(analyticsEvents.createdAt, from), lte(analyticsEvents.createdAt, to)))
        .groupBy(analyticsEvents.event),
      this.db
        .select({ value: count() })
        .from(listings)
        .where(and(gte(listings.createdAt, from), lte(listings.createdAt, to)))
        .then((r) => r[0]?.value ?? 0),
      this.db
        .select({ value: count() })
        .from(transactions)
        .where(and(gte(transactions.createdAt, from), lte(transactions.createdAt, to)))
        .then((r) => r[0]?.value ?? 0),
      this.db
        .select({ value: count() })
        .from(users)
        .where(and(gte(users.createdAt, from), lte(users.createdAt, to)))
        .then((r) => r[0]?.value ?? 0),
    ]);

    const totalEvents = events.reduce((sum, g) => sum + g.eventCount, 0);

    return {
      period: { from, to },
      totalEvents,
      events: events.reduce((acc, g) => {
        acc[g.event] = g.eventCount;
        return acc;
      }, {} as Record<string, number>),
      listingsCreated,
      transactionsStarted: transactionCount,
      newUsers: userCount,
    };
  }

  async getMyPerformance(userId: string, role: string, days?: number) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return this.getOverview(days);
    }
    if (role === 'AGENT' || role === 'DEVELOPER' || role === 'HOMEOWNER') {
      return this.getAgentPerformance(userId, days);
    }
    throw new ForbiddenException('Analytics are available to agents and admins');
  }

  async getTopListings(days?: number, limit = 10) {
    const { from, to } = this.dateRange(days);

    const groups = await this.db
      .select({ listingId: analyticsEvents.listingId, eventCount: count() })
      .from(analyticsEvents)
      .where(and(gte(analyticsEvents.createdAt, from), lte(analyticsEvents.createdAt, to)))
      .groupBy(analyticsEvents.listingId)
      .orderBy(desc(count()))
      .limit(limit);

    const ids = groups.map((g) => g.listingId).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];

    const rows = await this.db.query.listings.findMany({
      where: inArray(listings.id, ids),
      with: { media: { where: eq(media.isPrimary, true), limit: 1 } },
    });
    const byId = Object.fromEntries(rows.map((l) => [l.id, l]));

    return groups
      .map((g) => ({
        listing: byId[g.listingId as string] ?? null,
        events: g.eventCount,
      }))
      .filter((item) => item.listing != null);
  }
}