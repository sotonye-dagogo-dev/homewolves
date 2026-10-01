'use client';

import { TopNav } from '@/components/landing/top-nav';
import { MobileBar } from '@/components/landing/mobile-bar';
import { Footer } from '@/components/landing/footer';
import { usePathname } from 'next/navigation';

const HIDE_FOOTER = ['/properties'];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = HIDE_FOOTER.some((p) => pathname.startsWith(p));

  return (
    <>
      <TopNav />
      <div className="pt-14 lg:pt-16 min-w-0 overflow-x-clip">
        {/* Bottom padding reserves space for the fixed mobile bar (+ iOS safe-area) */}
        <div className="pb-[96px] lg:pb-0">{children}</div>
      </div>
      {!hideFooter && <Footer />}
      <MobileBar />
    </>
  );
}
