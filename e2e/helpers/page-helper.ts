import { Page, expect } from '@playwright/test';

export class PageHelper {
  constructor(private page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async clickButton(text: string) {
    await this.page.click(`button:has-text("${text}")`);
  }

  async fillInput(label: string, value: string) {
    const input = this.page.locator(`input[name="${label}"], input[placeholder*="${label}"], label:has-text("${label}") + input, label:has-text("${label}") input`).first();
    await input.fill(value);
  }

  async selectOption(label: string, value: string) {
    const select = this.page.locator(`select[name="${label}"], label:has-text("${label}") + select, label:has-text("${label}") select`).first();
    await select.selectOption(value);
  }

  async selectMultiple(label: string, values: string[]) {
    for (const value of values) {
      const checkbox = this.page.locator(`label:has-text("${value}") input[type="checkbox"], input[type="checkbox"][value="${value}"]`).first();
      await checkbox.check();
    }
  }

  async verifyToast(message: string, type: 'success' | 'error' = 'success') {
    const toastSelector = type === 'success' 
      ? `[role="alert"]:has-text("${message}"), .toast-success:has-text("${message}"), .success:has-text("${message}")`
      : `[role="alert"]:has-text("${message}"), .toast-error:has-text("${message}"), .error:has-text("${message}")`;
    
    await expect(this.page.locator(toastSelector).first()).toBeVisible({ timeout: 5000 });
  }

  async verifyTableRow(data: Record<string, string>) {
    const row = this.page.locator('tr').filter({ 
      hasText: Object.values(data)[0] 
    });
    
    for (const value of Object.values(data)) {
      await expect(row).toContainText(value);
    }
  }

  async searchInTable(searchTerm: string) {
    await this.page.fill('input[placeholder*="Search"], input[type="search"]', searchTerm);
    await this.page.waitForTimeout(500); // Debounce
  }

  async sortTable(columnName: string) {
    await this.page.click(`th:has-text("${columnName}")`);
    await this.page.waitForTimeout(500); // Wait for sort
  }

  async paginate(direction: 'next' | 'previous' | number) {
    if (typeof direction === 'number') {
      await this.page.click(`button:has-text("${direction}")`);
    } else {
      await this.page.click(`button:has-text("${direction === 'next' ? 'Next' : 'Previous'}")`);
    }
    await this.page.waitForTimeout(500);
  }

  async waitForDataLoad() {
    // Wait for loading indicators to disappear
    await this.page.waitForSelector('.loading, .spinner, [data-loading="true"]', { 
      state: 'hidden',
      timeout: 10000 
    }).catch(() => {});
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async verifyBreadcrumb(items: string[]) {
    const breadcrumb = this.page.locator('nav[aria-label="Breadcrumb"], .breadcrumb');
    for (const item of items) {
      await expect(breadcrumb).toContainText(item);
    }
  }

  async verifyPageTitle(title: string) {
    await expect(this.page.locator('h1, h2').first()).toContainText(title);
  }

  async verifyURL(urlPattern: string | RegExp) {
    if (typeof urlPattern === 'string') {
      await expect(this.page).toHaveURL(new RegExp(urlPattern));
    } else {
      await expect(this.page).toHaveURL(urlPattern);
    }
  }

  async closeModal() {
    const closeButton = this.page.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel"), .modal-close').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try pressing Escape
      await this.page.keyboard.press('Escape');
    }
  }

  async confirmDialog() {
    await this.page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")');
  }

  async cancelDialog() {
    await this.page.click('button:has-text("Cancel"), button:has-text("No")');
  }
}