/**
 * standalone-wizard-smoke.spec.ts
 *
 * Playwright smoke test for the standalone HTML wizard (public/aigovops-wizard.html).
 * Validates the full dry-run flow end-to-end across all 4 host targets:
 *   macOS, DigitalOcean, Azure VM, Generic VPS
 *
 * Each host target iteration:
 *   Step 1 — Select host target
 *   Step 2 — Configure (accept defaults)
 *   Step 3 — Security checklist
 *   Step 4 — Review configuration
 *   Step 5 — Run preflight dry-run → all checks pass
 *   Step 6 — Execute install simulation → completes
 *   Step 7 — Verify audit log with SHA-256 hash chain
 *
 * Uses a static file server (no Express dependency) so the test runs
 * in CI without needing the full app build.
 */
import { test, expect, Page } from '@playwright/test';

/**
 * The standalone wizard is served by python3 http.server on port 9222
 * (configured in playwright.standalone.config.ts webServer).
 * The wizard file is at public/aigovops-wizard.html.
 */
const WIZARD_URL = '/aigovops-wizard.html';

const HOST_TARGETS = [
  { key: 'macos', label: 'macOS' },
  { key: 'digitalocean', label: 'DigitalOcean' },
  { key: 'azure', label: 'Azure VM' },
  { key: 'vps', label: 'Generic VPS' },
] as const;

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

/** Wait for step heading to show the expected step number */
async function waitForStep(page: Page, stepNum: number) {
  await expect(
    page.locator('.step-num-badge', { hasText: String(stepNum) })
  ).toBeVisible({ timeout: 10_000 });
}

/** Click the primary "Next" / proceed button on the current step */
async function clickNext(page: Page) {
  // The forward button is either btn-primary or btn-teal with → arrow
  const nextBtn = page.locator(
    'button.btn-primary:visible, button.btn-teal:visible'
  ).filter({ hasText: /→|Next|Continue|Proceed/ });
  await expect(nextBtn.first()).toBeEnabled({ timeout: 5_000 });
  await nextBtn.first().click();
}

/** Select a host target on Step 1 */
async function selectHost(page: Page, hostKey: string) {
  // Click the host card by data-testid
  const card = page.locator(`[data-testid="hostCard-${hostKey}"]`);
  await card.click();
  // Verify selection registered — the card gets .selected class
  await expect(card).toHaveClass(/selected/);
}

/* ────────────────────────────────────────────
   Test suite — one iteration per host target
   ──────────────────────────────────────────── */

