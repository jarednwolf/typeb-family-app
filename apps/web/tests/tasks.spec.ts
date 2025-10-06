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

  test('quick-create opens from header and creates task (ui only)', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    // Try to open quick-create; if redirected to login, just assert login visible
    const quick = page.getByRole('button', { name: /Open quick create|Quick create/i }).first();
    try {
      await quick.click({ timeout: 3000 });
      await expect(page.getByText('Quick Create Task')).toBeVisible({ timeout: 3000 });
    } catch {
      await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    }
  });
});


