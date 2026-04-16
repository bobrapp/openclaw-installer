# OpenClaw Model Council v2 — Consensus Top 20 Improvements

> Synthesized from Claude Opus, GPT-5.4, and Gemini Pro reviews (Round 2).
> Ranked by cross-model agreement and practical impact.

| # | Improvement | Opus | GPT | Gemini | Consensus | Effort |
|---|-------------|------|-----|--------|-----------|--------|
| 1 | Hoist `React.lazy()` out of render loop | #1 | #6 | — | **2 of 3** | Low |
| 2 | `getQueryFn` uses raw `fetch()` — use `apiRequest` + AbortSignal | #7 | #1 | #2 | **Unanimous** | Low |
| 3 | Memoize I18nContext.Provider value with useMemo | — | — | #1 | **Unique critical** | Low |
| 4 | Fix broken `DELETE /api/logs` → `POST /api/logs/archive` | #5 | #2 | — | **2 of 3** | Low |
| 5 | Direct clipboard calls bypass useCopyToClipboard hook | #4 | #9 | — | **2 of 3** | Low |
| 6 | Cache `/api/releases` GitHub fan-out (14 calls, rate-limit risk) | #14 | #12 | — | **2 of 3** | Low |
| 7 | Core patterns duplicated in data-access.ts & patterns.tsx | #2 | #14 | — | **2 of 3** | Low |
| 8 | HostConfig/hostLabel/ScriptResponse duplicated across files | #3 | — | — | **Unique high-value** | Low |
| 9 | validate-data.ts ships Zod to production bundle | #6 | — | — | **Unique high-value** | Low |
| 10 | Server API routes: swallowed errors + missing Zod validation | — | #4,#5 | #7,#9 | **Unanimous** | Medium |
| 11 | Missing React Query loading/error states | — | — | #3 | **Unique critical** | Low |
| 12 | CelebrationToast stale closure + missing timer cleanup | #8 | — | — | **Unique high-value** | Low |
| 13 | Canvas particles run in light mode + backgrounded tabs | #9 | — | — | **Unique high-value** | Medium |
| 14 | Missing ARIA labels on 7+ interactive buttons | #13 | #15 | #14 | **Unanimous** | Low |
| 15 | Language switching race condition + DOM dir/lang sync | — | #8 | — | **Unique high-value** | Medium |
| 16 | Owner auth: lift passphrase to context + session timeout | #16 | #3 | — | **2 of 3** | Medium |
| 17 | Debounce search inputs + canvas resize handler | #12,#15 | — | — | **Unique value** | Low |
| 18 | home.tsx local iconMap shadows global resolveIcon | #17 | — | — | **Unique value** | Low |
| 19 | Dead "communication" skill category + unused imports cleanup | #10 | — | #10 | **2 of 3** | Low |
| 20 | Per-route ErrorBoundary for lazy chunk failures | — | — | #8 | **Unique value** | Low |

---

## Detailed Consensus

### 1. Hoist `React.lazy()` out of render loop (2 of 3 — Opus #1, GPT #6)
- **Problem**: `AppRouter` calls `lazy(route.lazy)` inside `allRoutes.map()` — creates new component type every render, destroys page state on navigation
- **Solution**: Precompute lazy components at module scope: `const lazyPages = Object.fromEntries(allRoutes.map(r => [r.path, lazy(r.lazy)]))`
- **Effort**: Low | **Impact**: High

### 2. getQueryFn uses raw fetch() — use apiRequest + AbortSignal (UNANIMOUS)
- **Problem**: Default TanStack Query fetcher uses raw `fetch()`, violating the "always use apiRequest" rule. Also ignores AbortSignal.
- **Solution**: Refactor `getQueryFn` to delegate to `apiRequest`, add `signal` parameter
- **Effort**: Low | **Impact**: High

### 3. Memoize I18nContext.Provider value (Unique critical — Gemini #1)
- **Problem**: Inline object literal in Provider forces app-wide re-renders on every state change
- **Solution**: Wrap context value in `useMemo`
- **Effort**: Low | **Impact**: High

### 4. Fix broken logs DELETE → archive endpoint (2 of 3 — Opus #5, GPT #2)
- **Problem**: `logs.tsx` calls `DELETE /api/logs` which was removed; replaced by `POST /api/logs/archive`
- **Solution**: Update mutation, rename button "Clear" → "Archive Logs"
- **Effort**: Low | **Impact**: High

