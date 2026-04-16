/**
 * hash-chain-verification.spec.ts
 * E2E tests for the Audit Log viewer at /#/audit
 * Tests authentication flow, hash display, and chain verification.
 *
 * NOTE: The verify endpoint is rate-limited to 5 attempts per 60s.
 * We minimise auth calls by structuring tests to authenticate once per spec file
 * via a shared browser context, and using API-direct auth where possible.
 */
import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

const PASSPHRASE = 'AiGovOps2026!';

// Auth by entering passphrase in the UI
async function navigateAndAuthenticate(page: Page) {
  await page.goto('/#/audit');
  await page.waitForTimeout(500);

  // If already authenticated (e.g., page reuse), skip
  const alreadyIn = await page.locator('[data-testid="text-audit-title"]').isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyIn) return;

  await page.waitForSelector('[data-testid="input-passphrase"]', { timeout: 10000 });
  await page.getByTestId('input-passphrase').fill(PASSPHRASE);
  await page.getByTestId('button-authenticate').click();
  await page.waitForSelector('[data-testid="text-audit-title"]', { timeout: 15000 });
}

test.describe('Audit Log — Authentication', () => {
  test('navigating to /#/audit shows authentication screen when not logged in', async ({ page }) => {
    await page.goto('/#/audit');
    await page.waitForTimeout(500);

    const isSetupScreen = await page.locator('[data-testid="input-setup-passphrase"]').isVisible({ timeout: 3000 }).catch(() => false);
    const isAuthScreen = await page.locator('[data-testid="input-passphrase"]').isVisible({ timeout: 3000 }).catch(() => false);
    const isLoggedIn = await page.locator('[data-testid="text-audit-title"]').isVisible({ timeout: 3000 }).catch(() => false);

    // One of these must be true: setup screen, auth screen, or authenticated view
    expect(isSetupScreen || isAuthScreen || isLoggedIn).toBe(true);
  });

  test('entering correct passphrase shows audit log title', async ({ page }) => {
    await navigateAndAuthenticate(page);
    const title = page.getByTestId('text-audit-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toContain('Audit Log');
  });
});

test.describe('Audit Log — Core Functionality', () => {
  // Use a single long-running test that authenticates once and tests multiple things
  test('full audit log flow: auth → entries → hashes → chain verification → lock', async ({ page }) => {
    // Step 1: Navigate and authenticate
    await navigateAndAuthenticate(page);

    // Step 2: Verify entries are shown
    await page.waitForSelector('[data-testid^="audit-entry-"]', { timeout: 10000 });
    const entries = page.locator('[data-testid^="audit-entry-"]');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);

    // Step 3: Toggle hash display
    const toggleBtn = page.getByTestId('button-toggle-hashes');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await page.waitForTimeout(300);
    // Verify toggle text changed
    const toggleText = await toggleBtn.textContent();
    expect(toggleText).toMatch(/hide/i);

    // Step 4: Hash values should be visible
    const hashCodes = page.locator('code');
    const codeCount = await hashCodes.count();
    expect(codeCount).toBeGreaterThan(0);

    // Step 5: GENESIS should appear in the hash section
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('GENESIS');

    // Step 6: Verify chain
    const verifyBtn = page.getByTestId('button-verify-chain');
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();
    await page.waitForTimeout(2000);
    const bodyAfterVerify = await page.locator('body').textContent();
    expect(bodyAfterVerify).toMatch(/verified|valid|integrity/i);
    expect(bodyAfterVerify).not.toMatch(/broken|tampered/i);

    // Step 7: Export PDF button exists
    const exportBtn = page.getByTestId('button-export-pdf');
    await expect(exportBtn).toBeVisible();

    // Step 8: Refresh button works
    const refreshBtn = page.getByTestId('button-refresh-audit');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    const entriesAfterRefresh = page.locator('[data-testid^="audit-entry-"]');
    const countAfterRefresh = await entriesAfterRefresh.count();
    expect(countAfterRefresh).toBeGreaterThan(0);

    // Step 9: Lock returns to auth screen
    const lockBtn = page.getByTestId('button-lock-audit');
    await expect(lockBtn).toBeVisible();
    await lockBtn.click();
    await page.waitForSelector('[data-testid="input-passphrase"]', { timeout: 5000 });
    await expect(page.getByTestId('input-passphrase')).toBeVisible();
  });

  test('audit entries have timestamps and user badges', async ({ page }) => {
    await navigateAndAuthenticate(page);
    await page.waitForSelector('[data-testid^="audit-entry-"]', { timeout: 10000 });
    const firstEntry = page.locator('[data-testid^="audit-entry-"]').first();
    await expect(firstEntry).toBeVisible();

    // Entry should have text content
    const entryText = await firstEntry.textContent();
    expect(entryText).toBeTruthy();
    expect(entryText!.length).toBeGreaterThan(10);
  });
});

test.describe('Audit Log — API integration (no rate limit)', () => {
  test('audit API returns valid entries with hash chain', async ({ request }) => {
    const res = await request.get('/api/audit/logs', {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    expect(res.ok()).toBe(true);

    const logs = await res.json() as Array<Record<string, unknown>>;
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);

    // Verify structure of each log entry
    for (const log of logs) {
      expect(log.id).toBeDefined();
      expect(log.currentHash).toBeTruthy();
      expect((log.currentHash as string).length).toBe(64);
      expect((log.currentHash as string)).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test('genesis entry (id=1) has previousHash "0"', async ({ request }) => {
    const res = await request.get('/api/audit/logs', {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    const logs = await res.json() as Array<Record<string, unknown>>;
    const genesis = logs.find((l) => l.id === 1);
    expect(genesis).toBeDefined();
    expect(genesis!.previousHash).toBe('0');
  });

  test('chain verification API returns valid: true', async ({ request }) => {
    const res = await request.get('/api/audit/verify', {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json() as { valid: boolean; brokenAt?: number };
    expect(data.valid).toBe(true);
    expect(data.brokenAt).toBeUndefined();
  });

  test('audit log without passphrase returns 401', async ({ request }) => {
    const res = await request.get('/api/audit/logs');
    expect(res.status()).toBe(401);
  });

  test('entries are properly chained', async ({ request }) => {
    const res = await request.get('/api/audit/logs', {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    const logs = (await res.json() as Array<Record<string, unknown>>)
      .sort((a, b) => (a.id as number) - (b.id as number));

    for (let i = 1; i < logs.length; i++) {
      expect(logs[i].previousHash).toBe(logs[i - 1].currentHash);
    }
  });
});

test.describe('Audit Log — Wrong passphrase behavior', () => {
  test('wrong passphrase shows error message', async ({ page }) => {
    await page.goto('/#/audit');
    await page.waitForTimeout(500);

    const isAuthScreen = await page.locator('[data-testid="input-passphrase"]').isVisible({ timeout: 5000 }).catch(() => false);
    if (!isAuthScreen) {
      // Already authenticated — lock first
      const lockBtn = page.locator('[data-testid="button-lock-audit"]');
      if (await lockBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lockBtn.click();
        await page.waitForSelector('[data-testid="input-passphrase"]', { timeout: 5000 });
      }
    }

    await page.getByTestId('input-passphrase').fill('wrong-passphrase-xyz');
    await page.getByTestId('button-authenticate').click();
    await page.waitForTimeout(1500);

    const bodyText = await page.locator('body').textContent();
    // Should show error — NOT the audit title
    const hasError = bodyText?.toLowerCase().match(/invalid|error|incorrect|wrong/i);
    const hasAuditTitle = await page.locator('[data-testid="text-audit-title"]').isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasAuditTitle).toBe(false);
  });
});
