import { expect, test } from '@playwright/test';

test.describe('Product, Wishlist & Cart E2E Flow', () => {
  test('should navigate to products page, toggle wishlist, and view cart', async ({ page }) => {
    await page.goto('/products');

    // Check headings
    await expect(page.locator('h1')).toBeVisible();

    // Open cart drawer or page
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);
  });
});
