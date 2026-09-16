import { TopNav } from '@/components/landing/top-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { StatsStrip } from '@/components/landing/stats-strip';
import { CategoryBento } from '@/components/landing/category-bento';
import { FeaturedListings } from '@/components/landing/featured-listings';
import { HowItWorks } from '@/components/landing/how-it-works';
import { AgentCta } from '@/components/landing/agent-cta';
import { BlogSection } from '@/components/landing/blog-section';
import { Footer } from '@/components/landing/footer';
import { MobileBar } from '@/components/landing/mobile-bar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Homewolves',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'African real estate operating system — discover, verify, and transact real estate across Africa.',
  sameAs: [],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>

      <TopNav />

      <main id="main-content">
        <HeroSection />
        <StatsStrip />
        <CategoryBento />
        <FeaturedListings />
        <HowItWorks />
        <AgentCta />
        <BlogSection />
        <Footer />
      </main>

      <MobileBar />
    </>
  );
}
