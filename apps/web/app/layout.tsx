import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { QueryProvider } from '@/components/shared/QueryProvider';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Homewolves — African Real Estate Operating System',
    template: '%s — Homewolves',
  },
  description: 'Discover, verify, and transact real estate across Africa. Homewolves is the platform for agents, buyers, developers, and homeowners.',
  keywords: ['real estate', 'Nigeria', 'Africa', 'property', 'agent CRM', 'PropTech'],
  authors: [{ name: 'Homewolves' }],
  creator: 'Homewolves',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: SITE_URL,
    siteName: 'Homewolves',
    title: 'Homewolves — African Real Estate Operating System',
    description: 'Discover, verify, and transact real estate across Africa.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Homewolves' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Homewolves — African Real Estate Operating System',
    description: 'Discover, verify, and transact real estate across Africa.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};

export const viewport = {
  themeColor: '#1A3A5C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
