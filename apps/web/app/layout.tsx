import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { QueryProvider } from '@/components/shared/QueryProvider';
import { ToastProvider } from '@/components/shared/Toast';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';

async function getBrandConfig(): Promise<BrandConfig | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'}/config/brand`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  const ogImage = brand?.ogImageUrl || '/og-image.png';
  const companyName = brand?.companyName || 'Homewolves';
  const tagline = brand?.tagline || 'African Real Estate Operating System';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${companyName} — ${tagline}`,
      template: `%s — ${companyName}`,
    },
    description: 'Discover, verify, and transact real estate across Africa. Homewolves is the platform for agents, buyers, developers, and homeowners.',
    keywords: ['real estate', 'Nigeria', 'Africa', 'property', 'agent CRM', 'PropTech'],
    authors: [{ name: companyName }],
    creator: companyName,
    openGraph: {
      type: 'website',
      locale: 'en_NG',
      url: SITE_URL,
      siteName: companyName,
      title: `${companyName} — ${tagline}`,
      description: 'Discover, verify, and transact real estate across Africa.',
      images: [{ url: `${SITE_URL}${ogImage}`, width: 1200, height: 630, alt: companyName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${companyName} — ${tagline}`,
      description: 'Discover, verify, and transact real estate across Africa.',
      images: [`${SITE_URL}${ogImage}`],
    },
    alternates: { canonical: SITE_URL },
    robots: { index: true, follow: true },
    icons: { icon: brand?.faviconUrl || '/favicon.ico' },
  };
}

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
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
