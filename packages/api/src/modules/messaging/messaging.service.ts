import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, sql, isNull, count, ilike, or } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { conversations, messages, users } from '../../drizzle/schema';

@Injectable()
export class MessagingService {
  constructor(
    private db: DrizzleService,
    private activityService: ActivityService,
    private analyticsService: AnalyticsService,
  ) {}

  private async participantProfiles(participantIds: string[]) {
    const ids = Array.from(new Set(participantIds.filter(Boolean)));
    if (ids.length === 0) return [];
    return this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatar: users.avatar,
        phone: users.phone,
      })
      .from(users)
      .where(inArray(users.id, ids));
  }

  async getConversations(userId: string) {
    const rows = await this.db.query.conversations.findMany({
      where: sql`${conversations.participantIds} @> ARRAY[${userId}]`,
      orderBy: desc(conversations.lastMessageAt),
      with: {
        messages: {
          orderBy: desc(messages.createdAt),
          limit: 1,
          with: { sender: true },
        },
      },
    });

    if (rows.length === 0) return rows;
    const participants = await this.participantProfiles(rows.flatMap((c) => c.participantIds));
    return rows.map((conversation) => ({
      ...conversation,
      participants: participants.filter((p) => conversation.participantIds.includes(p.id)),
    }));
  }

  async getConversationById(id: string, userId: string) {
    const conversation = await this.db.query.conversations.findFirst({
      where: eq(conversations.id, id),
      with: {
        messages: {
          orderBy: asc(messages.createdAt),
          with: { sender: true },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }
    const participants = await this.participantProfiles(conversation.participantIds);
    return { ...conversation, participants };
  }

  private participantArraySql(ids: string[]) {
    return sql`${conversations.participantIds} @> ARRAY[${sql.join(ids.map((id) => sql`${id}`), sql`, `)}]::text[]`;
  }

  private async findExistingConversation(
    participantIds: string[],
    propertyId?: string,
  ) {
    const rows = (await this.db
      .select()
      .from(conversations)
      .where(this.participantArraySql(participantIds))) as Array<{
      id: string;
      participantIds: string[];
      propertyId?: string | null;
    }>;
    const sameParticipants = (c: { participantIds?: string[] | null }) =>
      Array.isArray(c.participantIds) &&
      c.participantIds.length === participantIds.length &&
      participantIds.every((id) => c.participantIds!.includes(id));
    const matches = rows.filter(
      (c) => sameParticipants(c) && (c.propertyId ?? null) === (propertyId ?? null),
    );
    // Newest matching conversation wins — deterministic when duplicates
    // already exist from before dedupe landed.
    const first = matches[0];
    return first ?? null;
  }

  async createConversation(participantIds: string[], propertyId?: string, creatorId?: string) {
    const ids = Array.from(new Set(participantIds.filter(Boolean)));
    if (creatorId && !ids.includes(creatorId)) ids.push(creatorId);
    if (ids.length < 2) {
      throw new BadRequestException('Select at least one other participant to message.');
    }

    const known = (await this.db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, ids))) as Array<{ id: string }>;
    const missing = ids.filter((id) => !known.some((k) => k.id === id));
    if (missing.length > 0) {
      throw new NotFoundException(`User not found: ${missing[0]}`);
    }

    // Find-or-create: reuse an existing 1:1 conversation for the same
    // participants + listing so repeated "Chat Agent" taps never spam the
    // inbox with duplicate threads (idempotent, list-order insensitive).
    const existing = await this.findExistingConversation(ids, propertyId);
    if (existing) return existing;

    const [conversation] = await this.db
      .insert(conversations)
      .values({ participantIds: ids, propertyId })
      .returning();
    if (!conversation) throw new Error('Failed to create conversation');

    if (propertyId) {
      this.analyticsService
        .track({
          event: 'listing_enquiry',
          userId: creatorId,
          listingId: propertyId,
          metadata: { conversationId: conversation.id },
        })
        .catch(() => {});
    }

    return conversation;
  }

  /**
   * Messaging directory: minimal, privacy-safe list of messagable users.
   * Exposes never phone/email — those only surface to conversation
   * participants via the existing participant-profile queries.
   */
  async getDirectory(options: { search?: string; role?: string; take?: number; excludeUserId?: string }) {
    const take = Math.max(1, Math.min(options.take ?? 25, 50));
    const search = options.search?.trim();
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
        ),
      );
    }
    if (options.role) {
      conditions.push(eq(users.role, options.role as never));
    }
    if (options.excludeUserId) {
      conditions.push(ne(users.id, options.excludeUserId));
    }
    return this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatar: users.avatar,
        verified: users.verified,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.verified), asc(users.firstName))
      .limit(take);
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type = 'text', mediaUrl?: string) {
    const [conversation] = await this.db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(senderId)) {
      throw new ForbiddenException('Not a participant');
    }

    const [message] = await this.db
      .insert(messages)
      .values({ conversationId, senderId, content, type, mediaUrl })
      .returning();
    if (!message) throw new Error('Failed to send message');

    const [sender] = await this.db.select().from(users).where(eq(users.id, senderId));
    const messageWithSender = { ...message, sender: sender ?? null };

    await this.db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    const role = sender?.role ?? 'GUEST';
    this.activityService
      .awardForUser(senderId, role, 'message_sent', { id: senderId, role, name: senderId }, { conversationId })
      .catch(() => {});

    return messageWithSender;
  }

  async getMessages(conversationId: string, userId: string) {
    const [conversation] = await this.db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }

    return this.db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: asc(messages.createdAt),
      with: { sender: true },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    const [conversation] = await this.db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('Not a participant');
    }

    await this.db
      .update(messages)
      .set({ readAt: new Date() })
      .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
  }

  async getUnreadCount(userId: string) {
    const rows = await this.db.query.conversations.findMany({
      where: sql`${conversations.participantIds} @> ARRAY[${userId}]`,
      columns: { id: true },
    });

    const ids = rows.map((c) => c.id);
    if (ids.length === 0) return 0;

    const [result] = await this.db
      .select({ value: count() })
      .from(messages)
      .where(and(inArray(messages.conversationId, ids), ne(messages.senderId, userId), isNull(messages.readAt)));

    return result?.value ?? 0;
  }
}
