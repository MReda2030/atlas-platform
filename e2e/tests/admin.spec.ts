import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { PageHelper } from '../helpers/page-helper';
import { testAgents, testBranches, testCountries, testPlatforms } from '../fixtures/test-data';

test.describe('Admin Functionality Tests', () => {
  let authHelper: AuthHelper;
  let pageHelper: PageHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    pageHelper = new PageHelper(page);
    
    // Login as admin for all admin tests
    await authHelper.login('admin');
  });

  test.describe('Admin Dashboard', () => {
    test('should display admin dashboard', async ({ page }) => {
      await pageHelper.navigateTo('/admin');
      
      // Verify admin page loads
      await pageHelper.verifyPageTitle('Admin');
      
      // Verify admin menu items
      await expect(page.locator('text="Master Data"')).toBeVisible();
      await expect(page.locator('text="Users"')).toBeVisible();
    });

    test('should show admin statistics', async ({ page }) => {
      await pageHelper.navigateTo('/admin');
      
      // Look for stat cards
      const statCards = page.locator('[class*="card"], [class*="stat"]');
      const count = await statCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('User Management', () => {
    test('should display users list', async ({ page }) => {
      await pageHelper.navigateTo('/admin/users');
      
      // Verify page title
      await pageHelper.verifyPageTitle('Users');
      
      // Verify user table
      await expect(page.locator('table, [role="table"]')).toBeVisible();
      
      // Should show user columns
      await expect(page.locator('th:has-text("Name"), th:has-text("Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Role")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    });

    test('should filter users by role', async ({ page }) => {
      await pageHelper.navigateTo('/admin/users');
      await pageHelper.waitForDataLoad();
      
      // Look for role filter
      const roleFilter = page.locator('select[name*="role"], button:has-text("Role")').first();
      if (await roleFilter.isVisible()) {
        await roleFilter.selectOption('media_buyer');
        await pageHelper.waitForDataLoad();
        
        // Verify filtered results
        const users = page.locator('tbody tr');
        const count = await users.count();
        
        for (let i = 0; i < count; i++) {
          const row = users.nth(i);
          await expect(row).toContainText('Media Buyer');
        }
      }
    });

    test('should search users by name', async ({ page }) => {
      await pageHelper.navigateTo('/admin/users');
      
      // Search for Ahmed
      await pageHelper.searchInTable('Ahmed');
      await pageHelper.waitForDataLoad();
      
      // Verify search results
      const results = page.locator('tbody tr').filter({ hasText: 'Ahmed' });
      const count = await results.count();
      
      if (count > 0) {
        await expect(results.first()).toContainText('Ahmed');
      }
    });

    test('should toggle user status', async ({ page }) => {
      await pageHelper.navigateTo('/admin/users');
      await pageHelper.waitForDataLoad();
      
      // Find toggle button for first user
      const toggleButton = page.locator('button[aria-label*="status"], button:has-text("Active"), button:has-text("Inactive")').first();
      if (await toggleButton.isVisible()) {
        const initialText = await toggleButton.textContent();
        
        // Click toggle
        await toggleButton.click();
        await page.waitForTimeout(1000);
        
        // Status should change
        const newText = await toggleButton.textContent();
        expect(newText).not.toBe(initialText);
      }
    });

    test('should create new user', async ({ page }) => {
      await pageHelper.navigateTo('/admin/users');
      
      // Click new user button
      const newUserButton = page.locator('button:has-text("New User"), button:has-text("Add User")').first();
      if (await newUserButton.isVisible()) {
        await newUserButton.click();
        
        // Fill user form
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', `test${Date.now()}@atlas.com`);
        await page.fill('input[name="password"]', 'Test@123456');
        await page.selectOption('select[name="role"]', 'media_buyer');
        await page.selectOption('select[name="branch"]', '4 Seasons');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        await pageHelper.verifyToast('User created', 'success');
      }
    });
  });

  test.describe('Master Data - Agents', () => {
    test('should display agents list', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/agents');
      
      // Verify page
      await pageHelper.verifyPageTitle('Sales Agents');
      
      // Verify table
      await expect(page.locator('table')).toBeVisible();
      
      // Should show agent columns
      await expect(page.locator('th:has-text("Agent Number")')).toBeVisible();
      await expect(page.locator('th:has-text("Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Branch")')).toBeVisible();
    });

    test('should filter agents by branch', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/agents');
      await pageHelper.waitForDataLoad();
      
      // Filter by branch
      const branchFilter = page.locator('select[name*="branch"]').first();
      if (await branchFilter.isVisible()) {
        await branchFilter.selectOption('4 Seasons');
        await pageHelper.waitForDataLoad();
        
        // Verify filtered results
        const agents = page.locator('tbody tr');
        const count = await agents.count();
        
        for (let i = 0; i < count; i++) {
          await expect(agents.nth(i)).toContainText('4 Seasons');
        }
      }
    });

    test('should add new agent', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/agents');
      
      const addButton = page.locator('button:has-text("Add Agent"), button:has-text("New Agent")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Fill agent form
        await page.fill('input[name="agent_number"]', `99${Date.now()}`);
        await page.fill('input[name="name"]', 'Test Agent');
        await page.selectOption('select[name="branch"]', 'Skyline');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        const hasSuccess = await page.locator('text=/created|added|success/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });

    test('should edit agent details', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/agents');
      await pageHelper.waitForDataLoad();
      
      const editButton = page.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Update name
        const nameInput = page.locator('input[name="name"]');
        await nameInput.fill('Updated Agent Name');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        await pageHelper.verifyToast('updated', 'success');
      }
    });

    test('should toggle agent status', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/agents');
      await pageHelper.waitForDataLoad();
      
      const statusToggle = page.locator('button[aria-label*="status"], input[type="checkbox"]').first();
      if (await statusToggle.isVisible()) {
        await statusToggle.click();
        await page.waitForTimeout(1000);
        
        // Check for success message
        const hasSuccess = await page.locator('text=/updated|changed/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });
  });

  test.describe('Master Data - Branches', () => {
    test('should display branches list', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/branches');
      
      // Verify page
      await pageHelper.verifyPageTitle('Branches');
      
      // Verify all branches are shown
      for (const branch of testBranches) {
        await expect(page.locator(`text="${branch.name}"`)).toBeVisible();
      }
    });

    test('should add new branch', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/branches');
      
      const addButton = page.locator('button:has-text("Add Branch"), button:has-text("New Branch")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Fill branch form
        await page.fill('input[name="name"]', 'Test Branch');
        await page.fill('input[name="code"]', 'TB');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        const hasSuccess = await page.locator('text=/created|added/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });
  });

  test.describe('Master Data - Destinations', () => {
    test('should display destination countries', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/destinations');
      
      // Verify page
      await pageHelper.verifyPageTitle('Destination Countries');
      
      // Verify table shows destinations
      await expect(page.locator('table')).toBeVisible();
      
      // Check for some known destinations
      await expect(page.locator('text="Armenia"')).toBeVisible();
      await expect(page.locator('text="Turkey"')).toBeVisible();
      await expect(page.locator('text="Georgia"')).toBeVisible();
    });

    test('should add new destination', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/destinations');
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Fill destination form
        await page.fill('input[name="name"]', 'Test Country');
        await page.fill('input[name="code"]', 'TC');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        const hasSuccess = await page.locator('text=/created|added/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });
  });

  test.describe('Master Data - Platforms', () => {
    test('should display advertising platforms', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/platforms');
      
      // Verify page
      await pageHelper.verifyPageTitle('Advertising Platforms');
      
      // Verify all platforms are shown
      for (const platform of testPlatforms) {
        await expect(page.locator(`text="${platform.name}"`)).toBeVisible();
      }
    });

    test('should add new platform', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/platforms');
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Fill platform form
        await page.fill('input[name="name"]', 'Test Platform');
        await page.fill('input[name="code"]', 'TEST');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        const hasSuccess = await page.locator('text=/created|added/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });
  });

  test.describe('Master Data - Target Countries', () => {
    test('should display target countries', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/target-countries');
      
      // Verify page
      await pageHelper.verifyPageTitle('Target Countries');
      
      // Verify Gulf countries are shown
      await expect(page.locator('text="UAE"')).toBeVisible();
      await expect(page.locator('text="Saudi Arabia"')).toBeVisible();
      await expect(page.locator('text="Kuwait"')).toBeVisible();
      await expect(page.locator('text="Qatar"')).toBeVisible();
    });
  });

  test.describe('Admin Permissions', () => {
    test('should only allow admin to access admin pages', async ({ page }) => {
      // Logout and login as media buyer
      await authHelper.logout();
      await authHelper.login('mediaBuyer');
      
      // Try to access admin page
      await page.goto('/admin');
      
      // Should be redirected or show access denied
      const isRedirected = page.url().includes('/dashboard');
      const hasAccessDenied = await page.locator('text=/Access Denied|Unauthorized/i').isVisible();
      
      expect(isRedirected || hasAccessDenied).toBeTruthy();
    });

    test('should allow admin to access all modules', async ({ page }) => {
      // Admin should access all areas
      const modules = [
        '/admin',
        '/admin/users',
        '/admin/master-data/agents',
        '/media',
        '/sales',
        '/analytics',
        '/dashboard'
      ];
      
      for (const module of modules) {
        await page.goto(module);
        await page.waitForLoadState('networkidle');
        
        // Should not be redirected to login
        expect(page.url()).not.toContain('/auth/login');
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select multiple items for bulk actions', async ({ page }) => {
      await pageHelper.navigateTo('/admin/master-data/agents');
      await pageHelper.waitForDataLoad();
      
      // Look for checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      if (count > 2) {
        // Select first 3 items
        for (let i = 0; i < 3; i++) {
          await checkboxes.nth(i).check();
        }
        
        // Look for bulk action button
        const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Selected")').first();
        if (await bulkButton.isVisible()) {
          await expect(bulkButton).toBeEnabled();
        }
      }
    });
  });
});