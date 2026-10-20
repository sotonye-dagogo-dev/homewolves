import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, sql, isNull, count } from 'drizzle-orm';
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

  async createConversation(participantIds: string[], propertyId?: string, creatorId?: string) {
    const [conversation] = await this.db
      .insert(conversations)
      .values({ participantIds, propertyId })
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
