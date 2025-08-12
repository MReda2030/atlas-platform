import { test, expect } from '@playwright/test';

test('quick navigation test', async ({ page }) => {
  // Set a shorter navigation timeout
  page.setDefaultNavigationTimeout(5000);
  
  try {
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');
    
    // Check if we have any content
    const body = await page.locator('body').textContent();
    console.log('Body content length:', body?.length);
    
    expect(body?.length).toBeGreaterThan(0);
  } catch (error) {
    console.error('Navigation failed:', error);
    throw error;
  }
});