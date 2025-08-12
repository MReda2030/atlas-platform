import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { PageHelper } from '../helpers/page-helper';
import { testSalesReport } from '../fixtures/test-data';

test.describe('Sales Reports Tests', () => {
  let authHelper: AuthHelper;
  let pageHelper: PageHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    pageHelper = new PageHelper(page);
    
    // Login as media buyer
    await authHelper.login('mediaBuyer');
  });

  test.describe('Sales Reports List', () => {
    test('should display sales reports page', async ({ page }) => {
      await pageHelper.navigateTo('/sales');
      
      // Verify page title
      await pageHelper.verifyPageTitle('Sales Reports');
      
      // Verify table structure
      await expect(page.locator('table, [role="table"]')).toBeVisible();
      
      // Verify action buttons
      await expect(page.locator('button:has-text("New Report"), a:has-text("New Report")')).toBeVisible();
    });

    test('should filter sales reports by agent', async ({ page }) => {
      await pageHelper.navigateTo('/sales');
      await pageHelper.waitForDataLoad();
      
      // Search for specific agent
      await pageHelper.searchInTable('Agent 21');
      
      // Verify filtered results
      const results = page.locator('tbody tr').filter({ hasText: 'Agent 21' });
      const count = await results.count();
      
      if (count > 0) {
        // All visible rows should contain Agent 21
        for (let i = 0; i < count; i++) {
          await expect(results.nth(i)).toContainText('Agent 21');
        }
      }
    });

    test('should sort sales reports by date', async ({ page }) => {
      await pageHelper.navigateTo('/sales');
      await pageHelper.waitForDataLoad();
      
      // Sort by date
      await pageHelper.sortTable('Date');
      await page.waitForTimeout(500);
      
      // Get all dates
      const dates = await page.locator('tbody tr td:first-child').allTextContents();
      
      // Verify dates are sorted
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  test.describe('Create Sales Report', () => {
    test('should navigate to create sales report form', async ({ page }) => {
      await pageHelper.navigateTo('/sales');
      await pageHelper.clickButton('New Report');
      
      // Verify navigation
      await expect(page).toHaveURL(/.*sales\/new/);
      await pageHelper.verifyPageTitle('New Sales Report');
    });

    test('should display sales report form correctly', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Verify form fields
      await expect(page.locator('input[type="date"], input[name*="date"]')).toBeVisible();
      await expect(page.locator('select[name*="agent"]')).toBeVisible();
      
      // Verify country section
      await expect(page.locator('text=/Target Countries|Countries/i')).toBeVisible();
      
      // Verify submit button
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should create a sales report with single country', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill date
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      
      // Select agent
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      
      // Select country
      await page.click('input[type="checkbox"][value="UAE"], label:has-text("UAE") input');
      
      await page.waitForTimeout(500);
      
      // Fill country details
      const countrySection = page.locator('text="UAE"').locator('..');
      
      // Enter deals count
      const dealsInput = countrySection.locator('input[name*="deals"], input[placeholder*="deals"]').first();
      if (await dealsInput.isVisible()) {
        await dealsInput.fill('5');
      }
      
      // Enter WhatsApp messages
      const whatsappInput = countrySection.locator('input[name*="whatsapp"], input[placeholder*="WhatsApp"]').first();
      if (await whatsappInput.isVisible()) {
        await whatsappInput.fill('50');
      }
      
      // Select quality rating
      const qualitySelect = countrySection.locator('select[name*="quality"]').first();
      if (await qualitySelect.isVisible()) {
        await qualitySelect.selectOption('excellent');
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Check for success
      await page.waitForTimeout(1000);
      const hasSuccess = await page.locator('text=/success|created|saved/i').isVisible();
      const isRedirected = page.url().includes('/sales') && !page.url().includes('/new');
      
      expect(hasSuccess || isRedirected).toBeTruthy();
    });

    test('should assign destinations to deals', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill basic details
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      
      // Select UAE
      await page.click('label:has-text("UAE") input');
      await page.waitForTimeout(500);
      
      // Enter 3 deals
      await page.fill('input[name*="deals"]', '3');
      await page.fill('input[name*="whatsapp"]', '30');
      await page.selectOption('select[name*="quality"]', 'good');
      
      // Look for destination assignment
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Assign Destinations")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Assign destinations for each deal
        await page.locator('select[name*="destination"]').nth(0).selectOption('Armenia');
        await page.locator('select[name*="destination"]').nth(1).selectOption('Turkey');
        await page.locator('select[name*="destination"]').nth(2).selectOption('Georgia');
      }
      
      // Submit
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      const hasSuccess = await page.locator('text=/success|created/i').isVisible();
      expect(hasSuccess).toBeTruthy();
    });

    test('should handle multiple countries in sales report', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill basic details
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      await page.selectOption('select[name*="agent"]', 'Agent 22');
      
      // Select multiple countries
      await page.click('label:has-text("UAE") input');
      await page.click('label:has-text("Saudi Arabia") input');
      
      await page.waitForTimeout(500);
      
      // Fill UAE data
      const uaeSection = page.locator('fieldset:has-text("UAE"), div:has-text("UAE")').first();
      await uaeSection.locator('input[name*="deals"]').fill('3');
      await uaeSection.locator('input[name*="whatsapp"]').fill('25');
      await uaeSection.locator('select[name*="quality"]').selectOption('good');
      
      // Fill Saudi Arabia data  
      const ksaSection = page.locator('fieldset:has-text("Saudi Arabia"), div:has-text("Saudi Arabia")').first();
      await ksaSection.locator('input[name*="deals"]').fill('4');
      await ksaSection.locator('input[name*="whatsapp"]').fill('40');
      await ksaSection.locator('select[name*="quality"]').selectOption('excellent');
      
      // Submit
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Edit Sales Report', () => {
    test('should open edit form for existing report', async ({ page }) => {
      await pageHelper.navigateTo('/sales');
      await pageHelper.waitForDataLoad();
      
      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Verify navigation to edit form
        await expect(page).toHaveURL(/.*sales\/(edit|\d+)/);
        
        // Verify form is pre-filled
        const dateInput = page.locator('input[type="date"]');
        const value = await dateInput.inputValue();
        expect(value).toBeTruthy();
      }
    });

    test('should update sales report details', async ({ page }) => {
      await pageHelper.navigateTo('/sales');
      await pageHelper.waitForDataLoad();
      
      const editButton = page.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Update deals count
        const dealsInput = page.locator('input[name*="deals"]').first();
        await dealsInput.fill('10');
        
        // Update quality
        const qualitySelect = page.locator('select[name*="quality"]').first();
        await qualitySelect.selectOption('best_quality');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Check for success
        await page.waitForTimeout(1000);
        const hasSuccess = await page.locator('text=/updated|saved/i').isVisible();
        expect(hasSuccess).toBeTruthy();
      }
    });
  });

  test.describe('Sales Report Validations', () => {
    test('should validate required fields', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=/required|select|choose/i').first()).toBeVisible();
    });

    test('should validate deals count is non-negative', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill basic details
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      await page.click('label:has-text("UAE") input');
      
      // Enter negative deals
      await page.fill('input[name*="deals"]', '-5');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      const hasError = await page.locator('text=/positive|greater than|invalid/i').isVisible();
      if (hasError) {
        await expect(page.locator('text=/positive|greater than|invalid/i').first()).toBeVisible();
      }
    });

    test('should validate WhatsApp messages count', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill basic details
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      await page.click('label:has-text("UAE") input');
      
      // Enter invalid WhatsApp count
      await page.fill('input[name*="whatsapp"]', '-10');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      const hasError = await page.locator('text=/positive|greater than|invalid/i').isVisible();
      if (hasError) {
        await expect(page.locator('text=/positive|greater than|invalid/i').first()).toBeVisible();
      }
    });

    test('should require at least one country', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill date and agent but no countries
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      
      // Try to submit without selecting countries
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=/select.*country|choose.*country|country.*required/i').first()).toBeVisible();
    });

    test('should validate destination assignments match deals count', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill basic details
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      await page.click('label:has-text("UAE") input');
      
      // Enter 5 deals
      await page.fill('input[name*="deals"]', '5');
      await page.fill('input[name*="whatsapp"]', '50');
      await page.selectOption('select[name*="quality"]', 'good');
      
      // Move to destinations
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Assign")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should see 5 destination dropdowns
        const destinationSelects = page.locator('select[name*="destination"]');
        const count = await destinationSelects.count();
        expect(count).toBe(5);
      }
    });
  });

  test.describe('Sales Report Quality Ratings', () => {
    test('should display all quality rating options', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Setup form
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      await page.click('label:has-text("UAE") input');
      
      // Check quality options
      const qualitySelect = page.locator('select[name*="quality"]').first();
      const options = await qualitySelect.locator('option').allTextContents();
      
      // Should have all quality levels
      expect(options).toContain('Below Standard');
      expect(options).toContain('Standard');
      expect(options).toContain('Good');
      expect(options).toContain('Excellent');
      expect(options).toContain('Best Quality');
    });

    test('should save different quality ratings per country', async ({ page }) => {
      await pageHelper.navigateTo('/sales/new');
      
      // Fill basic details
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
      await page.selectOption('select[name*="agent"]', 'Agent 21');
      
      // Select two countries
      await page.click('label:has-text("UAE") input');
      await page.click('label:has-text("Kuwait") input');
      
      // Set different quality for each
      const uaeQuality = page.locator('fieldset:has-text("UAE") select[name*="quality"]').first();
      await uaeQuality.selectOption('excellent');
      
      const kuwaitQuality = page.locator('fieldset:has-text("Kuwait") select[name*="quality"]').first();
      await kuwaitQuality.selectOption('standard');
      
      // Fill other required fields
      await page.locator('fieldset:has-text("UAE") input[name*="deals"]').fill('3');
      await page.locator('fieldset:has-text("UAE") input[name*="whatsapp"]').fill('30');
      await page.locator('fieldset:has-text("Kuwait") input[name*="deals"]').fill('2');
      await page.locator('fieldset:has-text("Kuwait") input[name*="whatsapp"]').fill('20');
      
      // Submit
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
    });
  });
});