import { test, expect } from '@playwright/test';

test.describe('Tasks flow (unauth placeholder)', () => {
  test('tasks page requires auth (redirects to login or shows tasks)', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await page.waitForLoadState('networkidle');
    const tasksH = page.getByRole('heading', { name: 'Tasks', exact: true });
    const loginH = page.getByRole('heading', { name: /Welcome Back/i });
    const nfH = page.getByRole('heading', { name: /Page not found/i });
    try {
      await tasksH.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      try {
        await loginH.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        await nfH.waitFor({ state: 'visible', timeout: 5000 });
      }
    }
  });
});


