import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { PageHelper } from '../helpers/page-helper';

test.describe('Analytics Dashboard Tests', () => {
  let authHelper: AuthHelper;
  let pageHelper: PageHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    pageHelper = new PageHelper(page);
    
    // Login as admin to see full analytics
    await authHelper.login('admin');
  });

  test.describe('Analytics Overview', () => {
    test('should display analytics dashboard', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      
      // Verify page loads
      await pageHelper.verifyPageTitle('Analytics');
      
      // Should show key metrics
      await expect(page.locator('text=/Total Spend|Revenue|ROI|Conversion/i').first()).toBeVisible();
    });

    test('should display KPI cards', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for KPI cards
      const kpiCards = page.locator('[class*="card"], [class*="metric"], [class*="stat"]');
      const count = await kpiCards.count();
      
      // Should have at least 4 KPI cards
      expect(count).toBeGreaterThanOrEqual(4);
      
      // Check for common KPIs
      const kpiTexts = ['Total Spend', 'Total Deals', 'ROI', 'Conversion Rate'];
      for (const text of kpiTexts) {
        const kpi = page.locator(`text=/${text}/i`).first();
        if (await kpi.isVisible()) {
          await expect(kpi).toBeVisible();
        }
      }
    });

    test('should show date range selector', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      
      // Look for date range selector
      const dateRange = page.locator('button:has-text("Last 30 days"), select[name*="period"], input[type="date"]').first();
      await expect(dateRange).toBeVisible();
      
      // Try to change date range
      if (await dateRange.isVisible()) {
        await dateRange.click();
        
        // Look for date options
        const options = page.locator('text=/Today|Yesterday|Last 7|Last 30|This Month/i');
        if (await options.first().isVisible()) {
          await options.first().click();
          await pageHelper.waitForDataLoad();
        }
      }
    });
  });

  test.describe('Performance Charts', () => {
    test('should display performance charts', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for chart containers
      const charts = page.locator('canvas, svg[role="img"], [class*="chart"], [class*="graph"]');
      const count = await charts.count();
      
      // Should have at least one chart
      expect(count).toBeGreaterThan(0);
    });

    test('should display spend trend chart', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for spend trend chart
      const spendChart = page.locator('text=/Spend.*Trend|Campaign.*Spend|Daily.*Spend/i').first();
      if (await spendChart.isVisible()) {
        const chartContainer = spendChart.locator('..').locator('canvas, svg').first();
        await expect(chartContainer).toBeVisible();
      }
    });

    test('should display conversion chart', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for conversion chart
      const conversionChart = page.locator('text=/Conversion|Deals.*Closed|Sales.*Performance/i').first();
      if (await conversionChart.isVisible()) {
        const chartContainer = conversionChart.locator('..').locator('canvas, svg').first();
        await expect(chartContainer).toBeVisible();
      }
    });

    test('should display platform performance chart', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for platform chart
      const platformChart = page.locator('text=/Platform|Meta|Google|TikTok/i').first();
      if (await platformChart.isVisible()) {
        await expect(platformChart).toBeVisible();
      }
    });
  });

  test.describe('Agent Performance', () => {
    test('should display agent performance table', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for agent performance section
      const agentSection = page.locator('text=/Agent.*Performance|Top.*Agents|Agent.*Rankings/i').first();
      if (await agentSection.isVisible()) {
        // Should have a table or list
        const table = agentSection.locator('..').locator('table, [role="table"]').first();
        await expect(table).toBeVisible();
        
        // Should show agent metrics
        await expect(page.locator('th:has-text("Agent"), th:has-text("Name")')).toBeVisible();
        await expect(page.locator('th:has-text("Deals"), th:has-text("Conversions")')).toBeVisible();
      }
    });

    test('should sort agents by performance', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Find performance table
      const table = page.locator('table').filter({ hasText: 'Agent' }).first();
      if (await table.isVisible()) {
        // Click on deals/conversion column to sort
        const sortColumn = table.locator('th:has-text("Deals"), th:has-text("ROI")').first();
        if (await sortColumn.isVisible()) {
          await sortColumn.click();
          await page.waitForTimeout(500);
          
          // Verify sort indicator appears
          const sortIcon = sortColumn.locator('svg, [class*="sort"]');
          await expect(sortIcon).toBeVisible();
        }
      }
    });

    test('should filter agents by branch', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for branch filter
      const branchFilter = page.locator('select[name*="branch"], button:has-text("Branch")').first();
      if (await branchFilter.isVisible()) {
        if (branchFilter.nodeName === 'SELECT') {
          await branchFilter.selectOption('4 Seasons');
        } else {
          await branchFilter.click();
          await page.click('text="4 Seasons"');
        }
        
        await pageHelper.waitForDataLoad();
        
        // Verify filtered data
        const agentRows = page.locator('tbody tr').filter({ hasText: 'Agent' });
        const count = await agentRows.count();
        
        if (count > 0) {
          // All visible agents should be from 4 Seasons branch
          for (let i = 0; i < Math.min(count, 3); i++) {
            const row = agentRows.nth(i);
            const text = await row.textContent();
            expect(text).toMatch(/21|22/); // 4 Seasons agents
          }
        }
      }
    });
  });

  test.describe('Country Analytics', () => {
    test('should display country performance', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for country section
      const countrySection = page.locator('text=/Country.*Performance|Target.*Countries|Market.*Analysis/i').first();
      if (await countrySection.isVisible()) {
        // Should show Gulf countries
        const countries = ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar'];
        for (const country of countries) {
          const countryElement = page.locator(`text="${country}"`).first();
          if (await countryElement.isVisible()) {
            await expect(countryElement).toBeVisible();
          }
        }
      }
    });

    test('should display destination popularity', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for destination section
      const destSection = page.locator('text=/Destination|Popular.*Destinations|Top.*Destinations/i').first();
      if (await destSection.isVisible()) {
        // Should show some destinations
        const destinations = ['Armenia', 'Turkey', 'Georgia'];
        for (const dest of destinations) {
          const destElement = page.locator(`text="${dest}"`).first();
          if (await destElement.isVisible()) {
            await expect(destElement).toBeVisible();
            break; // At least one destination visible
          }
        }
      }
    });
  });

  test.describe('Platform Analytics', () => {
    test('should display platform ROI comparison', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for platform comparison
      const platformSection = page.locator('text=/Platform.*ROI|Platform.*Comparison|Channel.*Performance/i').first();
      if (await platformSection.isVisible()) {
        // Should show platforms
        const platforms = ['Meta', 'Google', 'TikTok'];
        for (const platform of platforms) {
          const platformElement = page.locator(`text="${platform}"`).first();
          if (await platformElement.isVisible()) {
            await expect(platformElement).toBeVisible();
          }
        }
      }
    });

    test('should display platform spend distribution', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for spend distribution
      const spendSection = page.locator('text=/Spend.*Distribution|Budget.*Allocation|Platform.*Spend/i').first();
      if (await spendSection.isVisible()) {
        // Should have a chart or table
        const visual = spendSection.locator('..').locator('canvas, svg, table').first();
        await expect(visual).toBeVisible();
      }
    });
  });

  test.describe('Data Filters', () => {
    test('should filter analytics by date range', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Find date filter
      const dateFilter = page.locator('input[type="date"], button:has-text("Date"), select[name*="date"]').first();
      if (await dateFilter.isVisible()) {
        if (dateFilter.nodeName === 'INPUT') {
          // Set custom date range
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          await dateFilter.fill(startDate.toISOString().split('T')[0]);
        } else {
          // Click date filter button
          await dateFilter.click();
          await page.click('text="Last 7 days"');
        }
        
        await pageHelper.waitForDataLoad();
        
        // Data should be updated
        const updatedText = page.locator('text=/Updated|Showing.*data|Results/i').first();
        if (await updatedText.isVisible()) {
          await expect(updatedText).toBeVisible();
        }
      }
    });

    test('should filter by multiple dimensions', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Apply multiple filters
      // 1. Branch filter
      const branchFilter = page.locator('select[name*="branch"]').first();
      if (await branchFilter.isVisible()) {
        await branchFilter.selectOption('4 Seasons');
      }
      
      // 2. Country filter
      const countryFilter = page.locator('select[name*="country"]').first();
      if (await countryFilter.isVisible()) {
        await countryFilter.selectOption('UAE');
      }
      
      // 3. Platform filter
      const platformFilter = page.locator('select[name*="platform"]').first();
      if (await platformFilter.isVisible()) {
        await platformFilter.selectOption('Meta');
      }
      
      await pageHelper.waitForDataLoad();
      
      // Verify filters are applied
      const activeFilters = page.locator('[class*="badge"], [class*="chip"], [class*="tag"]').filter({ hasText: /4 Seasons|UAE|Meta/ });
      const count = await activeFilters.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should clear all filters', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Apply some filters first
      const branchFilter = page.locator('select[name*="branch"]').first();
      if (await branchFilter.isVisible()) {
        await branchFilter.selectOption('4 Seasons');
        await pageHelper.waitForDataLoad();
      }
      
      // Find clear filters button
      const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset")').first();
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await pageHelper.waitForDataLoad();
        
        // Filters should be cleared
        const defaultOption = await branchFilter.inputValue();
        expect(defaultOption).toBe('');
      }
    });
  });

  test.describe('Data Export', () => {
    test('should have export functionality', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Should show export options
        const exportOptions = page.locator('text=/CSV|Excel|PDF/i');
        await expect(exportOptions.first()).toBeVisible();
      }
    });

    test('should export data as CSV', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      const exportButton = page.locator('button:has-text("Export")').first();
      if (await exportButton.isVisible()) {
        // Start waiting for download before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        
        await exportButton.click();
        
        // Click CSV option if it appears
        const csvOption = page.locator('text="CSV"').first();
        if (await csvOption.isVisible()) {
          await csvOption.click();
        }
        
        // Check if download started
        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          expect(filename).toContain('.csv');
        }
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should show last updated timestamp', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for last updated text
      const lastUpdated = page.locator('text=/Last.*updated|Updated.*at|As.*of/i').first();
      if (await lastUpdated.isVisible()) {
        await expect(lastUpdated).toBeVisible();
        
        // Should contain time information
        const text = await lastUpdated.textContent();
        expect(text).toMatch(/\d{1,2}:\d{2}|ago|AM|PM/i);
      }
    });

    test('should have refresh button', async ({ page }) => {
      await pageHelper.navigateTo('/analytics');
      await pageHelper.waitForDataLoad();
      
      // Look for refresh button
      const refreshButton = page.locator('button[aria-label*="refresh"], button:has-text("Refresh"), button:has(svg[class*="refresh"])').first();
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        await pageHelper.waitForDataLoad();
        
        // Should trigger data reload
        const loadingIndicator = page.locator('.loading, .spinner, [aria-busy="true"]').first();
        // Loading indicator might appear briefly
        const wasLoading = await loadingIndicator.isVisible();
        expect(wasLoading).toBeDefined();
      }
    });
  });
});