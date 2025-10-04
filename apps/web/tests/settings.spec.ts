import { test, expect } from '@playwright/test';

test('settings page renders and shows profile section', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
  await expect(page.getByText(/Profile/i)).toBeVisible();
});


