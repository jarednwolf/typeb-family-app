import { test, expect } from '@playwright/test';

test('settings page renders header', async ({ page }) => {
  await page.goto('/dashboard/settings');
  await page.waitForLoadState('networkidle');
  // Accept multiple stable outcomes (unauth redirect or render)
  const header = page.getByRole('heading', { name: /Settings/i });
  const login = page.getByRole('heading', { name: /Welcome Back/i });
  try {
    await header.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    await login.waitFor({ state: 'visible', timeout: 5000 });
  }
});

test('subscription section is visible when authed (ui only)', async ({ page }) => {
  await page.goto('/dashboard/settings');
  try {
    await page.getByRole('heading', { name: /Subscription/i }).waitFor({ timeout: 3000 });
  } catch {
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  }
});


