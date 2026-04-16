# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: standalone-wizard-smoke.spec.ts >> Standalone Wizard — macOS (macos) >> completes full dry-run flow end-to-end
- Location: tests/e2e/standalone-wizard-smoke.spec.ts:75:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.evaluate: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.progress-fill')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - img "AiGovOps Shield Logo" [ref=e4]:
        - generic [ref=e9]: AI
      - generic [ref=e10]:
        - generic [ref=e11]: AiGovOps Foundation Framework
        - generic [ref=e12]: April 2026 v1 — OpenClaw Installer
    - button "🌙 Dark" [ref=e14] [cursor=pointer]:
      - generic [ref=e15]: 🌙
      - text: Dark
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: ✓
          - generic [ref=e22]: Welcome
        - generic [ref=e24]:
          - generic [ref=e25]: ✓
          - generic [ref=e26]: Configuration
        - generic [ref=e28]:
          - generic [ref=e29]: ✓
          - generic [ref=e30]: Security
        - generic [ref=e32]:
          - generic [ref=e33]: ✓
          - generic [ref=e34]: Review
        - generic [ref=e36]:
          - generic [ref=e37]: ✓
          - generic [ref=e38]: Dry Run
        - generic [ref=e40]:
          - generic [ref=e41]: ✓
          - generic [ref=e42]: Install
        - generic [ref=e44]:
          - generic [ref=e45]: "7"
          - generic [ref=e46]: Audit Log
      - generic [ref=e50]:
        - generic [ref=e51]:
          - generic [ref=e52]: "7"
          - heading "Version Log & Audit Trail" [level=2] [ref=e53]
        - paragraph [ref=e54]: Cryptographically chained audit log of all actions taken during this wizard session. Each entry includes a SHA-256 hash computed over its content plus the previous entry's hash (tamper-evident chain). Secrets and PII are never included.
        - generic [ref=e55]:
          - generic [ref=e56]:
            - generic [ref=e57]: 2026-04-16T03:37:11.407Z
            - generic [ref=e58]: "#1 — Wizard session started"
            - generic [ref=e59]: "Result: Initialized"
            - generic [ref=e60]: "SHA-256: 6616b944955c457d6ba8cab695799dde1b01442c75e0c1ca5bfbf0f9761d5fde"
            - generic [ref=e61]: "Prev: 00000000000000000000000000000000…"
          - generic [ref=e62]:
            - generic [ref=e63]: 2026-04-16T03:37:12.420Z
            - generic [ref=e64]: "#2 — Configuration saved"
            - generic [ref=e65]: "Result: Success"
            - generic [ref=e66]: "SHA-256: 8b19fa4b2a96c1fc9f6d09dbd7dbdf27f26cd073f2a366241618a32d2741304a"
            - generic [ref=e67]: "Prev: 6616b944955c457d6ba8cab695799dde…"
          - generic [ref=e68]:
            - generic [ref=e69]: 2026-04-16T03:37:12.821Z
            - generic [ref=e70]: "#3 — Security checklist confirmed"
            - generic [ref=e71]: "Result: Success"
            - generic [ref=e72]: "SHA-256: 7cc4460368627b24b56768a027bdb470c3ff9527485219868d9cb0914d8f34a7"
            - generic [ref=e73]: "Prev: 8b19fa4b2a96c1fc9f6d09dbd7dbdf27…"
          - generic [ref=e74]:
            - generic [ref=e75]: 2026-04-16T03:37:13.254Z
            - generic [ref=e76]: "#4 — Configuration review confirmed"
            - generic [ref=e77]: "Result: Success"
            - generic [ref=e78]: "SHA-256: a06ab59e0170b62e6e6422b7adc6b74f81e701bc04cc14304bbeddb9e9713ca6"
            - generic [ref=e79]: "Prev: 7cc4460368627b24b56768a027bdb470…"
          - generic [ref=e80]:
            - generic [ref=e81]: 2026-04-16T03:37:18.336Z
            - generic [ref=e82]: "#5 — Dry run completed"
            - generic [ref=e83]: "Result: Success"
            - generic [ref=e84]: "SHA-256: 37d0f2eb6632ddda68d974c874ecf7aaac5387bc7a999067192973d7d9eaf7c9"
            - generic [ref=e85]: "Prev: a06ab59e0170b62e6e6422b7adc6b74f…"
          - generic [ref=e86]:
            - generic [ref=e87]: 2026-04-16T03:37:20.431Z
            - generic [ref=e88]: "#6 — Install step: Validate configuration"
            - generic [ref=e89]: "Result: Completed"
            - generic [ref=e90]: "SHA-256: 0639367a729c67a8c381d54f7d70d4564d9814d86e297e4dc5d6d2841c3f6bfa"
            - generic [ref=e91]: "Prev: 37d0f2eb6632ddda68d974c874ecf7aa…"
          - generic [ref=e92]:
            - generic [ref=e93]: 2026-04-16T03:37:21.840Z
            - generic [ref=e94]: "#7 — Install step: Install Node.js dependencies (npm install)"
            - generic [ref=e95]: "Result: Completed"
            - generic [ref=e96]: "SHA-256: 3d57ead3463ee19e75c20557fc3645e3422a1f1a35894efaa4658eb0b87ea86c"
            - generic [ref=e97]: "Prev: 0639367a729c67a8c381d54f7d70d456…"
          - generic [ref=e98]:
            - generic [ref=e99]: 2026-04-16T03:37:23.025Z
            - generic [ref=e100]: "#8 — Install step: Clone OpenClaw repository"
            - generic [ref=e101]: "Result: Completed"
            - generic [ref=e102]: "SHA-256: dfe1d2f95108ad336121b83fe3f18c8317377f9c7ca69e413efaaa2c961ef31d"
            - generic [ref=e103]: "Prev: 3d57ead3463ee19e75c20557fc3645e3…"
          - generic [ref=e104]:
            - generic [ref=e105]: 2026-04-16T03:37:24.501Z
            - generic [ref=e106]: "#9 — Install step: Apply security hardening patches"
            - generic [ref=e107]: "Result: Completed"
            - generic [ref=e108]: "SHA-256: 91ef1cbc249928489906c5c5d11fd3c7530215f653cff43c0d38baf0fb3e26b0"
            - generic [ref=e109]: "Prev: dfe1d2f95108ad336121b83fe3f18c83…"
          - generic [ref=e110]:
            - generic [ref=e111]: 2026-04-16T03:37:25.653Z
            - generic [ref=e112]: "#10 — Install step: Register macOS LaunchAgent plist"
            - generic [ref=e113]: "Result: Completed"
            - generic [ref=e114]: "SHA-256: fdcaece917b71e3dc668ad0e0b2277ac168246bf66e6e0a4979227d3509976f8"
            - generic [ref=e115]: "Prev: 91ef1cbc249928489906c5c5d11fd3c7…"
          - generic [ref=e116]:
            - generic [ref=e117]: 2026-04-16T03:37:26.863Z
            - generic [ref=e118]: "#11 — Install step: Store secrets in Keychain"
            - generic [ref=e119]: "Result: Completed"
            - generic [ref=e120]: "SHA-256: 067136c37e05509b1be2f2d9e53ba525f378a6bc9c8152467d054baf16571a55"
            - generic [ref=e121]: "Prev: fdcaece917b71e3dc668ad0e0b2277ac…"
          - generic [ref=e122]:
            - generic [ref=e123]: 2026-04-16T03:37:28.226Z
            - generic [ref=e124]: "#12 — Install step: Configure log rotation"
            - generic [ref=e125]: "Result: Completed"
            - generic [ref=e126]: "SHA-256: 506ffd82c34c1353985af7d258bb257db017250d02a0742046173042a6f7993d"
            - generic [ref=e127]: "Prev: 067136c37e05509b1be2f2d9e53ba525…"
          - generic [ref=e128]:
            - generic [ref=e129]: 2026-04-16T03:37:29.651Z
            - generic [ref=e130]: "#13 — Install step: Start gateway service"
            - generic [ref=e131]: "Result: Completed"
            - generic [ref=e132]: "SHA-256: c624dc4b7ae5d52b3605b3f429f9f7e7cc4e65acdaa878f408722f80ebc2f6ab"
            - generic [ref=e133]: "Prev: 506ffd82c34c1353985af7d258bb257d…"
          - generic [ref=e134]:
            - generic [ref=e135]: 2026-04-16T03:37:30.879Z
            - generic [ref=e136]: "#14 — Install step: Initialize audit log chain"
            - generic [ref=e137]: "Result: Completed"
            - generic [ref=e138]: "SHA-256: d9f2f7114eaeebc9c408750312344b2c1361dbaf807781d66810ccad0b789783"
            - generic [ref=e139]: "Prev: c624dc4b7ae5d52b3605b3f429f9f7e7…"
          - generic [ref=e140]:
            - generic [ref=e141]: 2026-04-16T03:37:32.133Z
            - generic [ref=e142]: "#15 — Install step: Run post-install health check"
            - generic [ref=e143]: "Result: Completed"
            - generic [ref=e144]: "SHA-256: 0f90b9d1b7b7eb649b3072bc699a54d7385419cc5117b31f17903d56e7426d73"
            - generic [ref=e145]: "Prev: d9f2f7114eaeebc9c408750312344b2c…"
          - generic [ref=e146]:
            - generic [ref=e147]: 2026-04-16T03:37:33.547Z
            - generic [ref=e148]: "#16 — Install step: Write install manifest"
            - generic [ref=e149]: "Result: Completed"
            - generic [ref=e150]: "SHA-256: 886f7425c110e9a9bd0d57df845daeb0c34f94aa6d3a96fa4a36845712ed2ca7"
            - generic [ref=e151]: "Prev: 0f90b9d1b7b7eb649b3072bc699a54d7…"
        - generic [ref=e153]:
          - button "⬇ Export as JSON" [ref=e154] [cursor=pointer]
          - generic [ref=e155]: 16 entries — hash chain verifiable client-side
        - generic [ref=e157]:
          - strong [ref=e158]: AiGovOps Foundation Framework — April 2026 v1
          - text: This audit trail was generated in-browser using the Web Crypto API (SubtleCrypto SHA-256).
          - text: "Each entry's hash is computed as SHA-256(JSON({ts, action, result, prevHash}))."
          - text: No data was transmitted to any server during this session.
          - text: A work of
          - strong [ref=e159]: Bob Rapp
          - text: and
          - strong [ref=e160]: Ken Johnston
          - text: —
          - link "www.aigovopsfoundation.org" [ref=e161] [cursor=pointer]:
            - /url: https://www.aigovopsfoundation.org
        - generic [ref=e162]:
          - button "← Back" [ref=e163] [cursor=pointer]
          - button "🔄 Start New Session" [ref=e164] [cursor=pointer]
  - contentinfo [ref=e165]:
    - text: AiGovOps Foundation —
    - link "www.aigovopsfoundation.org" [ref=e166] [cursor=pointer]:
      - /url: https://www.aigovopsfoundation.org
    - text: — A work of Bob Rapp and Ken Johnston
