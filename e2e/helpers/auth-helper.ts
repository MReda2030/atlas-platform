import { Page, expect } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

export class AuthHelper {
  constructor(private page: Page) {}

  async login(userType: 'admin' | 'mediaBuyer' = 'admin') {
    const user = userType === 'admin' ? testUsers.admin : testUsers.mediaBuyer;
    
    // Navigate to login page
    await this.page.goto('/auth/login');
    
    // Fill login form
    await this.page.fill('input[type="email"]', user.email);
    await this.page.fill('input[type="password"]', user.password);
    
    // Submit form and wait for navigation
    await Promise.all([
      this.page.waitForURL('**/dashboard', { timeout: 30000, waitUntil: 'networkidle' }),
      this.page.click('button[type="submit"]')
    ]);
    
    // Additional wait for page to fully load
    await this.page.waitForLoadState('networkidle');
    
    // Verify login success
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  async logout() {
    // Click on user menu or logout button
    const logoutButton = this.page.locator('button:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try to find user menu first
      const userMenu = this.page.locator('[data-testid="user-menu"]').first();
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page.click('button:has-text("Logout")');
      }
    }
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/auth/login', { timeout: 10000 });
  }

  async verifyLoggedIn() {
    // Check if user is on dashboard or authenticated page
    const url = this.page.url();
    expect(url).not.toContain('/auth/login');
    expect(url).toMatch(/\/(dashboard|media|sales|admin|analytics)/);
  }

  async verifyLoggedOut() {
    // Check if user is redirected to login page
    await expect(this.page).toHaveURL(/.*auth\/login/);
  }

  async attemptInvalidLogin() {
    await this.page.goto('/auth/login');
    await this.page.fill('input[type="email"]', testUsers.invalidUser.email);
    await this.page.fill('input[type="password"]', testUsers.invalidUser.password);
    await this.page.click('button[type="submit"]');
    
    // Should see error message - matching the actual error text from login page
    await expect(this.page.locator('text=/Invalid email or password|Login failed/i')).toBeVisible();
  }

  async checkAccessControl(userType: 'admin' | 'mediaBuyer') {
    if (userType === 'admin') {
      // Admin should have access to admin pages
      await this.page.goto('/admin');
      await expect(this.page).not.toHaveURL(/.*auth\/login/);
      await expect(this.page.locator('h1:has-text("Admin")')).toBeVisible();
    } else {
      // Media buyer should not have access to admin pages
      await this.page.goto('/admin');
      // Should be redirected or see access denied
      const isRedirected = this.page.url().includes('/dashboard') || this.page.url().includes('/auth/login');
      const hasAccessDenied = await this.page.locator('text=/Access Denied|Unauthorized|Forbidden/i').isVisible();
      expect(isRedirected || hasAccessDenied).toBeTruthy();
    }
  }
}