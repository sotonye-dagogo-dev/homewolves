import { test, expect } from '@playwright/test';

test.describe('landing page smoke', () => {
  test('homepage loads and renders headline', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Homewolves/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('main navigation is present without duplicate search', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Homewolves' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Properties' })).toBeVisible();
    // Issue 1: navbar search was removed — only the hero search remains.
    await expect(nav.getByRole('textbox', { name: 'Search properties' })).toHaveCount(0);
    await expect(page.getByRole('search').getByRole('textbox', { name: 'Search properties' })).toBeVisible();
  });

  test('hero search box navigates to properties page', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('search').getByRole('textbox', { name: 'Search properties' });
    await search.fill('lagos');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/properties/);
  });
});
