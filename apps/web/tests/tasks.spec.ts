import { test, expect } from '@playwright/test';

test.describe('Tasks flow (unauth placeholder)', () => {
  test('tasks page requires auth (redirects to login or renders)', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    // Page should either show login or tasks header depending on session
    const header = page.getByRole('heading', { name: /Tasks/i });
    await expect(header.or(page.getByRole('heading', { name: /Welcome Back/i }))).toBeVisible();
  });
});


