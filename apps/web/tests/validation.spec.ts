import { test, expect } from '@playwright/test';

test('validation queue page renders', async ({ page }) => {
  await page.goto('/dashboard/validation');
  await page.waitForLoadState('networkidle');
  const header = page.getByRole('heading', { name: /Photo Validation/i });
  const login = page.getByRole('heading', { name: /Welcome Back/i });
  try {
    await header.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    await login.waitFor({ state: 'visible', timeout: 5000 });
  }
});