### 5. Direct clipboard calls bypass useCopyToClipboard (2 of 3 — Opus #4, GPT #9)
- **Problem**: 4 files call `navigator.clipboard.writeText()` directly — breaks in sandboxed iframe
- **Solution**: Replace with `useCopyToClipboard` hook in wizard, hardening, scripts, hosting-deals
- **Effort**: Low | **Impact**: High

### 6. Cache /api/releases GitHub fan-out (2 of 3 — Opus #14, GPT #12)
- **Problem**: 14 sequential GitHub API calls on every request, hits 60-req/hr rate limit within 5 page loads
- **Solution**: In-memory TTL cache (5 minutes)
- **Effort**: Low | **Impact**: High

### 7. Core patterns duplicated in data-access.ts & patterns.tsx (2 of 3 — Opus #2, GPT #14)
- **Problem**: ~80 identical lines of core pattern definitions in two files
- **Solution**: Import from data-access.ts, delete duplicate from patterns.tsx
- **Effort**: Low | **Impact**: Medium

### 8. HostConfig/hostLabel/ScriptResponse duplicated (Opus #3)
- **Problem**: Interface and utility duplicated across home, wizard, hardening, scripts
- **Solution**: Extract to shared `lib/host-utils.ts`
- **Effort**: Low | **Impact**: Medium

### 9. validate-data.ts ships Zod to production (Opus #6)
- **Problem**: Top-level import in App.tsx pulls Zod schemas into prod bundle (~5KB gzipped)
- **Solution**: Dynamic import behind `import.meta.env.DEV` guard
- **Effort**: Low | **Impact**: Medium

### 10. Server: swallowed errors + missing Zod body validation (UNANIMOUS)
- **Problem**: Catch blocks don't log errors; POST endpoints accept unvalidated JSON
- **Solution**: Add `console.error` in catches; add Zod schemas for request bodies
- **Effort**: Medium | **Impact**: High

### 11. Missing React Query loading/error states (Gemini #3)
- **Problem**: Pages using `useQuery` don't handle `isLoading`/`isError`, leaving broken UI on failures
- **Solution**: Add skeleton loaders and error alerts
- **Effort**: Low | **Impact**: Medium

### 12. CelebrationToast stale closure + timer leak (Opus #8)
- **Problem**: `onDone` captured in stale closure; inner setTimeout never cleaned up on unmount
- **Solution**: Use ref for callback, clean up both timers
- **Effort**: Low | **Impact**: Medium

### 13. Canvas particles run in light mode + backgrounded tabs (Opus #9)
- **Problem**: rAF loop runs on hidden canvas in light mode, wastes CPU when tab backgrounded
- **Solution**: Check dark mode before starting; pause on visibilitychange
- **Effort**: Medium | **Impact**: Medium

### 14. Missing ARIA labels on 7+ interactive buttons (UNANIMOUS)
- **Problem**: Icon-only buttons in wizard, compare, hosting-deals, releases, audit-log lack labels
- **Solution**: Add descriptive `aria-label` attributes
- **Effort**: Low | **Impact**: Medium

### 15. Language switching race condition (GPT #8)
- **Problem**: Rapid language changes can apply stale translations; initial mount doesn't sync DOM dir/lang
- **Solution**: Track request ID, ignore stale completions; sync dir/lang in effect
- **Effort**: Medium | **Impact**: Medium

### 16. Owner auth: lift passphrase to React context (2 of 3 — Opus #16, GPT #3)
- **Problem**: Passphrase in useState lost on navigation; no session timeout
- **Solution**: OwnerAuthContext with 30-min auto-clear
- **Effort**: Medium | **Impact**: Medium

### 17. Debounce search inputs + canvas resize (Opus #12, #15)
- **Problem**: Search triggers re-render on every keystroke; resize fires at 60Hz+
- **Solution**: `useDebouncedValue` hook (200ms); debounce resize handler (150ms)
- **Effort**: Low | **Impact**: Low

### 18. home.tsx local iconMap shadows global resolveIcon (Opus #17)
- **Problem**: Local 4-entry iconMap duplicates centralized icon-map.ts
- **Solution**: Use resolveIcon from global icon map
- **Effort**: Low | **Impact**: Low

### 19. Dead code cleanup: unused category + imports (2 of 3 — Opus #10, Gemini #10)
- **Problem**: "communication" skill category never used; unused imports in multiple files
- **Solution**: Remove dead category; clean up imports
- **Effort**: Low | **Impact**: Low

### 20. Per-route ErrorBoundary for lazy chunk failures (Gemini #8)
- **Problem**: Single global ErrorBoundary — chunk load failure crashes entire app
- **Solution**: Wrap each lazy route in its own ErrorBoundary
- **Effort**: Low | **Impact**: Medium
