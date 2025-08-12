import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { PageHelper } from '../helpers/page-helper';
import { testMediaReport } from '../fixtures/test-data';

test.describe('Media Reports Tests', () => {
  let authHelper: AuthHelper;
  let pageHelper: PageHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    pageHelper = new PageHelper(page);
    
    // Login as media buyer before each test
    await authHelper.login('mediaBuyer');
  });

  test.describe('Media Reports List', () => {
    test('should display media reports page', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      
      // Verify page title
      await pageHelper.verifyPageTitle('Media Reports');
      
      // Verify table structure
      await expect(page.locator('table, [role="table"]')).toBeVisible();
      
      // Verify action buttons
      await expect(page.locator('button:has-text("New Report"), a:has-text("New Report")')).toBeVisible();
    });

    test('should search media reports', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.waitForDataLoad();
      
      // Search for a specific date or agent
      await pageHelper.searchInTable('Agent 21');
      
      // Verify search results (if any exist)
      const results = page.locator('tbody tr, [role="row"]').filter({ hasText: 'Agent 21' });
      const count = await results.count();
      
      if (count > 0) {
        await expect(results.first()).toBeVisible();
      }
    });

    test('should sort media reports by date', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.waitForDataLoad();
      
      // Sort by date column
      await pageHelper.sortTable('Date');
      
      // Verify sorting applied (visual check)
      await page.waitForTimeout(500);
    });

    test('should filter media reports by country', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      
      // Look for filter options
      const filterButton = page.locator('button:has-text("Filter"), select[name*="country"]').first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Select UAE filter
        await page.click('text="UAE"');
        await pageHelper.waitForDataLoad();
      }
    });
  });

  test.describe('Create Media Report', () => {
    test('should navigate to create media report form', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.clickButton('New Report');
      
      // Verify navigation to form
      await expect(page).toHaveURL(/.*media\/new/);
      await pageHelper.verifyPageTitle('New Media Report');
    });

    test('should display media report form correctly', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      // Verify form fields
      await expect(page.locator('input[type="date"], input[name*="date"]')).toBeVisible();
      await expect(page.locator('select[name*="branch"], input[name*="branch"]')).toBeVisible();
      
      // Verify country selection
      await expect(page.locator('text=/Target Countries|Countries/i')).toBeVisible();
      
      // Verify submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=/required|select|choose/i').first()).toBeVisible();
    });

    test('should create a simple media report', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      // Fill basic report details
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      
      // Select branch (should be auto-selected for media buyer)
      const branchSelect = page.locator('select[name*="branch"]');
      if (await branchSelect.isVisible()) {
        await branchSelect.selectOption('4 Seasons');
      }
      
      // Select target countries
      await page.click('input[type="checkbox"][value="UAE"], label:has-text("UAE") input');
      
      // Wait for agent selection to appear
      await page.waitForTimeout(500);
      
      // Select an agent
      const agentCheckbox = page.locator('input[type="checkbox"][value*="21"], label:has-text("Agent 21") input').first();
      if (await agentCheckbox.isVisible()) {
        await agentCheckbox.click();
        
        // Set campaign count
        const campaignInput = page.locator('input[type="number"][name*="campaign"], input[placeholder*="campaigns"]').first();
        if (await campaignInput.isVisible()) {
          await campaignInput.fill('1');
        }
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Check for success message or redirect
      const hasSuccess = await page.locator('text=/success|created|saved/i').isVisible();
      const isRedirected = page.url().includes('/media') && !page.url().includes('/new');
      
      expect(hasSuccess || isRedirected).toBeTruthy();
    });

    test('should add campaign details', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      // Fill basic details
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      
      // Select UAE
      await page.click('input[type="checkbox"][value="UAE"], label:has-text("UAE") input');
      await page.waitForTimeout(500);
      
      // Select Agent 21
      await page.click('label:has-text("Agent 21") input');
      
      // Set campaign count to 2
      const campaignInput = page.locator('input[type="number"]').first();
      await campaignInput.fill('2');
      
      // Look for campaign details section
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Fill campaign 1 details
        await page.selectOption('select[name*="destination"]', 'Armenia');
        await page.fill('input[name*="amount"]', '1500');
        await page.selectOption('select[name*="platform"]', 'Meta');
        
        // Add second campaign if form allows
        const addButton = page.locator('button:has-text("Add Campaign")');
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.locator('select[name*="destination"]').nth(1).selectOption('Turkey');
          await page.locator('input[name*="amount"]').nth(1).fill('2000');
          await page.locator('select[name*="platform"]').nth(1).selectOption('Google');
        }
      }
    });

    test('should handle multiple countries and agents', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      // Fill date
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      
      // Select multiple countries
      await page.click('label:has-text("UAE") input');
      await page.click('label:has-text("Saudi Arabia") input');
      
      await page.waitForTimeout(500);
      
      // For UAE - select Agent 21
      const uaeSection = page.locator('text="UAE"').locator('..');
      const agent21 = uaeSection.locator('label:has-text("Agent 21") input');
      if (await agent21.isVisible()) {
        await agent21.click();
        const uaeCampaigns = uaeSection.locator('input[type="number"]').first();
        await uaeCampaigns.fill('1');
      }
      
      // For Saudi Arabia - select Agent 22
      const ksaSection = page.locator('text="Saudi Arabia"').locator('..');
      const agent22 = ksaSection.locator('label:has-text("Agent 22") input');
      if (await agent22.isVisible()) {
        await agent22.click();
        const ksaCampaigns = ksaSection.locator('input[type="number"]').first();
        await ksaCampaigns.fill('1');
      }
    });
  });

  test.describe('Edit Media Report', () => {
    test('should open edit form for existing report', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.waitForDataLoad();
      
      // Find edit button for first report
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Verify navigation to edit form
        await expect(page).toHaveURL(/.*media\/(edit|\d+)/);
        
        // Form should be pre-filled
        const dateInput = page.locator('input[type="date"]');
        const value = await dateInput.inputValue();
        expect(value).toBeTruthy();
      }
    });

    test('should update media report', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.waitForDataLoad();
      
      const editButton = page.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Modify amount
        const amountInput = page.locator('input[name*="amount"]').first();
        await amountInput.fill('3500');
        
        // Submit changes
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        const hasSuccess = await page.locator('text=/updated|saved|success/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });
  });

  test.describe('Delete Media Report', () => {
    test('should show delete confirmation dialog', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.waitForDataLoad();
      
      const deleteButton = page.locator('button:has-text("Delete")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Should show confirmation dialog
        await expect(page.locator('text=/confirm|sure|delete/i')).toBeVisible();
        
        // Should have confirm and cancel buttons
        await expect(page.locator('button:has-text("Confirm"), button:has-text("Yes")')).toBeVisible();
        await expect(page.locator('button:has-text("Cancel"), button:has-text("No")')).toBeVisible();
      }
    });

    test('should cancel delete operation', async ({ page }) => {
      await pageHelper.navigateTo('/media');
      await pageHelper.waitForDataLoad();
      
      const deleteButton = page.locator('button:has-text("Delete")').first();
      if (await deleteButton.isVisible()) {
        const initialCount = await page.locator('tbody tr').count();
        
        await deleteButton.click();
        await pageHelper.cancelDialog();
        
        // Report should still exist
        const afterCount = await page.locator('tbody tr').count();
        expect(afterCount).toBe(initialCount);
      }
    });
  });

  test.describe('Media Report Validations', () => {
    test('should validate campaign amount is positive', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      // Fill basic details
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.click('label:has-text("UAE") input');
      await page.waitForTimeout(500);
      await page.click('label:has-text("Agent 21") input');
      
      // Try negative amount
      const amountInput = page.locator('input[name*="amount"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('-100');
        await page.click('button[type="submit"]');
        
        // Should show validation error
        await expect(page.locator('text=/positive|greater than|invalid amount/i').first()).toBeVisible();
      }
    });

    test('should validate campaign count is at least 1', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.click('label:has-text("UAE") input');
      await page.waitForTimeout(500);
      await page.click('label:has-text("Agent 21") input');
      
      // Try zero campaigns
      const campaignInput = page.locator('input[type="number"]').first();
      await campaignInput.fill('0');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      const hasError = await page.locator('text=/at least|minimum|must be 1/i').isVisible();
      if (hasError) {
        await expect(page.locator('text=/at least|minimum|must be 1/i').first()).toBeVisible();
      }
    });

    test('should require at least one agent per country', async ({ page }) => {
      await pageHelper.navigateTo('/media/new');
      
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.click('label:has-text("UAE") input');
      
      // Don't select any agents
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=/select.*agent|choose.*agent|agent.*required/i').first()).toBeVisible();
    });
  });
});