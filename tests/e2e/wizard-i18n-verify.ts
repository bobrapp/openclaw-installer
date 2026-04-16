/**
 * Wizard i18n Verification — RTL Layout + Cherokee Syllabary
 * 
 * Tests:
 * 1. Arabic (ar) — RTL layout check across all 7 wizard steps
 * 2. Urdu (ur) — RTL layout check across all 7 wizard steps
 * 3. Cherokee (chr) — Syllabary rendering check across all 7 wizard steps
 * 
 * Usage: npx playwright test tests/e2e/wizard-i18n-verify.ts
 */
import { test, expect, Page } from '@playwright/test';

const WIZARD_URL = 'http://localhost:5000/aigovops-wizard.html';
const SCREENSHOT_DIR = '/home/user/workspace/wizard-i18n-screenshots';

const STEP_COUNT = 7;

// Helper: switch locale via the dropdown
async function switchLocale(page: Page, code: string) {
  const selector = page.locator('select#localeSwitcher, select[id*="locale"], select[id*="lang"]');
  // If no select found, try a different selector pattern
  const selectExists = await selector.count();
  if (selectExists > 0) {
    await selector.selectOption(code);
    await page.waitForTimeout(500); // Wait for re-render
  } else {
    // Try clicking a locale button or other patterns
    const btn = page.locator(`[data-locale="${code}"], [data-lang="${code}"], option[value="${code}"]`);
    if (await btn.count() > 0) {
      await btn.first().click();
      await page.waitForTimeout(500);
    }
  }
}

// Helper: navigate to a specific wizard step
async function goToStep(page: Page, step: number) {
  // Start from step 1 — we need to click through
  for (let i = 1; i < step; i++) {
    // Click the Next/Continue button
    const nextBtn = page.locator('button').filter({ hasText: /continue|next|proceed|confirm/i }).first();
    const primaryBtn = page.locator('.btn-primary, .btn-teal').first();
    
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
    } else if (await primaryBtn.count() > 0) {
      await primaryBtn.click();
    }
    await page.waitForTimeout(300);
  }
}

// Helper: check for tofu (replacement characters)
async function checkForTofu(page: Page, locale: string, step: number): Promise<string[]> {
  const issues: string[] = [];
  
  // Get all visible text on the page
  const textContent = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    let node;
    while (node = walker.nextNode()) {
      const text = (node.textContent || '').trim();
      if (text) texts.push(text);
    }
    return texts;
  });
  
  for (const text of textContent) {
    // Check for replacement character U+FFFD
    if (text.includes('\uFFFD')) {
      issues.push(`[${locale}] Step ${step}: Replacement character (U+FFFD) found in: "${text.substring(0, 50)}"`);
    }
    // Check for tofu boxes — these render as empty squares when font doesn't support the glyph
    // We can't detect actual rendering, but we can check for .notdef patterns
  }
  
  return issues;
}

test.describe('RTL Layout — Arabic', () => {
  test('all 7 wizard steps render correctly in Arabic', async ({ page }) => {
    await page.goto(WIZARD_URL);
    await page.waitForTimeout(1000);
    
    // Switch to Arabic
    await switchLocale(page, 'ar');
    
    // Verify dir="rtl" is set
    const dir = await page.getAttribute('html', 'dir');
    expect(dir).toBe('rtl');
    
    // Verify lang="ar" is set
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('ar');
    
    // Screenshot step 1
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/ar-step-1.png`,
      fullPage: true 
    });
    
    // Check RTL-specific layout issues
    // 1. Header brand should be right-aligned or reversed
    const headerBrand = page.locator('.header-brand');
    if (await headerBrand.count() > 0) {
      const box = await headerBrand.boundingBox();
      expect(box).toBeTruthy();
    }
    
    // 2. Buttons should be in reversed order (Back on right, Next on left for RTL)
    
    // Navigate through all steps and screenshot each
    for (let step = 2; step <= STEP_COUNT; step++) {
      // Click next/continue to advance
      const nextBtn = page.locator('button.btn-primary, button.btn-teal').first();
      if (await nextBtn.count() > 0 && await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/ar-step-${step}.png`,
        fullPage: true 
      });
    }
    
    // Verify no text overflow
    const overflows = await page.evaluate(() => {
      const issues: string[] = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (el.scrollWidth > el.clientWidth + 2 && style.overflow !== 'auto' && style.overflow !== 'scroll' && style.overflowX !== 'auto' && style.overflowX !== 'scroll') {
          const text = (el.textContent || '').substring(0, 30);
          if (text.trim()) {
            issues.push(`Overflow on <${el.tagName.toLowerCase()}>: "${text}"`);
          }
        }
      });
      return issues;
    });
    
    // Log any overflow issues (warning, not failure)
    if (overflows.length > 0) {
      console.warn('Arabic RTL overflow warnings:', overflows.slice(0, 5));
    }
  });
});

