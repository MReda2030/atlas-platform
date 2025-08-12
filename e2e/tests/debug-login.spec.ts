import { test, expect } from '@playwright/test';

test('debug login error', async ({ page }) => {
  page.setDefaultTimeout(5000);
  
  // Go to login page
  await page.goto('http://localhost:3000/auth/login', { 
    waitUntil: 'domcontentloaded',
    timeout: 5000 
  });
  
  // Fill form
  await page.locator('input[type="email"]').fill('admin@atlas.com');
  await page.locator('input[type="password"]').fill('admin123');
  
  // Listen for console messages
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  
  // Listen for any alerts
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.accept();
  });
  
  // Click submit
  await page.locator('button[type="submit"]').click();
  
  // Wait for either navigation or error
  await page.waitForTimeout(3000);
  
  // Check for error messages
  const errorElement = page.locator('[role="alert"], .error, .text-red-600, .text-red-500');
  const hasError = await errorElement.count() > 0;
  
  if (hasError) {
    const errorText = await errorElement.first().textContent();
    console.log('Error found:', errorText);
  }
  
  // Check current URL
  const url = page.url();
  console.log('Final URL:', url);
  
  // Get page text content
  const bodyText = await page.locator('body').textContent();
  if (bodyText?.includes('error') || bodyText?.includes('Error')) {
    console.log('Page contains error text');
  }
});