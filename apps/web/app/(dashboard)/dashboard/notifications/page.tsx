'use client';

import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useState } from 'react';
import {
  MessageCircle,
  Calendar,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  Home,
  Star,
  TrendingDown,
  Bell,
  UserPlus,
  Wallet,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MESSAGE_RECEIVED: MessageCircle,
  INSPECTION_SCHEDULED: Calendar,
  TRANSACTION_CREATED: FileText,
  TRANSACTION_ADVANCED: ArrowRight,
  TRANSACTION_APPROVED: CheckCircle,
  TRANSACTION_REJECTED: XCircle,
  LISTING_CREATED: Home,
  LISTING_APPROVED: CheckCircle,
  LISTING_REJECTED: XCircle,
  WISHLIST_INTEREST: Star,
  PRICE_DROP: TrendingDown,
  NEW_MATCHING_LISTING: Bell,
  REFERRAL_SIGNUP: UserPlus,
  COMMISSION_EARNED: Wallet,
};

export default function NotificationsPage() {
  const { user, accessToken } = useAuth();
  const { notifications, total, unreadCount, markRead, markAllRead } = useNotifications(user?.id, accessToken ?? undefined);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread'
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  const handleMarkRead = (ids: string[]) => {
    markRead(ids);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            Notifications
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {unreadCount} unread · {total} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="px-4 py-2 text-sm font-medium rounded-full transition-colors"
            style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', color: 'var(--color-brand-accent)' }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-sm font-medium rounded-full transition-colors capitalize"
            style={{
              background: filter === f ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
              color: filter === f ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              border: filter === f ? 'none' : '1px solid var(--color-border-glass)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex justify-center mb-3 text-muted-foreground"><Bell className="w-10 h-10" /></div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filtered.map((n: any) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
            <div
              key={n.id}
              className="flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer"
              style={{
                background: n.read ? 'var(--color-bg-elevated)' : 'var(--color-bg-glass)',
                border: '1px solid var(--color-border-glass)',
              }}
              onClick={() => {
                if (!n.read) handleMarkRead([n.id]);
              }}
            >
              <div className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-[var(--color-bg-glass)] border border-[var(--color-border-subtle)] text-muted-foreground">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {n.title}
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ background: 'var(--color-brand-accent)' }} />
                    )}
                  </p>
                  <span className="text-[10px] whitespace-nowrap shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {n.body}
                </p>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
