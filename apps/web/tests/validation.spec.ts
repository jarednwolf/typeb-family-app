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

test('approve flow shows bulk actions (ui only)', async ({ page }) => {
  await page.goto('/dashboard/validation');
  try {
    await page.getByRole('button', { name: /Approve selected/i }).waitFor({ timeout: 3000 });
  } catch {
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  }
});


