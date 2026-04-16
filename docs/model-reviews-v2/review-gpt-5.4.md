# Council Review — GPT-5.4

Below is the next round of improvements I would prioritize for the OpenClaw Guided Install codebase.

## 1) Route queries should go through `apiRequest` and support cancellation
- **Files affected:** `client/src/lib/queryClient.ts`
- **Problem:** The default TanStack Query fetcher still calls raw `fetch()` directly at line 37, even though the project standard is to route client HTTP through `apiRequest`. It also ignores React Query's `signal`, so route changes cannot abort in-flight requests.
- **Solution:** Make `getQueryFn()` delegate to `apiRequest()` and thread through `AbortSignal`.
  ```ts
  export async function apiRequest(
    method: string,
    url: string,
    data?: unknown,
    extraHeaders?: Record<string, string>,
    signal?: AbortSignal,
  ) {
    return fetch(`${API_BASE}${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal,
      credentials: "include",
    });
  }

  export const getQueryFn = <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
    async ({ queryKey, signal }) => {
      const res = await apiRequest("GET", String(queryKey[0]), undefined, undefined, signal);
      ...
    };
  ```
- **Effort:** Low
- **Impact:** High

## 2) Fix the broken log-archive workflow
- **Files affected:** `client/src/pages/logs.tsx`, `server/routes.ts`
- **Problem:** `logs.tsx` still calls `DELETE /api/logs` at lines 25-30, but `server/routes.ts` explicitly removed that route and replaced it with `POST /api/logs/archive` at lines 89-100. The current “Clear” button is dead functionality.
- **Solution:** Replace the mutation with the archive endpoint and update the UX copy to match the immutable-log model.
  ```ts
  const archiveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logs/archive"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/logs"] }),
  });
  ```
  Also rename the button from **Clear** to **Archive Logs** and show the archived count returned by the API.
- **Effort:** Low
- **Impact:** High

## 3) Stop keeping the owner passphrase in React state after authentication
- **Files affected:** `client/src/pages/audit-log.tsx`, `client/src/lib/queryClient.ts`, `server/routes.ts`
- **Problem:** `audit-log.tsx` stores the passphrase in `storedPassphrase` and re-sends it in request headers on every authenticated request (lines 37-45, 77-99, 262-266). That keeps a sensitive secret live in component memory longer than necessary and makes every request depend on raw secret replay.
- **Solution:** After successful verification, issue a short-lived server session cookie and stop retaining the passphrase in the client.
  - `POST /api/owner/verify` should set an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
  - Protected routes should validate that cookie instead of `x-owner-passphrase`.
  - `apiRequest()` should send `credentials: "include"`.
  - `Lock` should call a logout endpoint that clears the cookie.
- **Effort:** Medium
- **Impact:** High

## 4) Strengthen owner authentication and brute-force protection
- **Files affected:** `server/routes.ts`, storage/auth implementation behind `storage.*`
- **Problem:** The passphrase setup only enforces a 6-character minimum at lines 248-255. Verification returns a plain `{ valid }` boolean at lines 261-264, and rate limiting only wraps the verify endpoint. That is weak for the only privileged control in the app.
- **Solution:**
  1. Raise the minimum length and require basic entropy.
  2. Store the passphrase with `argon2id` or `scrypt`, not a fast hash.
  3. Add exponential backoff / lockout windows on failed verification.
  4. Apply rate limiting to *all* owner-auth endpoints, not just `/api/owner/verify`.
  5. Return consistent 401/429 responses without extra signal.
- **Effort:** Medium
- **Impact:** High

## 5) Eliminate API contract drift with shared schemas
- **Files affected:** `client/src/pages/preflight-runner.tsx`, `client/src/pages/logs.tsx`, `server/routes.ts`, new shared file such as `shared/api.ts`
- **Problem:** There are already contract mismatches:
  - `preflight-runner.tsx` checks `data.result === "PASS"` at line 61, but `server/routes.ts` emits `"READY"` or `"BLOCKED"` at lines 184-185.
  - `logs.tsx` still calls a deleted endpoint.
  These are signs that the client and server are evolving separately.
- **Solution:** Define shared Zod schemas and TS types for all API responses and SSE payloads in one shared module, then import them on both sides.
  ```ts
  export const PreflightSummarySchema = z.object({
    type: z.literal("summary"),
    passed: z.number(),
    warned: z.number(),
    failed: z.number(),
    result: z.enum(["READY", "BLOCKED"]),
  });
  ```
  This should cover logs archive responses, audit verification, release dashboard payloads, and preflight events.
- **Effort:** Medium
- **Impact:** High

## 6) Do not call `lazy()` inside render for every route
- **Files affected:** `client/src/App.tsx`, `client/src/lib/routes.ts`
- **Problem:** `AppRouter()` calls `lazy(route.lazy)` inside the render loop at lines 61-68. That creates a fresh component type every render, which can trigger unnecessary remounts and weaken Suspense caching behavior.
- **Solution:** Precompute lazy components once in the route manifest.
  ```ts
  export interface RouteEntry {
    path: string;
    component: React.LazyExoticComponent<React.ComponentType>;
    ...
  }

  export const allRoutes = [
    { path: "/", component: lazy(() => import("@/pages/home")), ... },
  ];
  ```
  Then render `component={route.component}` directly.
- **Effort:** Low
- **Impact:** Medium

## 7) Finish localization for the pages that are still English-only
- **Files affected:** `client/src/pages/compare.tsx`, `foundation.tsx`, `hardening.tsx`, `hosting-deals.tsx`, `how-i-built-this.tsx`, `logs.tsx`, `not-found.tsx`, `releases.tsx`, `scripts.tsx`, `wizard.tsx`, plus `client/src/lib/i18n.tsx` locale JSON files
- **Problem:** A code scan shows 10 page modules still do not import `useI18n()`. That means major surface area bypasses the 15-language system entirely.
- **Solution:**
  1. Add translation keys for all page titles, descriptions, button labels, status text, and empty states.
  2. Move repeated host labels into shared translation keys instead of per-page switch statements.
  3. Add a test that fails when a page renders hard-coded English UI strings outside approved config/script content.
- **Effort:** High
- **Impact:** High

## 8) Make language switching race-safe and sync `dir/lang` on mount
- **Files affected:** `client/src/lib/i18n.tsx`
- **Problem:** `setLang()` at lines 245-255 starts an async import and applies the result without guarding against out-of-order resolution. Rapid language changes can apply stale translations. Also, `document.documentElement.dir/lang` is only updated inside `setLang()`, so the initial mount never explicitly syncs DOM attributes.
- **Solution:** Track a request id and ignore stale completions; move DOM attribute updates into an effect keyed by `lang`.
  ```ts
  const reqId = useRef(0);
  const setLang = useCallback(async (code: LangCode) => {
    const id = ++reqId.current;
    setLoading(true);
    const translations = await loadLanguage(code);
    if (id !== reqId.current) return;
    setT(translations);
    setLangState(code);
    setLoading(false);
  }, []);

  useEffect(() => {
    const meta = ...;
    document.documentElement.dir = meta.dir;
    document.documentElement.lang = lang === "brl" ? "en" : lang;
  }, [lang]);
  ```
- **Effort:** Medium
- **Impact:** Medium

## 9) Consolidate clipboard and file-download behavior into shared hooks
- **Files affected:** `client/src/hooks/use-copy-to-clipboard.ts`, `client/src/pages/wizard.tsx`, `scripts.tsx`, `hardening.tsx`, `hosting-deals.tsx`, `audit-log.tsx`, `client/src/components/config-card.tsx`
- **Problem:** Clipboard and blob-download logic is duplicated across at least five page modules. The same `navigator.clipboard.writeText`, `URL.createObjectURL`, and anchor-click flow appears repeatedly, which increases inconsistency and bug risk.
- **Solution:**
  - Keep `useCopyToClipboard` as the single clipboard abstraction.
  - Add a sibling `useDownloadTextFile()` hook for shell scripts and PDFs.
  - Standardize success/error toasts in one place.
  - Clean up timeouts inside the hook to avoid stale state updates after unmount.
- **Effort:** Medium
- **Impact:** Medium

## 10) Make script generation a single source of truth
- **Files affected:** `client/src/pages/wizard.tsx`, `client/src/pages/scripts.tsx`, `server/routes.ts`
- **Problem:** Script authoring is split between server-side generators and a large block of client-side string builders in `wizard.tsx` (starting around line 356 and continuing through the rest of the file). That creates drift risk between the wizard preview, the scripts page, and the backend script endpoints.
- **Solution:** Move all script generation to one shared layer.
  - Best option: server returns a structured step payload:
    ```ts
    GET /api/wizard/:hostTarget
    {
      steps: [{ id, title, description, script, rollbackScript? }]
    }
    ```
  - Alternate option: create a shared pure module under `shared/` imported by both client and server.
- **Effort:** High
- **Impact:** High

## 11) Harden the SSE preflight runner against malformed events and unmount leaks
- **Files affected:** `client/src/pages/preflight-runner.tsx`, `server/routes.ts`
- **Problem:**
  - `JSON.parse(event.data)` at line 57 has no guard.
  - The component does not close `EventSource` on unmount.
  - The client/server result enum is inconsistent (`PASS` vs `READY`).
  - Error text is hard-coded in English.
- **Solution:**
  1. Validate SSE payloads with a shared schema before using them.
  2. Add `useEffect(() => () => eventSourceRef.current?.close(), [])`.
  3. Normalize summary enums.
  4. Add localized error/status strings.
- **Effort:** Medium
- **Impact:** High

## 12) Cache and type the GitHub-powered release dashboard endpoint
- **Files affected:** `server/routes.ts`, `client/src/pages/releases.tsx`
- **Problem:** `server/routes.ts` lines 327-453 performs a GitHub fan-out on every request: 1 releases call, 11 contents checks, branch protection, and tag protection. It also relies on multiple `any` types at lines 343, 345, 346, 358, and 442. That is slow, rate-limit-prone, and fragile.
- **Solution:**
  - Add a small in-memory TTL cache (for example 5 minutes).
  - Parse GitHub responses through Zod.
  - Use `AbortSignal.timeout()` for upstream calls.
  - Surface cache metadata to the client so the UI can show “last updated”.
- **Effort:** Medium
- **Impact:** High

## 13) Break up the current monolith files by feature
- **Files affected:** `server/routes.ts`, `client/src/pages/compare.tsx`, `wizard.tsx`, `hosting-deals.tsx`, `releases.tsx`
- **Problem:** Several files are too large to reason about comfortably:
  - `server/routes.ts`: 1,273 lines
  - `compare.tsx`: 733 lines
  - `wizard.tsx`: 691 lines
  - `hosting-deals.tsx`: 637 lines
  - `releases.tsx`: 563 lines
  These files mix data, view logic, event handlers, formatting helpers, and network access.
- **Solution:** Split by feature boundary:
  - `server/routes/{audit,logs,owner,releases,preflight}.ts`
  - `client/src/features/compare/{data.ts,radar-chart.tsx,framework-card.tsx}`
  - `client/src/features/wizard/{stepper.tsx,script-panel.tsx,host-metadata.ts}`
- **Effort:** High
- **Impact:** Medium

## 14) Remove duplicated pattern data and enforce one content source
- **Files affected:** `client/src/pages/patterns.tsx`, `client/src/lib/data-access.ts`, `client/src/data/community-patterns.ts`
- **Problem:** The core pattern catalog is duplicated almost verbatim in `patterns.tsx` (lines 54-133) and `data-access.ts` (lines 30-109). That is a classic drift hazard and also bloats the route chunks with repeated long-form content.
- **Solution:** Move all pattern content into one data module and have both the page and selector layer consume it.
  ```ts
  // data/patterns.ts
  export const corePatterns = [...];
  export const allPatterns = [...corePatterns, ...communityPatterns];
  ```
  Then delete the duplicated literals from both consumers.
- **Effort:** Low
- **Impact:** Medium

## 15) Close the remaining accessibility gaps in interactive controls and charts
- **Files affected:** `client/src/pages/compare.tsx`, `client/src/pages/releases.tsx`, `client/src/pages/hosting-deals.tsx`
- **Problem:**
  - Framework selector buttons in `compare.tsx` (lines 430-467) behave like toggles but do not expose `aria-pressed`.
  - Expand/collapse buttons in `compare.tsx` and `releases.tsx` do not expose `aria-expanded`/`aria-controls`.
  - The radar chart has no accessible textual equivalent for screen-reader users.
  - `HostingDeals` has plain icon/text buttons without standardized labels.
- **Solution:**
  - Add `aria-pressed` to multi-select toggles.
  - Add `aria-expanded` + `aria-controls` to disclosure buttons.
  - Render a visually hidden comparison table summary next to the chart.
  - Add explicit labels to copy/deploy actions.
- **Effort:** Medium
- **Impact:** Medium

## 16) Replace brittle E2E timeouts with deterministic waits and real assertions
- **Files affected:** `tests/e2e/wizard-flow.spec.ts`, `tests/e2e/preflight-runner.spec.ts`, `tests/e2e/i18n-switching.spec.ts`, `tests/e2e/hash-chain-verification.spec.ts`
- **Problem:** Current Playwright tests lean heavily on `waitForTimeout()` and broad `body` text regex checks. That makes them slow and flaky, and it misses real regressions in UI structure and API behavior.
- **Solution:**
  - Wait on `data-testid` selectors or mocked network events instead of arbitrary sleeps.
  - Assert concrete UI states, not broad body text.
  - Add coverage for:
    - logs archive path
    - owner auth success/failure
    - rapid language switching
    - malformed SSE payload handling
    - compare/release accessibility attributes
- **Effort:** Medium
- **Impact:** High

## 17) Lazy-load large YAML config text instead of bundling it eagerly
- **Files affected:** `client/src/data/config-loader.ts`, `client/src/pages/patterns.tsx`, `client/src/pages/marketplace.tsx`
- **Problem:** `config-loader.ts` uses `import.meta.glob(..., { eager: true })` for both pattern and skill YAML files (lines 8-18). That pulls all raw config text into route chunks up front even though users only inspect a small subset.
- **Solution:** Store loader functions instead of eager strings and resolve config text only when a card is opened.
  ```ts
  const patternConfigLoaders = import.meta.glob<string>("./configs/patterns/*.yaml", {
    query: "?raw",
    import: "default",
  });

  export async function getPatternConfig(id: string) {
    const loader = patternConfigLoaders[`./configs/patterns/${id}.yaml`];
    return loader ? await loader() : "";
  }
  ```
  If the current instant-preview UX must remain, at least split the pattern and skill loaders into separate per-route modules.
- **Effort:** Medium
- **Impact:** Medium

## 18) Tighten the remaining TypeScript escape hatches
- **Files affected:** `client/src/lib/routes.ts`, `client/src/components/app-sidebar.tsx`, `client/src/App.tsx`, `client/src/pages/hardening.tsx`, `client/src/pages/logs.tsx`, `server/index.ts`, `server/routes.ts`
- **Problem:** There are still several avoidable type escape hatches:
  - `ComponentType<any>` in `routes.ts` line 12
  - `t as unknown as Record<string, string>` in `app-sidebar.tsx` line 161
  - `style as React.CSSProperties` in `App.tsx` line 90
  - `variant as any` on badges in `hardening.tsx` and `logs.tsx`
  - `Record<string, any>` and `err: any` in `server/index.ts`
  - multiple `any` GitHub DTOs in `server/routes.ts`
- **Solution:**
  - Type route labels as `(t: Translations) => string`
  - Use `satisfies React.CSSProperties` for style objects
  - Replace `variant as any` with typed variant maps
  - Introduce typed GitHub response DTOs + Zod parsing
  - Prefer `unknown` plus narrowing over `any`
- **Effort:** Medium
- **Impact:** Medium
