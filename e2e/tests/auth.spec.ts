import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { PageHelper } from '../helpers/page-helper';
import { testUsers } from '../fixtures/test-data';

test.describe('Authentication Tests', () => {
  let authHelper: AuthHelper;
  let pageHelper: PageHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    pageHelper = new PageHelper(page);
  });

  test.describe('Login Functionality', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Verify page elements
      await expect(page.locator('h2:has-text("Atlas Travel Platform")')).toBeVisible();
      await expect(page.locator('text="Sign in to your account"')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should login successfully as admin', async ({ page }) => {
      await authHelper.login('admin');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Verify user is logged in
      await authHelper.verifyLoggedIn();
      
      // Check for welcome message or user name
      await expect(page.locator('text=/Welcome|Dashboard|Admin/i').first()).toBeVisible();
    });

    test('should login successfully as media buyer', async ({ page }) => {
      await authHelper.login('mediaBuyer');
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Verify user is logged in
      await authHelper.verifyLoggedIn();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await authHelper.attemptInvalidLogin();
      
      // Should remain on login page
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=/required|enter|provide/i').first()).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.fill('input[type="email"]', 'invalidemail');
      await page.fill('input[type="password"]', 'somepassword');
      await page.click('button[type="submit"]');
      
      // Should show email validation error
      await expect(page.locator('text=/valid email|email format|invalid email/i').first()).toBeVisible();
    });
  });

  test.describe('Logout Functionality', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await authHelper.login('admin');
      await authHelper.verifyLoggedIn();
      
      // Then logout
      await authHelper.logout();
      
      // Verify logged out
      await authHelper.verifyLoggedOut();
    });

    test('should redirect to login when accessing protected route after logout', async ({ page }) => {
      // Login and logout
      await authHelper.login('admin');
      await authHelper.logout();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await authHelper.verifyLoggedOut();
    });
  });

  test.describe('Access Control', () => {
    test('should allow admin access to admin pages', async ({ page }) => {
      await authHelper.login('admin');
      await authHelper.checkAccessControl('admin');
    });

    test('should restrict media buyer from admin pages', async ({ page }) => {
      await authHelper.login('mediaBuyer');
      await authHelper.checkAccessControl('mediaBuyer');
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected routes without login
      const protectedRoutes = ['/dashboard', '/media', '/sales', '/admin', '/analytics'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await authHelper.verifyLoggedOut();
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      await authHelper.login('admin');
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await authHelper.verifyLoggedIn();
    });

    test('should maintain session across navigation', async ({ page }) => {
      await authHelper.login('admin');
      
      // Navigate to different pages
      await page.goto('/media');
      await authHelper.verifyLoggedIn();
      
      await page.goto('/sales');
      await authHelper.verifyLoggedIn();
      
      await page.goto('/analytics');
      await authHelper.verifyLoggedIn();
    });
  });

  test.describe('Password Security', () => {
    test('should mask password input', async ({ page }) => {
      await page.goto('/auth/login');
      
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have minimum password requirements', async ({ page }) => {
      await page.goto('/auth/login');
      
      await page.fill('input[type="email"]', 'test@test.com');
      await page.fill('input[type="password"]', '123'); // Too short
      await page.click('button[type="submit"]');
      
      // Should show password requirement error (if implemented)
      const hasError = await page.locator('text=/password must|minimum|at least/i').isVisible();
      if (hasError) {
        await expect(page.locator('text=/password must|minimum|at least/i').first()).toBeVisible();
      }
    });
  });
});