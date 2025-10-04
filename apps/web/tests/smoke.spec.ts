import { test, expect } from '@playwright/test';

test('landing loads and has CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Start Free Trial/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Sign In/i })).toBeVisible();
});

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
});

test('signup with invite shows form', async ({ page }) => {
  await page.goto('/signup?invite=ABCDEF');
  await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();
});


