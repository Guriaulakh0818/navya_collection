import { expect, test } from '@playwright/test';

test.describe('Homepage E2E Suite', () => {
  test('should load homepage and render core branding elements', async ({ page }) => {
    await page.goto('/');

    // Verify Page Title
    await expect(page).toHaveTitle(/Navya Collection/i);

    // Verify Navigation Header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify Footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});