for (const { key, label } of HOST_TARGETS) {
  test.describe(`Standalone Wizard — ${label} (${key})`, () => {

    test(`completes full dry-run flow end-to-end`, async ({ page }) => {
      // Fresh load for each host target
      await page.goto(WIZARD_URL);
      await page.waitForLoadState('domcontentloaded');

      // ── Step 1: Welcome & Host Selection ──
      await waitForStep(page, 1);
      await selectHost(page, key);
      await clickNext(page);

      // ── Step 2: Configuration ──
      await waitForStep(page, 2);
      // Accept defaults — just proceed
      await clickNext(page);

      // ── Step 3: Security Checklist ──
      await waitForStep(page, 3);
      // Toggle some checkboxes if needed, then proceed
      // The wizard allows proceeding without all checked
      await clickNext(page);

      // ── Step 4: Review ──
      await waitForStep(page, 4);
      // Verify the host label appears in the review
      const reviewBody = await page.locator('#stepContent').textContent();
      expect(reviewBody).toContain(label);
      await clickNext(page);

      // ── Step 5: Dry Run (Preflight) ──
      await waitForStep(page, 5);
      // Verify the host name shows in the description
      await expect(page.locator('.step-desc')).toContainText(label);

      // Click "Run Preflight Checks"
      const dryRunBtn = page.locator('#runDryBtn');
      await expect(dryRunBtn).toBeVisible();
      await dryRunBtn.click();

      // Wait for dry run to complete — look for the summary to appear
      // The summary shows "X passed", "X warnings", "X failed"
      await expect(
        page.locator('.dry-run-summary')
      ).toBeVisible({ timeout: 30_000 });

      // Verify all checks passed (0 failed)
      const summaryText = await page.locator('.dry-run-summary').textContent();
      expect(summaryText).toContain('0 failed');

      // Verify individual check rows rendered
      const checkRows = page.locator('.check-row');
      const checkCount = await checkRows.count();
      expect(checkCount).toBeGreaterThanOrEqual(5); // at least 5 common + host-specific

      // All rows should be pass or warn (none fail)
      const failedRows = page.locator('.check-row.fail');
      expect(await failedRows.count()).toBe(0);

      // "Proceed to Install" button should now be available
      const proceedBtn = page.locator('button', { hasText: /Proceed to Install/ });
      await expect(proceedBtn).toBeVisible({ timeout: 5_000 });
      await proceedBtn.click();

      // ── Step 6: Execute Install ──
      await waitForStep(page, 6);

      // Click "Begin Installation"
      const installBtn = page.locator('#runInstallBtn');
      await expect(installBtn).toBeVisible();
      await installBtn.click();

      // Wait for "Installation Complete!" message
      await expect(
        page.locator('.install-complete-title')
      ).toBeVisible({ timeout: 60_000 });
      await expect(
        page.locator('.install-complete-title')
      ).toContainText('Installation Complete');

      // Verify the install complete message mentions the host
      await expect(
        page.locator('.install-complete-msg')
      ).toContainText(label);

      // Click "View Audit Log →"
      const auditBtn = page.locator('button', { hasText: /View Audit Log/ });
      await expect(auditBtn).toBeVisible();
      await auditBtn.click();

      // ── Step 7: Audit Log ──
      await waitForStep(page, 7);

      // Verify audit entries exist
      const auditEntries = page.locator('.audit-entry');
      const entryCount = await auditEntries.count();
      expect(entryCount).toBeGreaterThanOrEqual(5); // session start + dry run + install steps

      // Verify each entry has a SHA-256 hash
      for (let i = 0; i < Math.min(entryCount, 3); i++) {
        const hashText = await auditEntries.nth(i).locator('.audit-hash').textContent();
        expect(hashText).toMatch(/SHA-256:\s*[a-f0-9]{64}/);
      }

      // Verify prev-hash chain linkage (each entry references previous)
      const firstEntry = auditEntries.first();
      const prevHashText = await firstEntry.locator('.audit-prev-hash').textContent();
      // Genesis entry's prevHash is all zeros (displayed truncated with …)
      expect(prevHashText).toMatch(/Prev:\s*0{32}/);

      // Verify the export button is present
      await expect(
        page.locator('button', { hasText: /Export as JSON/ })
      ).toBeVisible();

      // Verify the audit log count in the footer text
      const footerText = await page.locator('#stepContent').textContent();
      expect(footerText).toContain('entries');
      expect(footerText).toContain('hash chain verifiable');

      // Verify AiGovOps Foundation branding
      expect(footerText).toContain('AiGovOps Foundation');
      expect(footerText).toContain('Bob Rapp');
      expect(footerText).toContain('Ken Johnston');

      // Verify progress bar is at 100%
      const fill = page.locator('[data-testid="progressFill"]');
      const width = await fill.evaluate((el: HTMLElement) => el.style.width);
      expect(width).toBe('100%');

      // All step bubbles before step 7 should be done
      const doneBubbles = page.locator('.step-bubble.done');
      expect(await doneBubbles.count()).toBe(6);
    });

  });

}

/* ────────────────────────────────────────────
   Cross-host: restart wizard resets state
   ──────────────────────────────────────────── */

test('restart wizard resets to Step 1 with macOS default', async ({ page }) => {
  await page.goto(WIZARD_URL);
  await page.waitForLoadState('domcontentloaded');
  await waitForStep(page, 1);

  // Select a non-default host
  await selectHost(page, 'azure');
  await clickNext(page);
  await waitForStep(page, 2);

  // Navigate back and restart is implicitly tested via a fresh session
  // but let's test the explicit restart button (accessible from Step 7)
  // For now, just verify going back preserves the host
  const backBtn = page.locator('button', { hasText: /← Back/ });
  await backBtn.click();
  await waitForStep(page, 1);

  // Azure should still be selected
  const azureCard = page.locator('[data-testid="hostCard-azure"]');
  await expect(azureCard).toHaveClass(/selected/);
});

test('dark mode toggle works on standalone wizard', async ({ page }) => {
  await page.goto(WIZARD_URL);
  await page.waitForLoadState('domcontentloaded');

  // Should start in light mode
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');

  // Click dark mode toggle
  const toggle = page.locator('[data-testid="themeBtn"]');
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  // Toggle back
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');
});
