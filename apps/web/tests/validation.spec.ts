import { test, expect } from '@playwright/test';

test('validation queue page renders', async ({ page }) => {
  await page.goto('/dashboard/validation');
  await expect(page.getByRole('heading', { name: /Photo Validation/i })).toBeVisible();
});


