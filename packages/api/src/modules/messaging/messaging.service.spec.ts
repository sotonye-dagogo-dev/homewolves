import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagingService } from './messaging.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';

type MockFn = ReturnType<typeof vi.fn>;

const agent = { id: 'agent-1' };

describe('MessagingService', () => {
  let service: MessagingService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let activity: { awardForUser: MockFn };
  let analytics: { track: MockFn };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    activity = { awardForUser: vi.fn().mockResolvedValue(null) };
    analytics = { track: vi.fn().mockResolvedValue(null) };
    service = new MessagingService(
      mocks.db,
      activity as unknown as ActivityService,
      analytics as unknown as AnalyticsService,
    );
  });

  describe('createConversation', () => {
    it('reuses an existing conversation with the same participants + property', async () => {
      const existing = { id: 'convo-1', participantIds: ['user-1', 'agent-1'], propertyId: 'prop-1' };
      mocks.select.mockReturnValue(createChain([agent, { id: 'user-1' }]));
      const findSpy = vi
        .spyOn(
          service as unknown as {
            findExistingConversation: (ids: string[], propertyId?: string) => Promise<unknown>;
          },
          'findExistingConversation',
        )
        .mockResolvedValue(existing);

      const result = await service.createConversation(['agent-1'], 'prop-1', 'user-1');

      expect(findSpy).toHaveBeenCalledWith(['agent-1', 'user-1'], 'prop-1');
      expect(result).toEqual(existing);
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('creates a new conversation when none matches and tracks listing enquiry', async () => {
      mocks.select.mockReturnValue(createChain([agent, { id: 'user-1' }]));
      mocks.insert.mockReturnValue(
        createChain([{ id: 'convo-2', participantIds: ['user-1', 'agent-1'], propertyId: 'prop-1' }]),
      );

      const result = await service.createConversation(['agent-1'], 'prop-1', 'user-1');

      expect(result.id).toBe('convo-2');
      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'listing_enquiry', listingId: 'prop-1', userId: 'user-1' }),
      );
    });

    it('throws NotFound when a participant does not exist', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await expect(
        service.createConversation(['ghost-id'], undefined, 'user-1'),
      ).rejects.toThrow('User not found: ghost-id');
    });

    it('rejects conversations with only the creator', async () => {
      await expect(
        service.createConversation(['user-1'], undefined, 'user-1'),
      ).rejects.toThrow('Select at least one other participant');
      expect(mocks.insert).not.toHaveBeenCalled();
    });
  });

  describe('getDirectory', () => {
    it('returns minimal fields (no phone/email) and excludes the caller', async () => {
      const onMethod = vi.fn();
      mocks.select.mockReturnValue(createChain([{ id: 'agent-1', firstName: 'Ada' }], onMethod));

      const result = await service.getDirectory({ excludeUserId: 'user-1' });

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('phone');
      expect(result[0]).not.toHaveProperty('email');
      expect(result[0]).not.toHaveProperty('passwordHash');
      const chainMethods = onMethod.mock.calls.map((c) => c[0]);
      expect(chainMethods).toContain('limit');
    });

    it('clamps take into the 1..50 window', async () => {
      const onMethod = vi.fn();
      mocks.select.mockReturnValue(createChain([], onMethod));
      await service.getDirectory({ take: 500 });
      const limitArg = onMethod.mock.calls.find((c) => c[0] === 'limit')?.[1]?.[0];
      expect(limitArg).toBeLessThanOrEqual(50);
    });
  });

  describe('getMessages access gating (regression)', () => {
    it('forbids non-participants from reading messages', async () => {
      mocks.select.mockReturnValue(createChain([{ id: 'c-1', participantIds: ['a', 'b'] }]));
      await expect(service.getMessages('c-1', 'intruder')).rejects.toThrow('Not a participant');
    });
  });
});
