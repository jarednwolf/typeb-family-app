import { test, expect } from '@playwright/test';

test('landing loads and has CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-analytics="hero-cta-start-trial"]')).toBeVisible();
  await expect(page.locator('[data-analytics="hero-cta-login"]')).toBeVisible();
});

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
});

test('signup with invite shows form', async ({ page }) => {
  await page.goto('/signup?invite=ABCDEF');
  await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();
});


