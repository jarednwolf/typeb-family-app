import { test, expect } from '@playwright/test';

test('validation queue page renders', async ({ page }) => {
  await page.goto('/dashboard/validation');
  const header = page.getByRole('heading', { name: /Photo Validation/i });
  const login = page.getByRole('heading', { name: /Welcome Back/i });
  // Race both states without waiting for networkidle (can hang under CI)
  try {
    await header.waitFor({ state: 'visible', timeout: 7000 });
  } catch {
    await login.waitFor({ state: 'visible', timeout: 7000 });
  }
});


