'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  markAllNotificationsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let globalSocket: Socket | null = null;
let globalListeners = 0;

function getSocket(userId?: string, token?: string): Socket | null {
  if (!userId || !token) return null;
  if (!globalSocket?.connected) {
    globalSocket = io(`${SOCKET_URL}/ws`, {
      query: { userId },
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return globalSocket;
}

export function useNotifications(userId?: string, token?: string) {
  const queryClient = useQueryClient();

  const { data: notifData, isLoading: notifsLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread', userId],
    queryFn: () => fetchUnreadCount(),
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const markRead = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    },
  });

  useEffect(() => {
    if (!userId || !token) return;
    const socket = getSocket(userId, token);
    if (!socket) return;

    globalListeners++;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    };
    socket.on('notification:new', handler);

    return () => {
      globalListeners--;
      socket.off('notification:new', handler);
      if (globalListeners <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [userId, token, queryClient]);

  const rawNotifications = notifData?.notifications;
  const rawUnread = unreadData?.count;

  return {
    notifications: (Array.isArray(rawNotifications) ? rawNotifications : []) as Notification[],
    total: (typeof notifData?.total === 'number' ? notifData.total : Array.isArray(rawNotifications) ? rawNotifications.length : 0),
    unreadCount: (typeof rawUnread === 'number' ? rawUnread : 0) as number,
    notifsLoading,
    markRead: (ids: string[]) => markRead.mutateAsync(ids),
    markAllRead: () => markAllRead.mutateAsync(),
  };
}

export function useNotificationPreferences(userId?: string) {
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery({
    queryKey: ['notifications-preferences', userId],
    queryFn: fetchNotificationPreferences,
    enabled: !!userId,
  });

  const updatePrefs = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-preferences', userId] });
    },
  });

  return {
    preferences: (preferences ?? {}) as Record<string, boolean>,
    updatePreferences: (prefs: Record<string, boolean>) => updatePrefs.mutateAsync(prefs),
  };
}

export function useNotificationBell(userId?: string, token?: string) {
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications(userId, token);
  const [isOpen, setIsOpen] = useState(false);

  return {
    unreadCount,
    notifications,
    isOpen,
    setIsOpen,
    markRead,
    markAllRead,
  };
}
