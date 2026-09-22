'use client';

import { useState, useCallback, useRef } from 'react';
import { usePropertyTypes, useAmenities } from '@/hooks/use-platform-config';
import { useCreateListing } from '@/hooks/use-listings';
import { CreateListingPayload } from '@/lib/listings';

type ListingCategory = 'SALE' | 'RENT' | 'SHORTLET' | 'LAND';

interface FormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  category: ListingCategory | '';
  propertyType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: string;
  longitude: string;
  amenityIds: string[];
  images: { file: File; preview: string; isPrimary: boolean }[];
}

const emptyForm: FormData = {
  title: '',
  description: '',
  price: '',
  currency: 'NGN',
  category: '',
  propertyType: '',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  latitude: '',
  longitude: '',
  amenityIds: [],
  images: [],
};

const steps = ['Details', 'Location', 'Media', 'Amenities', 'Review'];

const currencies = ['NGN', 'USD', 'GBP', 'EUR'];
const categories: { value: ListingCategory; label: string }[] = [
  { value: 'SALE', label: 'For Sale' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'SHORTLET', label: 'Shortlet' },
  { value: 'LAND', label: 'Land' },
];

export function ListingForm({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const createListing = useCreateListing();
  const { data: propertyTypes } = usePropertyTypes();
  const { data: amenities } = useAmenities();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!form.title && !!form.description && !!form.price && !!form.category && !!form.propertyType;
      case 1: return !!form.address && !!form.city && !!form.state;
      case 2: return form.images.length > 0;
      case 3: return form.amenityIds.length > 0;
      default: return true;
    }
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: form.images.length === 0 && i === 0,
    }));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      if (images.length > 0 && !images.some((img) => img.isPrimary) && images[0]) {
        images[0].isPrimary = true;
      }
      return { ...prev, images };
    });
  };

  const setPrimary = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  };

  const toggleAmenity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter((a) => a !== id)
        : [...prev.amenityIds, id],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (!form.category) return;
      const payload: CreateListingPayload = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        category: form.category as ListingCategory,
        propertyType: form.propertyType,
        locationJson: {
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        },
        amenityIds: form.amenityIds,
      };
      await createListing.mutateAsync(payload);
      setForm(emptyForm);
      setStep(0);
      onComplete?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{
                color: i <= step ? 'var(--color-brand-accent)' : 'var(--color-text-tertiary)',
                cursor: i < step ? 'pointer' : 'default',
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors"
                style={{
                  background: i <= step ? 'var(--color-brand-accent)' : 'var(--color-bg-elevated)',
                  color: i <= step ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
                }}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px" style={{ background: i < step ? 'var(--color-brand-accent)' : 'var(--color-border-default)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--color-bg-elevated)' }}>
        {/* Step 0: Details */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Property Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. 3-Bedroom Duplex in Ikoyi"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe the property..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => update('category', e.target.value as ListingCategory | '')}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Property Type *</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) => update('propertyType', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                  >
                    <option value="">Select type</option>
                    {propertyTypes?.map((pt: any) => (
                      <option key={pt.id} value={pt.id}>{pt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Price *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    placeholder="0.00"
                    min={0}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => update('currency', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Address *</label>
                <input
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street address"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>City *</label>
                  <input
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    placeholder="e.g. Lagos"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>State *</label>
                  <input
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    placeholder="e.g. Lagos"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Country</label>
                <input
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => update('latitude', e.target.value)}
                    placeholder="6.5244"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => update('longitude', e.target.value)}
                    placeholder="3.3792"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-default)' }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Media */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Media</h2>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                style={{ borderColor: 'var(--color-border-default)' }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-glass)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageAdd}
                  className="hidden"
                />
                <div className="space-y-2">
                  <div className="flex justify-center" style={{ color: 'var(--color-text-tertiary)' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Drop images here or click to browse
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    PNG, JPG, WebP up to 10MB each
                  </p>
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden group" style={{ aspectRatio: '4/3' }}>
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setPrimary(i)}
                          className={`px-2 py-1 rounded text-[10px] font-medium ${img.isPrimary ? '' : ''}`}
                          style={{
                            background: img.isPrimary ? 'var(--color-brand-accent)' : 'rgba(255,255,255,0.9)',
                            color: img.isPrimary ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                          }}
                        >
                          {img.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                        <button
                          onClick={() => removeImage(i)}
                          className="px-2 py-1 rounded text-[10px] font-medium"
                          style={{ background: 'var(--color-danger)', color: 'white' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Amenities */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Amenities</h2>
            {amenities && amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity: any) => {
                  const selected = form.amenityIds.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all"
                      style={{
                        background: selected ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
                        color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                        border: `1px solid ${selected ? 'var(--color-brand-accent)' : 'var(--color-border-default)'}`,
                      }}
                    >
                      <span>{amenity.icon ?? '•'}</span>
                      <span>{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {['Parking', 'Pool', 'Gym', 'Security', 'Generator', 'CCTV', 'Garden', 'Playground'].map((a) => {
                  const selected = form.amenityIds.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        background: selected ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
                        color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                        border: `1px solid ${selected ? 'var(--color-brand-accent)' : 'var(--color-border-default)'}`,
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Review & Submit</h2>
            <div className="space-y-4">
              <div className="rounded-lg p-4 space-y-3 text-sm" style={{ background: 'var(--color-bg-glass)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Title</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium">{form.title}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Category</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium">{categories.find(c => c.value === form.category)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Type</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium">{form.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Price</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium">{form.currency} {parseFloat(form.price || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Location</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium text-right">{form.city}, {form.state}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Images</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium">{form.images.length} uploaded</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>Amenities</span>
                  <span style={{ color: 'var(--color-text-primary)' }} className="font-medium">{form.amenityIds.length} selected</span>
                </div>
              </div>

              {createListing.isError && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--color-danger-bg, #fef2f2)', color: 'var(--color-danger)' }}>
                  {(createListing.error as Error)?.message ?? 'Failed to create listing'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="btn-outline"
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="btn-primary"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || createListing.isPending}
            className="btn-primary"
          >
            {submitting ? 'Submitting...' : 'Publish Listing'}
          </button>
        )}
      </div>
    </div>
  );
}
