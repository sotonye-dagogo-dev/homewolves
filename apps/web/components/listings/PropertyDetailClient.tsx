'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Share2, Heart, Home, BedDouble, Bath, Maximize2, Calendar, Map, Check, Zap, ArrowLeft, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useListing, useListings } from '@/hooks/use-listings';
import { useCheckSaved, useToggleSave, useRecentViews } from '@/hooks/use-interactions';
import { useAuth } from '@/hooks/use-auth';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { recordView } from '@/lib/interactions';
import { ScheduleInspectionModal } from '@/components/shared/ScheduleInspectionModal';
import { formatPrice } from '@/lib/format-price';
import Link from 'next/link';

function emitToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hw-toast', { detail: { message, type } }));
  }
}

async function handleShare(title: string) {
  try {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && (navigator as unknown as { share?: (d: { title: string; url: string }) => Promise<void> }).share) {
      await (navigator as unknown as { share: (d: { title: string; url: string }) => Promise<void> }).share({ title, url });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      emitToast('Link copied to clipboard', 'success');
      return;
    }
    emitToast(url, 'info');
  } catch {
    /* user dismissed share sheet — no-op */
  }
}

export default function PropertyDetailClient({ initialListing }: { initialListing?: unknown }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading } = useListing(id, initialListing);
  const { data: similarData } = useListings({ take: '6' });

  const { user, accessToken } = useAuth();
  const { requireAuth } = useRequireAuth('/messages');
  const { data: savedCheck } = useCheckSaved(id);
  const isSaved = savedCheck?.saved ?? false;
  const toggleSaveMutation = useToggleSave();
  const { data: recentViews } = useRecentViews();

  const [galleryIdx, setGalleryIdx] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

  useEffect(() => { if (isSaved != null) setSaved(isSaved); }, [isSaved]);

  useEffect(() => {
    recordView(id, user?.id).catch(() => {});
  }, [id, user?.id]);

  const handleToggleSave = () => {
    if (!accessToken) { router.push('/auth'); return; }
    setSaved((p) => !p);
    toggleSaveMutation.mutate(id);
  };

  const media = listing?.media ?? [];
  const currentImage = media[galleryIdx];
  const location = (listing?.locationJson ?? {}) as any;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--color-bg-base)' }}>
        <Search className="w-10 h-10" style={{ color: 'var(--color-text-muted)' }} />
        <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Property not found</p>
        <Link href="/properties" className="btn-primary text-sm">Browse properties</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      <a href="#detail-main" className="skip-link">Skip to content</a>

      {/* ─── Detail sub-header — sits BELOW the global TopNav (sticky at
          top-14 / lg:top-16) so it never clashes with the main navbar.
          Single bar for mobile + desktop: back action, truncated title,
          share/save. No brand logo here — the global nav already owns it. ─── */}
      <div
        className="sticky top-14 lg:top-16 z-40 flex items-center justify-between gap-3 px-4 lg:px-10 py-2.5"
        style={{
          background: 'var(--color-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--color-border-glass)',
        }}
      >
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm shrink-0 min-w-0" style={{ color: 'var(--color-text-secondary)' }} aria-label="Back to properties">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline font-medium">Back</span>
        </button>
        <span className="text-sm font-semibold truncate flex-1 text-center min-w-0" style={{ color: 'var(--color-text-primary)' }}>
          {listing.title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => handleShare(listing?.title ?? 'Property')} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ color: 'var(--color-text-secondary)' }} aria-label="Share this property"><Share2 className="w-4 h-4" /></button>
          <button
            onClick={handleToggleSave}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ color: saved ? 'var(--color-error)' : 'var(--color-text-secondary)' }}
            aria-label={saved ? 'Remove from saved' : 'Save this property'}
            aria-pressed={saved}
          >
            <Heart className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ─── §4.3 Zone 1 — Image Gallery (desktop constrained to ~80% viewport) ─── */}
      <section className="gallery mx-auto w-full lg:w-[80%] lg:max-w-[1080px] lg:pt-6 lg:px-0" aria-label="Property images">
        <div className="relative w-full overflow-hidden aspect-[4/3] lg:aspect-[16/9] lg:rounded-2xl lg:border lg:shadow-sm lg:max-h-[72vh]" style={{ borderColor: 'var(--color-border-subtle)' }}>
          {currentImage?.url ? (
            <Image src={currentImage.url} alt={listing.title} fill className="object-cover" sizes="(min-width: 1024px) 80vw, 100vw" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-brand-primary)', color: 'white' }}>
              <Home className="w-12 h-12" />
            </div>
          )}

          {media.length > 1 && (
            <>
              <button
                onClick={() => setGalleryIdx((p) => (p - 1 + media.length) % media.length)}
                className="gallery-nav-btn prev absolute top-1/2 -translate-y-1/2 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-inverse)' }}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGalleryIdx((p) => (p + 1) % media.length)}
                className="gallery-nav-btn next absolute top-1/2 -translate-y-1/2 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-inverse)' }}
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots — mobile */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2 lg:hidden">
                {media.map((_: any, i: number) => (
                  <span
                    key={i}
                    className="block rounded-full transition-all"
                    style={{
                      width: i === galleryIdx ? '24px' : '8px',
                      height: '8px',
                      background: i === galleryIdx ? 'var(--color-brand-accent)' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            </>
          )}

          <span
            className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--color-bg-glass-dark)', color: 'var(--color-text-inverse)' }}
          >
            {galleryIdx + 1}/{media.length || 1}
          </span>
        </div>

        {/* Thumbnail strip — desktop */}
        {media.length > 1 && (
          <div className="hidden lg:flex gap-2 py-3 justify-center overflow-x-auto">
            {media.map((m: any, i: number) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                className="relative shrink-0 rounded overflow-hidden transition-all cursor-pointer"
                style={{
                  width: '80px',
                  aspectRatio: '16/9',
                  opacity: i === galleryIdx ? 1 : 0.5,
                  border: i === galleryIdx ? '2px solid var(--color-brand-accent)' : '2px solid transparent',
                }}
              >
                {m.url ? (
                  <Image src={m.url} alt="" fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-border-subtle)' }}><Home className="w-5 h-5" /></div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ─── §4.3 Zone 2 — Mobile Sticky Action Bar (sits above MobileBar) ─── */}
      <div
        className="lg:hidden fixed left-0 right-0 z-40 flex items-center gap-3 px-4 py-3"
        style={{
          bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--color-bg-glass)',
          backdropFilter: 'var(--glass-blur-heavy)',
          borderTop: '1px solid var(--color-border-glass)',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="shrink-0" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-accent)' }}>
          {formatPrice(listing.price, listing.currency ?? 'NGN')}
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-text-muted)' }}>/{listing.category === 'RENT' ? 'yr' : ''}</span>
        </div>
        <div className="flex-1 flex justify-end gap-2">
          <button onClick={handleToggleSave} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: saved ? 'var(--color-error)' : 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: saved ? 'white' : 'var(--color-text-primary)' }}>
            <Heart className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => handleShare(listing.title)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-primary)' }} aria-label="Share">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={() => { if (requireAuth('Messaging')) router.push('/messages'); }} className="px-4 py-2 rounded-full text-xs font-semibold" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)', boxShadow: 'var(--shadow-sm)' }}>
            Chat Agent
          </button>
        </div>
      </div>

      {/* ─── Main content area ─── */}
      <main
        id="detail-main"
        style={{
          padding: 'var(--space-4)',
          paddingBottom: 'calc(var(--space-4) + 190px)',
          maxWidth: '1280px',
          margin: '0 auto',
          overflowX: 'hidden',
        }}
      >
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* ─── Left / Main Column ─── */}
          <div className="flex flex-col gap-8">

            {/* Breadcrumb (desktop) */}
            <div className="hidden lg:block text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
              <span className="mx-1">/</span>
              <Link href="/properties" style={{ color: 'var(--color-text-muted)' }}>Properties</Link>
              <span className="mx-1">/</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{listing.title}</span>
            </div>

            {/* ─── §4.3 Zone 2 — Desktop Action Bar ─── */}
            <div className="hidden lg:flex items-center justify-between gap-4 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-accent)' }}>
                {formatPrice(listing.price, listing.currency ?? 'NGN')}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 400, color: 'var(--color-text-muted)' }}> / {listing.category === 'RENT' ? 'yr' : 'sale'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleToggleSave} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ color: saved ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
                  <Heart className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => handleShare(listing.title)} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ color: 'var(--color-text-secondary)' }} aria-label="Share">
                  <Share2 className="w-5 h-5" />
                </button>
                <button onClick={() => { if (requireAuth('Scheduling inspections')) setInspectionModalOpen(true); }} className="px-6 py-3 rounded-full text-sm font-semibold" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-primary)' }}>
                  Schedule Inspection
                </button>
                <button onClick={() => { if (requireAuth('Messaging')) router.push('/messages'); }} className="px-6 py-3 rounded-full text-sm font-semibold" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)', boxShadow: 'var(--shadow-sm)' }}>
                  Chat Agent
                </button>
              </div>
            </div>

            {/* ─── §4.3 Zone 4 — Verification Banner ─── */}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}
            >
              <Check className="w-5 h-5 shrink-0" />
              This property has been pre-verified. Schedule a viewing to confirm details.
            </div>

            {/* ─── §4.3 Zone 3 — Property Meta Row ─── */}
            <div className="flex gap-4 flex-wrap py-4">
              {[
                { icon: BedDouble, label: 'Bedrooms', value: listing.metadata?.beds ?? '—' },
                { icon: Bath, label: 'Bathrooms', value: listing.metadata?.baths ?? '—' },
                { icon: Maximize2, label: 'Size', value: listing.metadata?.size ? `${listing.metadata.size} sqm` : '—' },
                { icon: Home, label: 'Type', value: listing.propertyType },
                { icon: Calendar, label: 'Listed', value: new Date(listing.createdAt).toLocaleDateString() },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-border-subtle)' }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{m.value}</span> {m.label}
                  </div>
                </div>
                );
              })}
            </div>

            {/* ─── §4.3 Zone 5 — Description ─── */}
            <section className="flex flex-col gap-3">
              <h2 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Description</h2>
              <div
                className="text-base leading-relaxed"
                style={{
                  color: 'var(--color-text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: descExpanded ? 'unset' as any : 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {listing.description}
              </div>
              {listing.description?.length > 300 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="self-start px-3 py-1 rounded-full text-sm font-semibold transition-colors"
                  style={{ color: 'var(--color-brand-accent)' }}
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </section>

            {/* ─── §4.3 Zone 6 — Amenities Grid ─── */}
            <section className="flex flex-col gap-4">
              <h2 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Amenities</h2>
              {listing.amenityIds && listing.amenityIds.length > 0 ? (
                <div className="grid grid-cols-4 gap-3 lg:gap-4">
                  {listing.amenityIds.slice(0, 8).map((id: string) => (
                    <div
                      key={id}
                      className="flex flex-col items-center gap-1 p-3 text-center rounded-xl transition-shadow"
                      style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
                    >
                       <Check className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{id}</span>
                    </div>
                  ))}
                  {listing.amenityIds.length > 8 && (
                    <div
                      className="flex items-center justify-center rounded-xl font-bold text-lg"
                      style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                    >
                      +{listing.amenityIds.length - 8}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No amenities listed</p>
              )}
            </section>

            {/* ─── §4.3 Zone 7 — Location Map ─── */}
            <section className="flex flex-col gap-3">
              <h2 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Location</h2>
              <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                Neighborhood: <strong style={{ color: 'var(--color-text-primary)' }}>{location?.city ?? '—'}, {location?.state ?? ''}</strong>
              </p>
              <div
                className="w-full rounded-xl overflow-hidden relative flex items-center justify-center"
                style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #E8EDF2 0%, #D5DEE8 100%)' }}
              >
                <div className="text-center" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="flex justify-center mb-2"><Map className="w-10 h-10" /></div>
                  <p className="text-sm">Map integration</p>
                  <p className="text-xs mt-1">Powered by Mapbox / Google Maps</p>
                </div>
              </div>
            </section>

            {/* ─── §4.3 Zone 9 — Similar Properties ─── */}
            <section className="flex flex-col gap-4">
              <h2 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Similar Properties</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                {(similarData?.listings ?? []).slice(0, 5).map((s: any) => (
                  <Link
                    key={s.id}
                    href={`/properties/${s.id}`}
                    className="shrink-0 rounded-xl overflow-hidden transition-all cursor-pointer"
                    style={{ width: '240px', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="relative w-full" style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--color-border-subtle)' }}>
                        {s.media?.[0]?.url ? (
                        <Image src={s.media[0].url} alt="" fill className="object-cover" sizes="240px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-accent)' }}>
                        {s.currency} {parseFloat(s.price).toLocaleString()}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {s.metadata?.beds ? `${s.metadata.beds} bed` : ''} {s.metadata?.baths ? `· ${s.metadata.baths} bath` : ''}
                      </div>
                      <div className="text-sm font-semibold truncate mt-1" style={{ color: 'var(--color-text-primary)' }}>{s.title}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ─── §4.3 Zone 10 — Recently Viewed ─── */}
            <section className="flex flex-col gap-4">
              <h2 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>Recently Viewed</h2>
              {recentViews && recentViews.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                  {recentViews.slice(0, 5).map((s: any) => (
                    <Link
                      key={s.id}
                      href={`/properties/${s.id}`}
                      className="shrink-0 rounded-xl overflow-hidden transition-all cursor-pointer"
                      style={{ width: '240px', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-card)' }}
                    >
                      <div className="relative w-full" style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--color-border-subtle)' }}>
                        {s.media?.[0]?.url ? (
                          <Image src={s.media[0].url} alt="" fill className="object-cover" sizes="240px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6" /></div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-accent)' }}>
                          {formatPrice(s.price, s.currency ?? 'NGN')}
                        </div>
                        <div className="text-sm font-semibold truncate mt-1" style={{ color: 'var(--color-text-primary)' }}>{s.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Properties you view will appear here.</p>
              )}
            </section>
          </div>

          {/* ─── Right / Sidebar Column (desktop) ─── */}
          <div
            className="hidden lg:flex flex-col gap-6 lg:sticky lg:top-24 self-start w-full"
            style={{ maxHeight: 'none', overflowY: 'visible' }}
          >
            {/* ─── §4.3 Zone 8 — Agent Card ─── */}
            <div
              className="flex flex-col gap-4 p-5 rounded-xl"
              style={{
                background: 'var(--color-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--color-border-glass)',
                boxShadow: 'var(--shadow-glass)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: 'var(--color-brand-primary)', color: 'var(--color-text-inverse)' }}
                >
                  {listing.owner?.firstName?.[0]}{listing.owner?.lastName?.[0]}
                  <span
                    className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2"
                    style={{ background: 'var(--color-success)', borderColor: 'var(--color-bg-elevated)' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {listing.owner?.firstName} {listing.owner?.lastName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Licensed Agent</p>
                </div>
                <div className="flex gap-0.5" style={{ color: 'var(--color-brand-accent)' }}>
                  {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="w-4 h-4 fill-current" />))}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                  <Zap className="w-3 h-3" /> Responds quickly
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                  <Check className="w-3 h-3" /> Verified Agent
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { if (requireAuth('Messaging')) router.push('/messages'); }} className="flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>
                  Chat
                </button>
                <a href={listing.owner?.phone ? `tel:${listing.owner.phone}` : undefined} onClick={(e) => { if (!listing.owner?.phone) { e.preventDefault(); emitToast('Agent phone number is not available', 'info'); } }} className="flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all text-center" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', color: 'var(--color-text-primary)' }}>
                  Call
                </a>
              </div>
            </div>

            {/* ─── §4.3 Zone 11 — Transaction Progress Stepper ─── */}
            <div
              className="flex flex-col gap-3 p-5 rounded-xl"
              style={{
                background: 'var(--color-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--color-border-glass)',
                boxShadow: 'var(--shadow-glass)',
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Transaction</h3>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--color-status-active)', color: 'var(--color-text-inverse)' }}
                >
                  {listing.status}
                </span>
              </div>
              <div className="flex gap-1 justify-between relative py-2">
                <div className="absolute top-1/2 left-2 right-2 h-0.5 -translate-y-1/2 z-0" style={{ background: 'var(--color-border-default)' }} />
                {[
                  'Listed',
                  'Inquiry',
                  'Viewing',
                  'Offer',
                  'Inspection',
                  'Payment',
                  'Docs',
                  'Complete',
                ].map((label, i) => {
                  const completed = i < 2;
                  const active = i === 2;
                  return (
                    <div key={label} className="flex flex-col items-center gap-1 relative z-10 flex-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                        style={{
                          background: completed ? 'var(--color-status-complete)' : active ? 'var(--color-status-active)' : 'var(--color-bg-elevated)',
                          border: `2px solid ${completed || active ? 'transparent' : 'var(--color-border-default)'}`,
                          color: completed || active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                          boxShadow: active ? '0 0 0 4px rgba(5,150,105,0.2)' : 'none',
                        }}
                      >
                        {completed ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <span
                        className="text-[9px] text-center leading-tight"
                        style={{
                          color: active ? 'var(--color-text-primary)' : completed ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                          fontWeight: active ? 600 : 400,
                          maxWidth: '48px',
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ScheduleInspectionModal
        listingId={id}
        listingTitle={listing?.title ?? ''}
        open={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
      />
    </div>
  );
}
