'use client';

import { TopNav } from '@/components/landing/top-nav';
import { MobileBar } from '@/components/landing/mobile-bar';
import { Footer } from '@/components/landing/footer';
import { usePathname } from 'next/navigation';

const HIDE_FOOTER = ['/auth', '/properties'];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavOnAuth = pathname.startsWith('/auth');
  const hideFooter = HIDE_FOOTER.some((p) => pathname.startsWith(p));

  return (
    <>
      {!hideNavOnAuth && <TopNav />}
      <div className={hideNavOnAuth ? '' : 'pt-14 lg:pt-16'}>
        <div className="pb-[84px] lg:pb-0">{children}</div>
      </div>
      {!hideFooter && <Footer />}
      <MobileBar />
    </>
  );
}
