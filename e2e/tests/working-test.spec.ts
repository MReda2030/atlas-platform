import { test, expect } from '@playwright/test';

test.describe('Working Tests', () => {
  test('login flow test', async ({ page }) => {
    // Disable waiting for load state
    page.setDefaultTimeout(5000);
    
    // Go to login page with minimal wait
    await page.goto('http://localhost:3000/auth/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    
    // Fill form without waiting for specific selectors
    await page.locator('input[type="email"]').fill('admin@atlas.com', { timeout: 2000 });
    await page.locator('input[type="password"]').fill('admin123', { timeout: 2000 });
    
    // Click submit
    await page.locator('button[type="submit"]').click({ timeout: 2000 });
    
    // Wait a bit for navigation
    await page.waitForTimeout(2000);
    
    // Check if we're on dashboard
    const url = page.url();
    console.log('Current URL:', url);
    
    // Basic assertion
    expect(url).toContain('dashboard');
  });
});