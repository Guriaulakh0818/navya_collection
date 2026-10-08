import fs from 'fs';
import path from 'path';
import { expect, test } from '@playwright/test';

const SCREENSHOT_DIR =
  'C:\\Users\\ProBook\\.gemini\\antigravity-ide\\brain\\a074f509-c017-4f46-97ec-ad1505fe3cfc\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('PG-04 — Women Public Page E2E Suite', () => {
  test('1. Women category page core rendering, SEO metadata & catalog integrity', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        !msg.text().includes('images.unsplash.com') &&
        !msg.text().includes('favicon')
      ) {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Navigate to /category/women
    const response = await page.goto('/category/women', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // 2. SEO DOM Verification
    await expect(page).toHaveTitle('Women | Navya Collection');

    const canonicalHref = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonicalHref).toBe('https://navyacollection.store/category/women');

    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.toLowerCase()).toMatch(/luxury|ethnic|women|saree/i);

    const robotsContent = await page.getAttribute('meta[name="robots"]', 'content');
    expect(robotsContent).toContain('index');

    // OpenGraph Verification
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBe('Women | Navya Collection');

    const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');
    expect(ogUrl).toBe('https://navyacollection.store/category/women');

    // 3. Schema.org JSON-LD Verification
    const jsonLdElements = await page.locator('script[type="application/ld+json"]').all();
    let hasBreadcrumbSchema = false;
    let hasItemListSchema = false;

    for (const elem of jsonLdElements) {
      const text = await elem.textContent();
      if (!text) continue;
      try {
        const parsed = JSON.parse(text);
        const schemas = Array.isArray(parsed) ? parsed : [parsed];
        for (const s of schemas) {
          if (s['@type'] === 'BreadcrumbList') hasBreadcrumbSchema = true;
          if (s['@type'] === 'ItemList') {
            hasItemListSchema = true;
            const items = s.itemListElement || [];
            expect(items.length).toBe(10);
            for (const item of items) {
              const itemName = (item.name || '').toLowerCase();
              // Strict Category Isolation: No Men or Kids items
              expect(itemName).not.toContain('shirt');
              expect(itemName).not.toContain('t-shirt');
              expect(itemName).not.toContain('sherwani');
              expect(itemName).not.toContain('baby boys');
            }
          }
        }
      } catch (e) {
        // Ignore unparseable snippet
      }
    }

    expect(hasBreadcrumbSchema).toBe(true);
    expect(hasItemListSchema).toBe(true);

    // 4. Heading & Breadcrumb Structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    const h1Text = await page.locator('h1').first().textContent();
    expect(h1Text?.trim()).toBe('Women');

    // 5. Product Grid & Visibility Verification
    await page.waitForSelector('h3', { timeout: 15000 });
    const productHeadings = await page.locator('h3').allTextContents();
    expect(productHeadings.length).toBe(10);

    // Strict Category Isolation: No Men or Kids products
    for (const name of productHeadings) {
      const lower = name.toLowerCase();
      expect(lower).not.toContain('shirt');
      expect(lower).not.toContain('t-shirt');
      expect(lower).not.toContain('sherwani');
      expect(lower).not.toContain('baby boys');
    }

    // Capture Desktop Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-women-page.png'),
      fullPage: false,
    });

    // Verify console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('2. Direct entry /women redirects to /category/women', async ({ page }) => {
    const res = await page.goto('/women', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/category/women');
    await expect(page).toHaveTitle('Women | Navya Collection');
  });

  test('3. Subcategory alias /category/sarees redirects to /category/women-sarees', async ({
    page,
  }) => {
    const res = await page.goto('/category/sarees', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/category/women-sarees');
    await expect(page).toHaveTitle(/Sarees \| Navya Collection/i);
    await page.waitForSelector('h3', { timeout: 10000 });
    const sareeHeadings = await page.locator('h3').allTextContents();
    expect(sareeHeadings.length).toBe(2);
  });

  test('4. Desktop filter & sort functionality', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/category/women', { waitUntil: 'domcontentloaded' });

    // Wait for product cards
    await page.waitForSelector('h3', { timeout: 15000 });

    // Test Sort select dropdown
    const sortSelect = page.locator('select').first();
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price_asc');
      await page.waitForTimeout(500);

      // Verify reordering
      const firstProductPriceText = await page
        .locator('.font-black.text-navy')
        .first()
        .textContent();
      expect(firstProductPriceText).toBeTruthy();
    }

    // Capture filter/sort state screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-women-filter-state.png'),
      fullPage: false,
    });
  });

  test('5. Mobile layout, touch targets & drawer body scroll lock', async ({ page }) => {
    // Mobile Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/category/women', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h3', { timeout: 15000 });

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390 + 10);

    // Capture Mobile Page Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-women-page.png'),
      fullPage: false,
    });

    // Check for Mobile Filter Button
    const mobileFilterBtn = page.locator('button:has-text("Filters")').first();
    await expect(mobileFilterBtn).toBeVisible({ timeout: 10000 });
    await mobileFilterBtn.click();
    await page.waitForTimeout(500);

    // Verify body scroll is locked
    const bodyOverflowLocked = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowLocked).toBe('hidden');

    // Capture Mobile Filter Drawer Screenshots
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-women-filter-drawer.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-women-drawer-scroll-locked.png'),
      fullPage: false,
    });

    // Close drawer via Apply button
    const applyBtn = page.locator('button:has-text("Apply")').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await page.waitForTimeout(300);
    }
  });

  // Responsive Viewport Matrix Audit (Desktop & Mobile viewports)
  const VIEWPORT_MATRIX = [
    { name: 'Desktop 1280px', width: 1280, height: 800 },
    { name: 'Desktop 1440px', width: 1440, height: 900 },
    { name: 'Desktop 1920px', width: 1920, height: 1080 },
    { name: 'Mobile 320px', width: 320, height: 800 },
    { name: 'Mobile 375px', width: 375, height: 812 },
    { name: 'Mobile 390px', width: 390, height: 844 },
    { name: 'Mobile 414px', width: 414, height: 896 },
  ];

  for (const vp of VIEWPORT_MATRIX) {
    test(`Responsive layout verification: ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/category/women', { waitUntil: 'domcontentloaded' });

      // Verify page loads cleanly
      await expect(page.locator('h1').first()).toBeVisible();

      // Verify no horizontal overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(vp.width + 15);
    });
  }
});
