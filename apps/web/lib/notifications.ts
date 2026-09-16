import { getApiBase } from '@/lib/api-base';


async function fetchApi(path: string, options?: RequestInit) {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('hw-auth') : null;
  let token = '';
  if (stored) {
    try {
      token = JSON.parse(stored).state?.accessToken ?? '';
    } catch (error) {
      void error;
    }
  }
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchNotifications(limit = 50, offset = 0) {
  return fetchApi(`/notifications?limit=${limit}&offset=${offset}`);
}

export async function fetchUnreadCount() {
  return fetchApi('/notifications/unread-count');
}

export async function markNotificationsRead(notificationIds: string[]) {
  return fetchApi('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ notificationIds }),
  });
}

export async function markAllNotificationsRead() {
  return fetchApi('/notifications/mark-all-read', { method: 'POST' });
}

export async function fetchNotificationPreferences() {
  return fetchApi('/notifications/preferences');
}

export async function updateNotificationPreferences(preferences: Record<string, boolean>) {
  return fetchApi('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences }),
  });
}