```

# Test source

```ts
  100 |       expect(reviewBody).toContain(label);
  101 |       await clickNext(page);
  102 | 
  103 |       // ── Step 5: Dry Run (Preflight) ──
  104 |       await waitForStep(page, 5);
  105 |       // Verify the host name shows in the description
  106 |       await expect(page.locator('.step-desc')).toContainText(label);
  107 | 
  108 |       // Click "Run Preflight Checks"
  109 |       const dryRunBtn = page.locator('#runDryBtn');
  110 |       await expect(dryRunBtn).toBeVisible();
  111 |       await dryRunBtn.click();
  112 | 
  113 |       // Wait for dry run to complete — look for the summary to appear
  114 |       // The summary shows "X passed", "X warnings", "X failed"
  115 |       await expect(
  116 |         page.locator('.dry-run-summary')
  117 |       ).toBeVisible({ timeout: 30_000 });
  118 | 
  119 |       // Verify all checks passed (0 failed)
  120 |       const summaryText = await page.locator('.dry-run-summary').textContent();
  121 |       expect(summaryText).toContain('0 failed');
  122 | 
  123 |       // Verify individual check rows rendered
  124 |       const checkRows = page.locator('.check-row');
  125 |       const checkCount = await checkRows.count();
  126 |       expect(checkCount).toBeGreaterThanOrEqual(5); // at least 5 common + host-specific
  127 | 
  128 |       // All rows should be pass or warn (none fail)
  129 |       const failedRows = page.locator('.check-row.fail');
  130 |       expect(await failedRows.count()).toBe(0);
  131 | 
  132 |       // "Proceed to Install" button should now be available
  133 |       const proceedBtn = page.locator('button', { hasText: /Proceed to Install/ });
  134 |       await expect(proceedBtn).toBeVisible({ timeout: 5_000 });
  135 |       await proceedBtn.click();
  136 | 
  137 |       // ── Step 6: Execute Install ──
  138 |       await waitForStep(page, 6);
  139 | 
  140 |       // Click "Begin Installation"
  141 |       const installBtn = page.locator('#runInstallBtn');
  142 |       await expect(installBtn).toBeVisible();
  143 |       await installBtn.click();
  144 | 
  145 |       // Wait for "Installation Complete!" message
  146 |       await expect(
  147 |         page.locator('.install-complete-title')
  148 |       ).toBeVisible({ timeout: 60_000 });
  149 |       await expect(
  150 |         page.locator('.install-complete-title')
  151 |       ).toContainText('Installation Complete');
  152 | 
  153 |       // Verify the install complete message mentions the host
  154 |       await expect(
  155 |         page.locator('.install-complete-msg')
  156 |       ).toContainText(label);
  157 | 
  158 |       // Click "View Audit Log →"
  159 |       const auditBtn = page.locator('button', { hasText: /View Audit Log/ });
  160 |       await expect(auditBtn).toBeVisible();
  161 |       await auditBtn.click();
  162 | 
  163 |       // ── Step 7: Audit Log ──
  164 |       await waitForStep(page, 7);
  165 | 
  166 |       // Verify audit entries exist
  167 |       const auditEntries = page.locator('.audit-entry');
  168 |       const entryCount = await auditEntries.count();
  169 |       expect(entryCount).toBeGreaterThanOrEqual(5); // session start + dry run + install steps
  170 | 
  171 |       // Verify each entry has a SHA-256 hash
  172 |       for (let i = 0; i < Math.min(entryCount, 3); i++) {
  173 |         const hashText = await auditEntries.nth(i).locator('.audit-hash').textContent();
  174 |         expect(hashText).toMatch(/SHA-256:\s*[a-f0-9]{64}/);
  175 |       }
  176 | 
  177 |       // Verify prev-hash chain linkage (each entry references previous)
  178 |       const firstEntry = auditEntries.first();
  179 |       const prevHashText = await firstEntry.locator('.audit-prev-hash').textContent();
  180 |       // Genesis entry's prevHash is all zeros (displayed truncated with …)
  181 |       expect(prevHashText).toMatch(/Prev:\s*0{32}/);
  182 | 
  183 |       // Verify the export button is present
  184 |       await expect(
  185 |         page.locator('button', { hasText: /Export as JSON/ })
  186 |       ).toBeVisible();
  187 | 
  188 |       // Verify the audit log count in the footer text
  189 |       const footerText = await page.locator('#stepContent').textContent();
  190 |       expect(footerText).toContain('entries');
  191 |       expect(footerText).toContain('hash chain verifiable');
  192 | 
  193 |       // Verify AiGovOps Foundation branding
  194 |       expect(footerText).toContain('AiGovOps Foundation');
  195 |       expect(footerText).toContain('Bob Rapp');
  196 |       expect(footerText).toContain('Ken Johnston');
  197 | 
  198 |       // Verify progress bar is at 100%
  199 |       const fill = page.locator('.progress-fill');
