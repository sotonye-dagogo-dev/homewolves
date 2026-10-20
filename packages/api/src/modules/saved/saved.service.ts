import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { savedCollections, listings, media } from '../../drizzle/schema';

@Injectable()
export class SavedService {
  constructor(
    private db: DrizzleService,
    private analyticsService: AnalyticsService,
  ) {}

  async toggle(userId: string, listingId: string) {
    const [existing] = await this.db
      .select()
      .from(savedCollections)
      .where(and(eq(savedCollections.userId, userId), sql`${savedCollections.listingIds} @> ARRAY[${listingId}]`))
      .limit(1);

    if (existing) {
      const listingIds = existing.listingIds.filter((id) => id !== listingId);
      await this.db
        .update(savedCollections)
        .set({ listingIds })
        .where(eq(savedCollections.id, existing.id));
      return { saved: false };
    }

    const [collection] = await this.db
      .select()
      .from(savedCollections)
      .where(and(eq(savedCollections.userId, userId), eq(savedCollections.name, 'Favorites')))
      .limit(1);

    if (collection) {
      await this.db
        .update(savedCollections)
        .set({ listingIds: [...collection.listingIds, listingId] })
        .where(eq(savedCollections.id, collection.id));
    } else {
      await this.db.insert(savedCollections).values({ userId, name: 'Favorites', listingIds: [listingId] });
    }

    this.analyticsService
      .track({ event: 'listing_saved', userId, listingId, metadata: { saved: true } })
      .catch(() => {});

    return { saved: true };
  }

  async getSaved(userId: string) {
    const collections = await this.db.query.savedCollections.findMany({
      where: eq(savedCollections.userId, userId),
      orderBy: desc(savedCollections.updatedAt),
    });
    if (collections.length === 0) return collections;

    const ids = Array.from(new Set(collections.flatMap((c) => c.listingIds)));
    if (ids.length === 0) return collections.map((c) => ({ ...c, listings: [] }));

    const rows = await this.db.query.listings.findMany({
      where: inArray(listings.id, ids),
      with: { media: { where: eq(media.isPrimary, true), limit: 1 } },
    });
    const byId = new Map(rows.map((listing) => [listing.id, listing]));

    return collections.map((collection) => ({
      ...collection,
      listings: collection.listingIds
        .map((id) => byId.get(id))
        .filter((listing): listing is (typeof rows)[number] => Boolean(listing)),
    }));
  }

  async isSaved(userId: string, listingId: string) {
    const [collection] = await this.db
      .select()
      .from(savedCollections)
      .where(and(eq(savedCollections.userId, userId), sql`${savedCollections.listingIds} @> ARRAY[${listingId}]`))
      .limit(1);
    return { saved: !!collection };
  }
}
