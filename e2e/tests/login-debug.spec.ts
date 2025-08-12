import { test, expect } from '@playwright/test';

test('debug login page elements', async ({ page }) => {
  page.setDefaultNavigationTimeout(5000);
  page.setDefaultTimeout(5000);
  
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'domcontentloaded' });
  
  // Check for various possible heading elements
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Headings found:', headings);
  
  // Check for form elements
  const emailInput = await page.locator('input[type="email"]').count();
  const passwordInput = await page.locator('input[type="password"]').count();
  const submitButton = await page.locator('button[type="submit"]').count();
  
  console.log('Email inputs:', emailInput);
  console.log('Password inputs:', passwordInput);
  console.log('Submit buttons:', submitButton);
  
  // Check button text
  if (submitButton > 0) {
    const buttonText = await page.locator('button[type="submit"]').textContent();
    console.log('Submit button text:', buttonText);
  }
  
  expect(emailInput).toBeGreaterThan(0);
  expect(passwordInput).toBeGreaterThan(0);
  expect(submitButton).toBeGreaterThan(0);
});