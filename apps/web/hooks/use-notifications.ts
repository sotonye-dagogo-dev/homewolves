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
import { acquireRealtimeSocket, releaseRealtimeSocket } from '@/lib/realtime';

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
    const socket = acquireRealtimeSocket(userId, token);
    if (!socket) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', userId] });
    };
    socket.on('notification:new', handler);

    return () => {
      socket.off('notification:new', handler);
      releaseRealtimeSocket();
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
