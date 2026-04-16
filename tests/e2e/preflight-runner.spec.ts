/**
 * preflight-runner.spec.ts
 * E2E tests for the Preflight Runner page at /#/preflight
 */
import { test, expect, Page } from '@playwright/test';

async function navigateToPreflight(page: Page) {
  await page.goto('/#/preflight');
  // Wait for the page to load (lazy loading)
  await page.waitForSelector('[data-testid="text-runner-title"]', { timeout: 15000 });
}

test.describe('Preflight Runner', () => {
  test('page shows "Preflight Runner" title', async ({ page }) => {
    await navigateToPreflight(page);
    const title = await page.getByTestId('text-runner-title').textContent();
    expect(title).toContain('Preflight Runner');
  });

  test('host selector is visible with 4 options', async ({ page }) => {
    await navigateToPreflight(page);

    // The Select trigger is visible
    const selector = page.getByTestId('select-host-target');
    await expect(selector).toBeVisible();

    // Click to open the dropdown
    await selector.click();

    // Wait for dropdown items to appear
    await page.waitForTimeout(300);

    // Check that all 4 options exist in the DOM
    const items = page.locator('[role="option"]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Verify the option values are present
    const itemTexts = await items.allTextContents();
    const allText = itemTexts.join(' ').toLowerCase();
    expect(allText).toContain('macos');
    expect(allText).toContain('digitalocean');
    expect(allText).toContain('azure');
    expect(allText).toContain('generic');

    // Close dropdown
    await page.keyboard.press('Escape');
  });

  test('Run Preflight button is visible', async ({ page }) => {
    await navigateToPreflight(page);
    const runBtn = page.getByTestId('button-run-preflight');
    await expect(runBtn).toBeVisible();
    await expect(runBtn).not.toBeDisabled();
  });

  test('running preflight with macos target streams check results', async ({ page }) => {
    await navigateToPreflight(page);

    // Click Run Preflight
    await page.getByTestId('button-run-preflight').click();

    // Wait for first check result to appear
    await page.waitForSelector('[data-testid^="check-result-"]', { timeout: 30000 });

    // Verify at least one check result exists
    const checkResults = page.locator('[data-testid^="check-result-"]');
    const count = await checkResults.count();
    expect(count).toBeGreaterThan(0);
  });

  test('summary card appears after preflight completes', async ({ page }) => {
    await navigateToPreflight(page);

    // Click Run Preflight
    await page.getByTestId('button-run-preflight').click();

    // Wait for summary card (the SSE will stream all checks then send summary)
    await page.waitForSelector('[data-testid="card-summary"]', { timeout: 45000 });
    const summary = page.getByTestId('card-summary');
    await expect(summary).toBeVisible();
  });

  test('summary shows pass/warn/fail counts', async ({ page }) => {
    await navigateToPreflight(page);
    await page.getByTestId('button-run-preflight').click();

    await page.waitForSelector('[data-testid="card-summary"]', { timeout: 45000 });

    // Check for the result text
    const summaryText = await page.getByTestId('card-summary').textContent();
    expect(summaryText).toMatch(/passed/i);
    expect(summaryText).toMatch(/warnings?/i);
    expect(summaryText).toMatch(/failed/i);
  });

  test('Reset button clears checks', async ({ page }) => {
    await navigateToPreflight(page);
    await page.getByTestId('button-run-preflight').click();

    // Wait for checks to appear
    await page.waitForSelector('[data-testid^="check-result-"]', { timeout: 30000 });

    // Wait for the Reset button to appear
    await page.waitForSelector('[data-testid="button-reset-runner"]', { timeout: 10000 });
    await page.getByTestId('button-reset-runner').click();

    // Verify checks are cleared
    await page.waitForTimeout(500);
    const checkResults = page.locator('[data-testid^="check-result-"]');
    const count = await checkResults.count();
    expect(count).toBe(0);

    // Summary should also be gone
    const summary = page.locator('[data-testid="card-summary"]');
    await expect(summary).not.toBeVisible();
  });

  test('can run preflight twice with different targets', async ({ page }) => {
    await navigateToPreflight(page);

    // First run with macos (default)
    await page.getByTestId('button-run-preflight').click();
    await page.waitForSelector('[data-testid="card-summary"]', { timeout: 45000 });

    // Reset
    await page.getByTestId('button-reset-runner').click();
    await page.waitForTimeout(300);

    // Switch to digitalocean
    await page.getByTestId('select-host-target').click();
    await page.waitForTimeout(300);
    const options = page.locator('[role="option"]');
    // Find and click the digitalocean option
    await options.filter({ hasText: /digitalocean/i }).click();

    // Run again
    await page.getByTestId('button-run-preflight').click();
    await page.waitForSelector('[data-testid^="check-result-"]', { timeout: 30000 });
    await page.waitForSelector('[data-testid="card-summary"]', { timeout: 45000 });

    const summary = page.getByTestId('card-summary');
    await expect(summary).toBeVisible();
  });
});
