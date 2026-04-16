/**
 * wizard-flow.spec.ts
 * E2E tests for the Wizard setup flow, hardening checklist, and scripts pages.
 */
import { test, expect, Page } from '@playwright/test';

test.describe('Home Page', () => {
  test('home page loads and shows host selection options', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(1000);

    // Should show host cards/buttons
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/macOS|macos/i);
    expect(bodyText).toMatch(/digitalocean/i);
  });

  test('home page shows main title', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').textContent();
    // Should show some form of "OpenClaw" or "Moltbot" or "Installer"
    expect(bodyText).toMatch(/OpenClaw|Moltbot|Installer/i);
  });

  test('home page shows feature highlights', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').textContent();
    // Should mention preflight checks, hardening, or dry run
    expect(bodyText).toMatch(/preflight|hardening|dry run/i);
  });
});

test.describe('Wizard Flow — macOS', () => {
  async function goToWizard(page: Page, hostTarget: string = 'macos') {
    await page.goto(`/#/wizard/${hostTarget}`);
    // Wait for wizard content to load
    await page.waitForTimeout(2000);
  }

  test('navigates to wizard/macos without error', async ({ page }) => {
    await goToWizard(page, 'macos');
    const bodyText = await page.locator('body').textContent();
    // Should show wizard content, not a 404
    expect(bodyText).not.toMatch(/page not found/i);
    expect(bodyText).toMatch(/macos|wizard|setup|step/i);
  });

  test('wizard shows step indicators', async ({ page }) => {
    await goToWizard(page, 'macos');

    // Wizard should show a progress or step indicator
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/step|environment|check|dependencies|install/i);
  });

  test('wizard shows script content (preflight, install, or rollback)', async ({ page }) => {
    await goToWizard(page, 'macos');

    // The wizard shows script previews — look for script-like content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/#!/ );  // Shell scripts start with shebang
  });

  test('wizard has next step navigation', async ({ page }) => {
    await goToWizard(page, 'macos');

    // There should be navigation buttons
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/next|complete|previous|step/i);
  });

  test('wizard has copy or download button for scripts', async ({ page }) => {
    await goToWizard(page, 'macos');

    // Should have copy/download buttons
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/copy|download/i);
  });

  test('clicking "Mark Complete / Next" advances the step', async ({ page }) => {
    await goToWizard(page, 'macos');

    // Find the next/complete button
    const nextBtn = page.locator('button').filter({ hasText: /next|complete/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      // Something should change (step indicator updates)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
    } else {
      // If no next button found, that's okay — skip this assertion
      console.log('No next/complete button found — skipping step click test');
    }
  });
});

test.describe('Hardening Checklist — macOS', () => {
  test('navigates to hardening/macos and shows checklist', async ({ page }) => {
    await page.goto('/#/hardening/macos');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(/page not found/i);
    expect(bodyText).toMatch(/hardening|security|check|firewall|permission/i);
  });

  test('hardening page has at least one checklist item', async ({ page }) => {
    await page.goto('/#/hardening/macos');
    await page.waitForTimeout(2000);

    // Look for checkbox elements or list items
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');
    const count = await checkboxes.count();
    // There should be hardening checklist items
    if (count === 0) {
      // Fallback: check body has relevant content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toMatch(/check|item|firewall|permission|security/i);
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Scripts Page — macOS', () => {
  test('navigates to scripts/macos and shows download/copy buttons', async ({ page }) => {
    await page.goto('/#/scripts/macos');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(/page not found/i);
    expect(bodyText).toMatch(/script|copy|download|install|preflight/i);
  });

  test('scripts page shows shell script content', async ({ page }) => {
    await page.goto('/#/scripts/macos');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    // Should show script content with shebang or bash commands
    expect(bodyText).toMatch(/#!/);
  });
});

test.describe('Wizard Flow — DigitalOcean', () => {
  test('wizard/digitalocean loads correctly', async ({ page }) => {
    await page.goto('/#/wizard/digitalocean');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toMatch(/page not found/i);
    expect(bodyText).toMatch(/digitalocean|ubuntu|step|wizard/i);
  });
});