> 200 |       const width = await fill.evaluate((el) => el.style.width);
      |                                ^ Error: locator.evaluate: Test timeout of 120000ms exceeded.
  201 |       expect(width).toBe('100%');
  202 | 
  203 |       // All step bubbles before step 7 should be done
  204 |       const doneBubbles = page.locator('.step-bubble.done');
  205 |       expect(await doneBubbles.count()).toBe(6);
  206 |     });
  207 | 
  208 |   });
  209 | 
  210 | }
  211 | 
  212 | /* ────────────────────────────────────────────
  213 |    Cross-host: restart wizard resets state
  214 |    ──────────────────────────────────────────── */
  215 | 
  216 | test('restart wizard resets to Step 1 with macOS default', async ({ page }) => {
  217 |   await page.goto(WIZARD_URL);
  218 |   await page.waitForLoadState('domcontentloaded');
  219 |   await waitForStep(page, 1);
  220 | 
  221 |   // Select a non-default host
  222 |   await selectHost(page, 'azure');
  223 |   await clickNext(page);
  224 |   await waitForStep(page, 2);
  225 | 
  226 |   // Navigate back and restart is implicitly tested via a fresh session
  227 |   // but let's test the explicit restart button (accessible from Step 7)
  228 |   // For now, just verify going back preserves the host
  229 |   const backBtn = page.locator('button', { hasText: /← Back/ });
  230 |   await backBtn.click();
  231 |   await waitForStep(page, 1);
  232 | 
  233 |   // Azure should still be selected
  234 |   const azureCard = page.locator('label.radio-card', {
  235 |     has: page.locator('input[value="azure"]'),
  236 |   });
  237 |   await expect(azureCard).toHaveClass(/selected/);
  238 | });
  239 | 
  240 | test('dark mode toggle works on standalone wizard', async ({ page }) => {
  241 |   await page.goto(WIZARD_URL);
  242 |   await page.waitForLoadState('domcontentloaded');
  243 | 
  244 |   // Should start in light mode
  245 |   const html = page.locator('html');
  246 |   await expect(html).toHaveAttribute('data-theme', 'light');
  247 | 
  248 |   // Click dark mode toggle
  249 |   const toggle = page.locator('.dark-toggle');
  250 |   await toggle.click();
  251 |   await expect(html).toHaveAttribute('data-theme', 'dark');
  252 | 
  253 |   // Toggle back
  254 |   await toggle.click();
  255 |   await expect(html).toHaveAttribute('data-theme', 'light');
  256 | });
  257 | 
```