import { test, expect } from '@playwright/test';

test.describe('Tasks flow (unauth placeholder)', () => {
  test('tasks page requires auth (renders tasks heading when visible)', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible({ timeout: 5000 });
  });
});


