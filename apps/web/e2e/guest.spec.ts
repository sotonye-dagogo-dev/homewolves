import { test, expect } from '@playwright/test';

test.describe('guest journey', () => {
  test('homepage loads with hero and nav', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Homewolves/);
    await expect(page.getByRole('heading', { level: 1, name: /Discover Your Next Home/ })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });

  test('guest can browse the blog', async ({ page }) => {
    await page.route('**/api/v1/blog*', (route) =>
      route.fulfill({
        json: {
          posts: [
            {
              id: 'p-1',
              slug: 'buying-in-lagos',
              title: 'Buying Property in Lagos',
              excerpt: 'A practical guide for first-time buyers.',
              category: 'Buying Guide',
              coverImage: null,
              publishedAt: '2026-08-01T00:00:00Z',
            },
          ],
          total: 1,
        },
      }),
    );
    await page.route('**/api/v1/blog/categories', (route) =>
      route.fulfill({ json: ['Buying Guide', 'Market News'] }),
    );
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Homewolves Blog' })).toBeVisible();
    await expect(page.getByText('Buying Property in Lagos')).toBeVisible();
  });

  test('guest can browse and search the properties listing', async ({ page }) => {
    await page.route('**/api/v1/listings*', (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('search');
      const listings = [
        {
          id: 'l-1',
          title: 'Modern 3-Bed Apartment in Lagos',
          description: 'Bright and airy',
          price: '250000',
          currency: 'USD',
          category: 'SALE',
          propertyType: 'Apartment',
          locationJson: { city: 'Lagos', state: 'Lagos' },
          media: [],
          viewCount: 12,
        },
        {
          id: 'l-2',
          title: 'Beach House in Accra',
          description: 'Sea view',
          price: '180000',
          currency: 'USD',
          category: 'SALE',
          propertyType: 'House',
          locationJson: { city: 'Accra', state: 'Greater Accra' },
          media: [],
          viewCount: 30,
        },
      ];
      const filtered = search
        ? listings.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()))
        : listings;
      route.fulfill({ json: { listings: filtered, total: filtered.length } });
    });
    await page.goto('/properties');
    await expect(page.getByText('Modern 3-Bed Apartment in Lagos')).toBeVisible();

    const searchBox = page.getByPlaceholder('Search properties...');
    await searchBox.fill('Beach');
    await expect(page.getByText('Beach House in Accra')).toBeVisible();
    await expect(page.getByText('Modern 3-Bed Apartment in Lagos')).toBeHidden();
  });

  test('guest can reach pricing, about, and faq pages', async ({ page }) => {
    // Use domcontentloaded: third-party assets (images/fonts) may never
    // settle and would otherwise hang the default "load" wait.
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/pricing/);
    await page.goto('/about', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole('heading', { name: 'About Homewolves' })).toBeVisible();
    await page.goto('/faq', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/faq/);
  });
});