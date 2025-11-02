import { test, expect } from '@playwright/test';

test.describe('Analytics page auth guard and upsell', () => {
  test('renders for e2e bypass without redirect to login', async ({ page }) => {
    await page.goto('/dashboard/analytics?e2e=1');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });

  test('non-premium shows Upgrade modal from banner', async ({ page }) => {
    await page.goto('/dashboard/analytics?e2e=1');
    await page.getByRole('button', { name: /Upgrade/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Upgrade to Premium/i })).toBeVisible();
  });
});


