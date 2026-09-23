import { Injectable, NotFoundException, ForbiddenException, Optional, Inject } from '@nestjs/common';
import { and, desc, eq, gte, gt, lte, or, ilike, count, sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EmailService } from '../email/email.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto, UpdateListingStatusDto } from './dto/update-listing.dto';
import { listings, media, featuredPlacements } from '../../drizzle/schema';

@Injectable()
export class ListingService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
    private activityService: ActivityService,
    private analyticsService: AnalyticsService,
    private emailService: EmailService,
    @Optional() @Inject(AlertsService) private alertsService?: AlertsService,
  ) {}

  async create(dto: CreateListingDto, ownerId: string, actor: ActorRef) {
    const [listing] = await this.db
      .insert(listings)
      .values({
        title: dto.title,
        description: dto.description,
        price: String(dto.price),
        currency: dto.currency ?? 'NGN',
        category: dto.category,
        propertyType: dto.propertyType,
        locationJson: dto.locationJson,
        amenityIds: dto.amenityIds ?? [],
        metadata: dto.metadata ?? {},
        ownerId,
        agentId: dto.agentId ?? ownerId,
      })
      .returning();
    if (!listing) throw new Error('Failed to create listing');

    const full = await this.db.query.listings.findFirst({
      where: eq(listings.id, listing.id),
      with: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: listing.id,
      action: 'LISTING_CREATED',
      actor,
      metadata: { category: dto.category, propertyType: dto.propertyType },
    });

    if (this.alertsService) {
      this.alertsService.checkNewListingMatch(listing.id).catch(() => {});
    }

    this.activityService
      .awardForUser(ownerId, actor.role, 'listing_created', actor, { listingId: listing.id })
      .catch(() => {});

    return full;
  }

  async findById(id: string) {
    const listing = await this.db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: { owner: true, media: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    category?: string;
    propertyType?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    ownerId?: string;
    featured?: boolean;
    verified?: boolean;
  }) {
    const conditions = [];
    if (params.category) conditions.push(eq(listings.category, params.category as never));
    if (params.propertyType) conditions.push(eq(listings.propertyType, params.propertyType));
    if (params.status) conditions.push(eq(listings.status, params.status as never));
    if (params.ownerId) conditions.push(eq(listings.ownerId, params.ownerId));
    if (params.featured != null) conditions.push(eq(listings.featured, params.featured));
    if (params.verified != null) conditions.push(eq(listings.verified, params.verified));
    if (params.minPrice != null) conditions.push(gte(listings.price, String(params.minPrice)));
    if (params.maxPrice != null) conditions.push(lte(listings.price, String(params.maxPrice)));
    if (params.search) {
      conditions.push(
        or(
          ilike(listings.title, `%${params.search}%`),
          ilike(listings.description, `%${params.search}%`),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      this.db.query.listings.findMany({
        where,
        offset: params.skip ?? 0,
        limit: params.take ?? 12,
        orderBy: desc(listings.createdAt),
        with: { owner: true, media: true },
      }),
      this.db.select({ value: count() }).from(listings).where(where),
    ]);

    return { listings: rows, total: totalResult[0]?.value ?? 0, skip: params.skip ?? 0, take: params.take ?? 12 };
  }

  async update(id: string, dto: UpdateListingDto, userId: string, actor: ActorRef) {
    const [listing] = await this.db.select().from(listings).where(eq(listings.id, id));
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const oldPrice = Number(listing.price);

    const set: Partial<typeof listings.$inferInsert> = {};
    if (dto.title != null) set.title = dto.title;
    if (dto.description != null) set.description = dto.description;
    if (dto.price != null) set.price = String(dto.price);
    if (dto.currency != null) set.currency = dto.currency;
    if (dto.propertyType != null) set.propertyType = dto.propertyType;
    if (dto.status != null) set.status = dto.status as never;
    if (dto.locationJson != null) set.locationJson = dto.locationJson;
    if (dto.metadata != null) set.metadata = dto.metadata;
    if (dto.amenityIds != null) set.amenityIds = dto.amenityIds;
    if (dto.featured != null) set.featured = dto.featured;

    await this.db.update(listings).set(set).where(eq(listings.id, id));

    const updated = await this.db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: 'LISTING_UPDATED',
      actor,
      metadata: { changes: Object.keys(dto) },
    });

    if (dto.price != null && this.alertsService) {
      const newPrice = Number(dto.price);
      this.alertsService.checkPriceDrop(id, oldPrice, newPrice).catch(() => {});
    }

    return updated;
  }

  async updateStatus(id: string, dto: UpdateListingStatusDto, userId: string, actor: ActorRef) {
    const [listing] = await this.db.select().from(listings).where(eq(listings.id, id));
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    await this.db.update(listings).set({ status: dto.status as never }).where(eq(listings.id, id));

    const updated = await this.db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: `LISTING_STATUS_${dto.status}`,
      actor,
      metadata: { from: listing.status, to: dto.status },
    });

    return updated;
  }

  async getPendingModeration() {
    return this.db.query.listings.findMany({
      where: eq(listings.status, 'PENDING'),
      orderBy: desc(listings.createdAt),
      with: { owner: true, media: true },
    });
  }

  async moderateListing(id: string, action: 'approve' | 'reject', actor: ActorRef) {
    const [listing] = await this.db.select().from(listings).where(eq(listings.id, id));
    if (!listing) throw new NotFoundException('Listing not found');

    const newStatus = action === 'approve' ? 'ACTIVE' : 'DRAFT';
    await this.db.update(listings).set({ status: newStatus as never }).where(eq(listings.id, id));

    const updated = await this.db.query.listings.findFirst({
      where: eq(listings.id, id),
      with: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: action === 'approve' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      actor,
      metadata: { from: listing.status, to: newStatus },
    });

    if (action === 'approve' && updated?.owner?.role) {
      void this.activityService.awardForUser(
        updated.ownerId,
        updated.owner.role,
        'listing_approved',
        actor,
        { listingId: id, title: updated.title ?? '' },
      );
    }

    if (updated?.owner?.email) {
      const templateKey = action === 'approve' ? 'listing_approved' : 'listing_rejected';
      void this.emailService.send(updated.owner.email, templateKey, {
        firstName: updated.owner.firstName ?? 'there',
        listingTitle: updated.title ?? '',
        listingId: updated.id,
        amount: updated.price ? String(Number(updated.price)) : '',
        currency: updated.currency ?? 'NGN',
      });
    }

    return updated;
  }

  async delete(id: string, userId: string, actor: ActorRef) {
    const [listing] = await this.db.select().from(listings).where(eq(listings.id, id));
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    await this.db.delete(listings).where(eq(listings.id, id));

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: 'LISTING_DELETED',
      actor,
    });
  }

  async getFeatured() {
    const now = new Date();
    const placements = await this.db.query.featuredPlacements.findMany({
      where: and(eq(featuredPlacements.status, 'active'), gt(featuredPlacements.endDate, now)),
      orderBy: desc(featuredPlacements.startDate),
      limit: 6,
      with: { listing: { with: { owner: true, media: true } } },
    });
    return placements.map((p) => p.listing);
  }

  async uploadMediaUrl(filename: string, _contentType: string) {
    // Stub: in production, generate presigned S3 URL
    return {
      uploadUrl: `https://storage.homewolves.africa/stub/${filename}`,
      publicUrl: `https://storage.homewolves.africa/stub/${filename}`,
      expiresIn: 3600,
    };
  }

  async attachMedia(listingId: string, mediaData: { url: string; type: string; isPrimary?: boolean; altText?: string }[], userId: string) {
    const [listing] = await this.db.select().from(listings).where(eq(listings.id, listingId));
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const rows = await Promise.all(
      mediaData.map((m, i) =>
        this.db
          .insert(media)
          .values({
            listingId,
            url: m.url,
            type: m.type,
            altText: m.altText,
            isPrimary: m.isPrimary ?? false,
            displayOrder: i,
          })
          .returning()
          .then((r) => r[0]),
      ),
    );
    return rows;
  }

  async incrementView(id: string) {
    const [updated] = await this.db
      .update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, id))
      .returning();
    if (!updated) return;
    this.analyticsService
      .track({
        event: 'listing_view',
        listingId: id,
        agentId: updated.agentId ?? undefined,
        metadata: { category: updated.category, propertyType: updated.propertyType },
      })
      .catch(() => {});
  }
}
