'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useNotificationBell } from '@/hooks/use-notifications';
import { LayoutDashboard, Home, Users, ShieldCheck, FileText, MessageCircle, Bell, User, Menu, X, Bug } from 'lucide-react';
import Link from 'next/link';

function buildNavItems(user: any) {
  const isAgent = user?.role === 'AGENT' || user?.role === 'DEVELOPER' || user?.role === 'HOMEOWNER';
  const isBuyer = user?.role === 'BUYER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const items: { label: string; href: string; Icon: any }[] = [
    { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  ];

  if (isAgent) {
    items.push(
      { label: 'My Listings', href: '/dashboard/agent/listings', Icon: Home },
      { label: 'Clients', href: '/dashboard/agent/clients', Icon: Users },
    );
  }

  if (isAdmin) {
    items.push(
      { label: 'Moderation', href: '/dashboard/admin/moderation', Icon: ShieldCheck },
      { label: 'Bug Reports', href: '/dashboard/admin/bug-reports', Icon: Bug },
    );
  }

  items.push(
    { label: 'Transactions', href: isBuyer ? '/dashboard/client' : '/dashboard/agent/transactions', Icon: FileText },
    { label: 'Messages', href: '/messages', Icon: MessageCircle },
    { label: 'Notifications', href: '/dashboard/notifications', Icon: Bell },
  );

  if (isBuyer) {
    items.splice(items.length - 3, 0, { label: 'My Dashboard', href: '/dashboard/client', Icon: User });
  }

  return items;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, hydrated, logout } = useAuth();
  const router = useRouter();
  const { unreadCount, notifications, isOpen, setIsOpen, markRead, markAllRead } = useNotificationBell(user?.id, accessToken ?? undefined);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // do not auto-redirect; unauthenticated state renders CTA instead
  }, [hydrated, accessToken, router]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg-canvas)' }}>
        <div className="animate-pulse" style={{ color: 'var(--color-text-tertiary)' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-canvas)' }}>
        <div className="max-w-md w-full text-center p-8 rounded-xl" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Sign in to continue</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>You need to be authenticated to access the dashboard. Create an account or sign in to continue.</p>
          <div className="flex justify-center gap-3">
            <Link href="/auth" className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>Sign in</Link>
            <Link href="/" className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}>Back to home</Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = buildNavItems(user);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg-canvas)' }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 border-r shrink-0"
        style={{
          background: 'var(--color-bg-glass)',
          backdropFilter: 'var(--glass-blur-subtle)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            H
          </div>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Homewolves</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-glass)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: 'var(--color-border-default)' }}>
          <div className="flex items-center gap-3 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--color-brand-secondary)', color: 'var(--color-text-inverse)' }}
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left px-5 py-2 text-sm rounded-lg transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-glass)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)' }}>
        <button
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar');
            if (sidebar) sidebar.classList.toggle('-translate-x-full');
          }}
          className="p-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Homewolves</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-1"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Notifications"
        >
          <Bell className="w-[22px] h-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <div
        id="mobile-sidebar"
        className="md:hidden fixed inset-0 z-50 -translate-x-full transition-transform duration-300"
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => {
          const sidebar = document.getElementById('mobile-sidebar');
          if (sidebar) sidebar.classList.add('-translate-x-full');
        }} />
        <aside
          className="relative w-64 h-full p-4"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          <nav className="space-y-2 mt-8">
            {navItems.map((item) => {
              const Icon = item.Icon;
              return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
                onClick={() => {
                  const sidebar = document.getElementById('mobile-sidebar');
                  if (sidebar) sidebar.classList.add('-translate-x-full');
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 pb-20 md:pb-0 relative">
        {/* Notification bell — desktop */}
        <div className="hidden md:flex absolute top-4 right-4 z-30 items-center gap-2" ref={notifRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-secondary)' }}
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification dropdown */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="fixed md:absolute md:top-14 md:right-4 z-50 w-full md:w-80 max-h-[70vh] flex flex-col rounded-xl shadow-xl"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', maxWidth: 'calc(100vw - 32px)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={() => { markAllRead(); }} className="text-xs font-medium" style={{ color: 'var(--color-brand-accent)' }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1" style={{ color: 'var(--color-text-muted)' }}><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n: any) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 border-b transition-colors cursor-pointer hover:bg-[var(--color-bg-glass)]"
                      style={{ borderColor: 'var(--color-border-subtle)', ...(!n.read ? { background: 'var(--color-bg-glass)' } : {}) }}
                      onClick={() => {
                        if (!n.read) markRead([n.id]);
                        setIsOpen(false);
                        router.push('/dashboard/notifications');
                      }}
                    >
                      <div className="mt-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: n.read ? 'transparent' : 'var(--color-brand-accent)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{n.body}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link
                href="/dashboard/notifications"
                className="block text-center py-3 text-sm font-medium border-t"
                style={{ color: 'var(--color-brand-accent)', borderColor: 'var(--color-border-subtle)' }}
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </>
        )}

        {children}
      </main>
    </div>
  );
}
