import { test, expect } from '@playwright/test';

const ADMIN_SESSION = {
  state: {
    accessToken: 'admin-access-token',
    user: {
      id: 'u-admin',
      email: 'admin@homewolves.africa',
      firstName: 'Amina',
      lastName: 'Bello',
      role: 'ADMIN',
      verified: true,
    },
  },
  version: 0,
};

const BUYER_SESSION = {
  state: {
    accessToken: 'buyer-access-token',
    user: {
      id: 'u-buyer',
      email: 'buyer@example.com',
      firstName: 'Bola',
      lastName: 'Ade',
      role: 'BUYER',
      verified: true,
    },
  },
  version: 0,
};

const PENDING_LISTING = {
  id: 'l-1',
  title: 'Penthouse in Ikoyi',
  description: 'A luxury 4-bedroom penthouse with skyline views.',
  price: '350000000',
  propertyType: 'apartment',
  category: 'sale',
  status: 'pending',
  media: [{ url: 'https://img.example.com/penthouse.jpg' }],
  owner: { firstName: 'Chidi', lastName: 'Okeke' },
};

const PENDING_PAYMENT = {
  id: 'p-1',
  amount: '50000',
  currency: 'NGN',
  type: 'listing',
  status: 'pending',
  evidenceUrl: 'https://evidence.example.com/reciept.pdf',
  createdAt: '2026-08-19T10:00:00.000Z',
  transaction: {
    id: 't-1',
    buyer: { firstName: 'Bola', lastName: 'Ade' },
    listing: { id: 'l-1', title: 'Penthouse in Ikoyi', propertyType: 'apartment' },
  },
};

test.describe('admin moderation journey', () => {
  let pendingListings: unknown[];

  test.beforeEach(async ({ page }) => {
    pendingListings = [PENDING_LISTING];

    await page.addInitScript((session) => {
      localStorage.setItem('hw-auth', JSON.stringify(session));
    }, ADMIN_SESSION);

    await page.route('**/api/v1/notifications**', (route) =>
      route.fulfill({ json: { notifications: [], total: 0, count: 0 } }),
    );

    await page.route('**/api/v1/listings/admin/pending', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: pendingListings });
      }
      return route.fallback();
    });

    await page.route('**/api/v1/listings/*/moderate', async (route) => {
      const body = route.request().postDataJSON();
      expect(body.action).toMatch(/^(approve|reject)$/);
      pendingListings = [];
      await route.fulfill({ json: { success: true, status: body.action === 'approve' ? 'active' : 'rejected' } });
    });
  });

  test('admin sees the Moderation nav item and can open the queue', async ({ page }) => {
    await page.goto('/dashboard');
    const moderationLink = page.getByRole('link', { name: 'Moderation', exact: true });
    await expect(moderationLink).toBeVisible();
    await moderationLink.click();
    await expect(page.getByRole('heading', { name: 'Moderation Queue' })).toBeVisible();
  });

  test('admin approves a pending listing and the queue empties', async ({ page }) => {
    await page.goto('/dashboard/admin/moderation');
    await expect(page.getByText('Penthouse in Ikoyi')).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('All caught up!')).toBeVisible({ timeout: 10_000 });
  });

  test('admin rejects a pending listing and the queue empties', async ({ page }) => {
    await page.goto('/dashboard/admin/moderation');
    await expect(page.getByText('Penthouse in Ikoyi')).toBeVisible();
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText('All caught up!')).toBeVisible({ timeout: 10_000 });
  });

  test('a non-admin does not see the Moderation nav item', async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('hw-auth', JSON.stringify(session));
    }, BUYER_SESSION);
    await page.goto('/dashboard');
    await expect(page.getByText('Moderation', { exact: true })).toHaveCount(0);
  });
});

test.describe('admin payment review journey', () => {
  let pendingPayments: unknown[];

  test.beforeEach(async ({ page }) => {
    pendingPayments = [PENDING_PAYMENT];

    await page.addInitScript((session) => {
      localStorage.setItem('hw-auth', JSON.stringify(session));
    }, ADMIN_SESSION);

    await page.route('**/api/v1/notifications**', (route) =>
      route.fulfill({ json: { notifications: [], total: 0, count: 0 } }),
    );

    await page.route('**/api/v1/transactions/payments/pending', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: pendingPayments });
      }
      return route.fallback();
    });

    await page.route('**/api/v1/transactions/payments/confirm', async (route) => {
      const body = route.request().postDataJSON();
      expect(body.paymentId).toBe('p-1');
      expect(body.status).toMatch(/^(confirmed|rejected)$/);
      expect(body.confirmedBy).toBe('admin');
      pendingPayments = [];
      await route.fulfill({ json: { success: true, status: body.status } });
    });
  });

  test('admin confirms a pending payment and the review list empties', async ({ page }) => {
    await page.goto('/dashboard/admin/payments');
    await expect(page.getByRole('heading', { name: 'Payment Review' })).toBeVisible();
    await expect(page.getByText('Penthouse in Ikoyi')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.getByText('No payments to review')).toBeVisible({ timeout: 10_000 });
  });

  test('admin rejects a pending payment and the review list empties', async ({ page }) => {
    await page.goto('/dashboard/admin/payments');
    await expect(page.getByText('Penthouse in Ikoyi')).toBeVisible();
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await expect(page.getByText('No payments to review')).toBeVisible({ timeout: 10_000 });
  });
});