'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Plus } from 'lucide-react';

const tabs = [
  {
    label: 'Explore',
    icon: Home,
    aria: 'Explore properties',
    href: '/properties',
    match: '/properties',
  },
  { label: 'Chat', icon: MessageCircle, aria: 'Messages', href: '/messages', match: '/messages' },
  {
    label: 'Profile',
    icon: User,
    aria: 'Client dashboard',
    href: '/dashboard/client',
    match: '/dashboard/client',
  },
];

export function MobileBar() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] min-h-20 pb-[calc(10px+env(safe-area-inset-bottom))] bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-heavy)] border-t border-[var(--color-border-glass)] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      role="navigation"
      aria-label="Bottom navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname.startsWith(tab.match);
        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-label={tab.aria}
            data-state={active ? 'active' : ''}
            className={`flex flex-col items-center gap-0.5 bg-none border-none px-3 py-1 font-body text-[10px] font-semibold transition-colors duration-fast ${
              active ? 'text-accent' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-[22px] h-[22px]" />
            {tab.label}
          </Link>
        );
      })}

      <Link
        href="/dashboard/agent/listings/new"
        aria-label="Post property"
        className="w-14 h-14 border-none rounded-full bg-accent text-accent-foreground grid place-items-center shadow-xl -mt-5 transition-transform duration-normal ease-spring active:scale-95"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </Link>
    </nav>
  );
}
