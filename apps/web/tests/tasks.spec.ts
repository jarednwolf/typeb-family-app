import { test, expect } from '@playwright/test';

test.describe('Tasks flow (unauth placeholder)', () => {
  test('tasks page requires auth (redirects to login or shows tasks)', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.waitForLoadState('domcontentloaded');
    if (page.url().includes('/login')) {
      await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();
    }
  });
});


