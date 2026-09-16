import type { Metadata } from 'next';
import PropertyDetailClient from '@/components/listings/PropertyDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com';

async function fetchListing(id: string) {
  try {
    const res = await fetch(`${API_BASE}/listings/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await fetchListing(params.id);
  if (!listing) {
    return {
      title: 'Property Not Found — Homewolves',
      description: 'This property could not be found on Homewolves.',
    };
  }

  const location = (listing.locationJson ?? {}) as Record<string, string>;
  const meta = [
    listing.title,
    location?.city && location?.state ? `${location.city}, ${location.state}` : null,
    'Nigeria',
  ]
    .filter(Boolean)
    .join(' · ');

  const image = listing.media?.[0]?.url;

  return {
    title: `${meta} — Homewolves`,
    description: listing.description?.slice(0, 160) ?? `Browse ${listing.title} on Homewolves.`,
    keywords: ['real estate', 'Nigeria', listing.propertyType, listing.category, 'property'],
    openGraph: {
      title: meta,
      description: listing.description?.slice(0, 160),
      type: 'website',
      url: `${SITE_URL}/properties/${params.id}`,
      ...(image ? { images: [{ url: image, alt: listing.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: meta,
      description: listing.description?.slice(0, 160),
      ...(image ? { images: [image] } : {}),
    },
  };
}

function jsonLd(listing: any) {
  const location = (listing.locationJson ?? {}) as Record<string, string>;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.media?.map((m: any) => m.url) ?? [],
    sku: listing.id,
    brand: { '@type': 'Brand', name: 'Homewolves' },
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency ?? 'NGN',
      availability: listing.status === 'ACTIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/properties/${listing.id}`,
    },
    ...(location?.address || location?.city
      ? {
          additionalProperty: [
            { '@type': 'PropertyValue', name: 'location', value: location?.address ?? location?.city },
            ...(location?.city ? [{ '@type': 'PropertyValue', name: 'city', value: location.city }] : []),
            ...(location?.state ? [{ '@type': 'PropertyValue', name: 'state', value: location.state }] : []),
          ],
        }
      : {}),
  };
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const listing = await fetchListing(params.id);

  return (
    <>
      {listing && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(listing)) }}
        />
      )}
      <PropertyDetailClient initialListing={listing ?? undefined} />
    </>
  );
}
