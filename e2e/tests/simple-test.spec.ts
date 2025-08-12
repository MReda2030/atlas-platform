import { test, expect } from '@playwright/test';

test('simple test - homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Atlas/);
});

test('simple test - login page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/auth/login');
  await expect(page.locator('h1')).toContainText(/Sign in|Login/i);
});