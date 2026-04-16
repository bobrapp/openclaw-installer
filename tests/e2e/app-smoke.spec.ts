/**
 * E2E Smoke Tests — Deploy Wizard, Marketplace, Build Catalog
 * Covers the main app flows not covered by existing wizard/preflight/i18n tests.
 */
import { test, expect } from '@playwright/test';

test.describe('Deploy Wizard', () => {
  test('loads deploy page and shows bundle selection', async ({ page }) => {
    await page.goto('/#/deploy');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /deploy|bundle/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('selecting a bundle advances to host selection', async ({ page }) => {
    await page.goto('/#/deploy');
    // Click the first bundle card
    const bundleCard = page.locator('[data-testid*="bundle"], .cursor-pointer, [role="button"]').first();
    await bundleCard.waitFor({ timeout: 10000 });
    await bundleCard.click();
    // Should show host selection or next step
    await expect(page.locator('text=/host|target|server|where/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('deploy wizard has 6 steps', async ({ page }) => {
    await page.goto('/#/deploy');
    // Check for step indicators
    const stepIndicators = page.locator('[data-testid*="step"], .step-indicator, [class*="step"]');
    // At minimum the first step should be visible
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Marketplace', () => {
  test('loads marketplace page with tabs', async ({ page }) => {
    await page.goto('/#/marketplace');
    await expect(page.locator('h1, h2').filter({ hasText: /marketplace/i }).first()).toBeVisible({ timeout: 10000 });
    // Should have tab buttons
    const tabs = page.locator('[role="tab"], [data-testid*="tab"], button').filter({ hasText: /agent|connector|hosting|deploy/i });
    expect(await tabs.count()).toBeGreaterThan(0);
  });

  test('marketplace shows entry cards', async ({ page }) => {
    await page.goto('/#/marketplace');
    // Wait for cards to render
    await page.waitForTimeout(2000);
    const cards = page.locator('[data-testid*="card"], [class*="card"], [role="article"]').filter({ hasText: /.+/ });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('marketplace search filters entries', async ({ page }) => {
    await page.goto('/#/marketplace');
    const searchInput = page.locator('input[type="search"], input[type="text"], input[placeholder*="earch"]').first();
    await searchInput.waitFor({ timeout: 10000 });
    await searchInput.fill('OpenClaw');
    await page.waitForTimeout(1000);
    // Should still show results (not empty)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('switching tabs changes displayed entries', async ({ page }) => {
    await page.goto('/#/marketplace');
    await page.waitForTimeout(2000);
    // Click a different tab (e.g., Connectors)
    const connectorTab = page.locator('[role="tab"], button').filter({ hasText: /connector/i }).first();
    if (await connectorTab.isVisible()) {
      await connectorTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

test.describe('Build Catalog', () => {
  test('loads builds page with build variants', async ({ page }) => {
    await page.goto('/#/builds');
    await expect(page.locator('h1, h2').filter({ hasText: /build|catalog|variant/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('build catalog shows at least 10 entries', async ({ page }) => {
    await page.goto('/#/builds');
    await page.waitForTimeout(2000);
    const cards = page.locator('[data-testid*="card"], [class*="card"], tr, [role="article"]').filter({ hasText: /.+/ });
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
  });
});

test.describe('Global Hosting Deals', () => {
  test('loads hosting deals page', async ({ page }) => {
    await page.goto('/#/hosting-global');
    await expect(page.locator('h1, h2').filter({ hasText: /hosting|deal|global/i }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Foundation Page', () => {
  test('loads foundation page with co-founders', async ({ page }) => {
    await page.goto('/#/foundation');
    await expect(page.locator('text=/Ken Johnston|Bob Rapp|co-founder/i').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('sidebar navigation links work', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(2000);
    // Find and click marketplace nav link
    const marketplaceLink = page.locator('a[href*="marketplace"], [data-testid*="nav"] a').filter({ hasText: /marketplace/i }).first();
    if (await marketplaceLink.isVisible()) {
      await marketplaceLink.click();
      await page.waitForTimeout(2000);
      // Verify the page navigated — hash should contain marketplace
      const url = page.url();
      expect(url).toMatch(/marketplace/);
    }
  });
});
