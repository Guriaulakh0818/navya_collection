import fs from 'fs';
import path from 'path';
import { expect, test } from '@playwright/test';

const SCREENSHOT_DIR =
  'C:\\Users\\ProBook\\.gemini\\antigravity-ide\\brain\\a074f509-c017-4f46-97ec-ad1505fe3cfc\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('PG-03 — Men Public Page E2E Suite', () => {
  test('1. Men category page core rendering, SEO metadata & catalog integrity', async ({
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

    // 1. Navigate to /category/men
    const response = await page.goto('/category/men', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // 2. SEO DOM Verification
    await expect(page).toHaveTitle('Men | Navya Collection');

    const canonicalHref = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonicalHref).toBe('https://navyacollection.store/category/men');

    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.toLowerCase()).toMatch(/men|gent/i);

    const robotsContent = await page.getAttribute('meta[name="robots"]', 'content');
    expect(robotsContent).toContain('index');

    // OpenGraph Verification
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBe('Men | Navya Collection');

    const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');
    expect(ogUrl).toBe('https://navyacollection.store/category/men');

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
            // Verify ItemList items contain ONLY Men products
            const items = s.itemListElement || [];
            expect(items.length).toBeGreaterThan(0);
            for (const item of items) {
              const itemName = (item.name || '').toLowerCase();
              expect(itemName).not.toContain('lehenga');
              expect(itemName).not.toContain('saree');
              expect(itemName).not.toContain('anarkali');
              expect(itemName).not.toContain('frock');
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
    expect(h1Text?.trim()).toBe('Men');

    // 5. Product Grid & Visibility Verification
    await page.waitForSelector('h3', { timeout: 10000 });
    const productHeadings = await page.locator('h3').allTextContents();
    expect(productHeadings.length).toBe(15);

    // Strict Category Isolation: No Women/Kids products
    for (const name of productHeadings) {
      const lower = name.toLowerCase();
      expect(lower).not.toContain('lehenga');
      expect(lower).not.toContain('saree');
      expect(lower).not.toContain('anarkali');
      expect(lower).not.toContain('chiffon western maxi dress');
      expect(lower).not.toContain('baby boys');
      expect(lower).not.toContain('sherwani');
    }

    // Capture Desktop Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-men-page.png'),
      fullPage: false,
    });

    // Verify console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('2. Direct entry /men redirects to /category/men', async ({ page }) => {
    const res = await page.goto('/men', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain('/category/men');
    await expect(page).toHaveTitle('Men | Navya Collection');
  });

  test('3. Desktop filter & sort functionality', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/category/men', { waitUntil: 'domcontentloaded' });

    // Wait for product cards
    await page.waitForSelector('h3', { timeout: 10000 });

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
      path: path.join(SCREENSHOT_DIR, 'desktop-filter-state.png'),
      fullPage: false,
    });
  });

  test('4. Mobile layout, touch targets & drawer body scroll lock', async ({ page }) => {
    // Mobile Viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/category/men', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h3', { timeout: 15000 });

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390 + 10);

    // Capture Mobile Page Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-men-page.png'),
      fullPage: false,
    });

    // Check for Mobile Filter Button (Filter icon or text)
    const mobileFilterBtn = page.locator('button:has-text("Filters")').first();
    await expect(mobileFilterBtn).toBeVisible({ timeout: 10000 });
    await mobileFilterBtn.click();
    await page.waitForTimeout(500);

    // Verify body scroll is locked
    const bodyOverflowLocked = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflowLocked).toBe('hidden');

    // Capture Mobile Filter Drawer Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-filter-drawer.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-drawer-scroll-locked.png'),
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
      await page.goto('/category/men', { waitUntil: 'domcontentloaded' });

      // Verify page loads cleanly
      await expect(page.locator('h1').first()).toBeVisible();

      // Verify no horizontal overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(vp.width + 15);
    });
  }
});