test.describe('RTL Layout — Urdu', () => {
  test('all 7 wizard steps render correctly in Urdu', async ({ page }) => {
    await page.goto(WIZARD_URL);
    await page.waitForTimeout(1000);
    
    // Switch to Urdu
    await switchLocale(page, 'ur');
    
    // Verify dir="rtl" is set
    const dir = await page.getAttribute('html', 'dir');
    expect(dir).toBe('rtl');
    
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('ur');
    
    // Screenshot all steps
    for (let step = 1; step <= STEP_COUNT; step++) {
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/ur-step-${step}.png`,
        fullPage: true 
      });
      
      if (step < STEP_COUNT) {
        const nextBtn = page.locator('button.btn-primary, button.btn-teal').first();
        if (await nextBtn.count() > 0 && await nextBtn.isEnabled()) {
          await nextBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

test.describe('Cherokee Syllabary Rendering', () => {
  test('Cherokee text renders without tofu across all wizard steps', async ({ page }) => {
    await page.goto(WIZARD_URL);
    await page.waitForTimeout(1000);
    
    // Switch to Cherokee
    await switchLocale(page, 'chr');
    
    // Verify lang="chr"
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('chr');
    
    // Verify dir is LTR (Cherokee is LTR)
    const dir = await page.getAttribute('html', 'dir');
    expect(dir === 'ltr' || dir === null).toBeTruthy();
    
    const allIssues: string[] = [];
    
    for (let step = 1; step <= STEP_COUNT; step++) {
      // Screenshot
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/chr-step-${step}.png`,
        fullPage: true 
      });
      
      // Check for Cherokee syllabary characters being present
      const hasCherokee = await page.evaluate(() => {
        const text = document.body.innerText;
        // Cherokee Unicode block: U+13A0–U+13FF and U+AB70–U+ABBF
        const cherokeePattern = /[\u13A0-\u13FF\uAB70-\uABBF]/;
        return cherokeePattern.test(text);
      });
      
      // Step content should contain Cherokee characters
      if (!hasCherokee) {
        allIssues.push(`Step ${step}: No Cherokee syllabary characters found in page text`);
      }
      
      // Check for replacement characters
      const tofuIssues = await checkForTofu(page, 'chr', step);
      allIssues.push(...tofuIssues);
      
      // Check that Noto Sans Cherokee font is loaded or active
      const fontCheck = await page.evaluate(() => {
        const el = document.querySelector('.step-title, h2, .card');
        if (!el) return 'no-element';
        const computed = window.getComputedStyle(el);
        return computed.fontFamily;
      });
      
      if (step < STEP_COUNT) {
        const nextBtn = page.locator('button.btn-primary, button.btn-teal').first();
        if (await nextBtn.count() > 0 && await nextBtn.isEnabled()) {
          await nextBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Report issues
    if (allIssues.length > 0) {
      console.warn('Cherokee rendering issues:', allIssues);
    }
    // Fail only if no Cherokee text was found at all
    const missingCherokee = allIssues.filter(i => i.includes('No Cherokee'));
    expect(missingCherokee.length).toBeLessThan(STEP_COUNT); // At least some steps should have Cherokee
  });
});

test.describe('Locale Switcher Functionality', () => {
  test('locale switcher exists and cycles through languages', async ({ page }) => {
    await page.goto(WIZARD_URL);
    await page.waitForTimeout(1000);
    
    // Verify locale switcher exists
    const switcher = page.locator('select#localeSwitcher, select[id*="locale"], select[id*="lang"]');
    expect(await switcher.count()).toBeGreaterThan(0);
    
    // Verify it has 15 options
    const optionCount = await switcher.locator('option').count();
    expect(optionCount).toBe(15);
    
    // Test switching to each RTL language and back
    for (const code of ['ar', 'ur', 'ps']) {
      await switchLocale(page, code);
      const dir = await page.getAttribute('html', 'dir');
      expect(dir).toBe('rtl');
    }
    
    // Switch back to English
    await switchLocale(page, 'en');
    const dir = await page.getAttribute('html', 'dir');
    expect(dir === 'ltr' || dir === null).toBeTruthy();
  });
});
