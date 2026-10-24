'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchConversation,
  fetchMessages,
  fetchUnreadCount,
  fetchMessagingDirectory,
  connectSocket,
  isSocketConnected,
  joinConversation,
  leaveConversation,
  sendMessage as wsSendMessage,
  sendMessageRest,
  markRead as wsMarkRead,
  disconnectSocket,
} from '@/lib/messaging';
import { isRealtimeEnabled } from '@/lib/realtime';
import { useAuth } from './use-auth';

export function useConversations() {
  return useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: fetchConversations,
    staleTime: 15_000,
    refetchInterval: isRealtimeEnabled() ? false : 20_000,
    retry: 1,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['messaging', 'conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: !!id,
    retry: 1,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messaging', 'messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
    // Poll when realtime is unavailable so received messages still appear.
    refetchInterval: isRealtimeEnabled() ? false : 6_000,
    retry: 1,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['messaging', 'unread'],
    queryFn: fetchUnreadCount,
    staleTime: 15_000,
    refetchInterval: isRealtimeEnabled() ? false : 20_000,
  });
}

export function useMessagingDirectory(
  params: { search?: string; role?: string; take?: number } = {},
) {
  const { search = '', role, take } = params;
  return useQuery({
    queryKey: ['messaging', 'directory', { search, role, take }],
    queryFn: () => fetchMessagingDirectory({ search: search || undefined, role, take }),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMessaging(conversationId?: string) {
  const { accessToken, user } = useAuth();
  const qc = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id || !accessToken) return;

    const socket = connectSocket(user.id, accessToken);
    if (!socket) return;

    if (conversationId) {
      if (socket.connected) joinConversation(conversationId);
      else socket.once('connect', () => joinConversation(conversationId));
    }

    const onNewMessage = (message: { conversationId?: string }) => {
      if (message?.conversationId) {
        qc.invalidateQueries({ queryKey: ['messaging', 'messages', message.conversationId] });
      }
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      qc.invalidateQueries({ queryKey: ['messaging', 'unread'] });
    };
    const onRead = () => {
      qc.invalidateQueries({ queryKey: ['messaging'] });
    };
    const onTyping = ({ userId: typingUserId, typing }: { userId: string; typing: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (typing) next.add(typingUserId);
        else next.delete(typingUserId);
        return next;
      });
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:read', onRead);
    socket.on('typing:update', onTyping);

    return () => {
      if (conversationId) leaveConversation(conversationId);
      socket.off('message:new', onNewMessage);
      socket.off('message:read', onRead);
      socket.off('typing:update', onTyping);
      disconnectSocket();
    };
  }, [user?.id, accessToken, conversationId, qc]);

  const sendMessage = useCallback(
    async (content: string, type = 'text', mediaUrl?: string) => {
      if (!conversationId) throw new Error('Select a conversation first.');
      const trimmed = content.trim();
      if (!trimmed) return;

      if (isSocketConnected() && type === 'text') {
        wsSendMessage(conversationId, trimmed, type, mediaUrl);
        return;
      }

      await sendMessageRest(conversationId, trimmed, type, mediaUrl);
      qc.invalidateQueries({ queryKey: ['messaging', 'messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      qc.invalidateQueries({ queryKey: ['messaging', 'unread'] });
    },
    [conversationId, qc],
  );

  const markRead = useCallback(() => {
    if (conversationId) wsMarkRead(conversationId);
  }, [conversationId]);

  return { sendMessage, markRead, typingUsers };
}
