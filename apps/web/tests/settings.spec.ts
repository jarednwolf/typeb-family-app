import { test, expect } from '@playwright/test';

test('settings page renders header', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
});


