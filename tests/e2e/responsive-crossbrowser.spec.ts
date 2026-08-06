import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 568, name: 'Mobile 320px' },
  { width: 375, height: 812, name: 'Mobile 375px' },
  { width: 768, height: 1024, name: 'Tablet 768px' },
  { width: 1440, height: 900, name: 'Desktop 1440px' },
];

for (const vp of VIEWPORTS) {
  test.describe(`Responsive Layout: ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`renders homepage layout correctly at ${vp.width}px width`, async ({ page }) => {
      await page.goto('/');

      // Check header visibility
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Ensure horizontal overflow doesn't break page layout
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 50);
    });
  });
}
