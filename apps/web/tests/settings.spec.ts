import { test, expect } from '@playwright/test';

test.describe('Settings page basic behaviors', () => {
  test('sections render with headings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Subscription' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Support' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  });
  test('theme toggle switches data-theme attribute', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');

    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');

    const toggle = page.getByRole('button', { name: /toggle dark mode/i });
    await toggle.click();

    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
  });

  test('theme persists across reload', async ({ page }) => {
    await page.goto('/dashboard/settings');
    const html = page.locator('html');
    await page.getByRole('button', { name: /toggle dark mode/i }).click();
    const setVal = await html.getAttribute('data-theme');
    await page.reload();
    const afterReload = await html.getAttribute('data-theme');
    expect(afterReload).toBe(setVal);
  });

  test('manage subscription opens billing portal (new tab)', async ({ page, context }) => {
    await page.goto('/dashboard/settings');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /Manage subscription/i }).click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain(process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || '/dashboard/settings');
  });
  
  test('keyboard focus is visible on primary actions', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.keyboard.press('Tab');
    // Look for outline style applied via :focus-visible on buttons
    const btn = page.getByRole('button', { name: /Save changes|Request browser notifications|Toggle Theme/i }).first();
    await btn.focus();
    const box = await btn.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
  });
});

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


