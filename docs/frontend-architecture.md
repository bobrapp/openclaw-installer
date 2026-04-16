# OpenClaw Installer — Frontend Architecture

> A contributor guide to the OpenClaw Installer frontend.
> Last updated: April 2026

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Vite) |
| Routing | Wouter with hash-based routing (`useHashLocation`) |
| Styling | Tailwind CSS v3 + shadcn/ui |
| State | React Context (i18n, theme) + TanStack Query (server state) |
| Backend | Express.js + better-sqlite3 + Drizzle ORM |
| Database | SQLite (`openclaw.db`) |
| Testing | Vitest (unit) + Playwright (E2E) |

## Project Structure

```
openclaw-installer/
├── client/src/
│   ├── App.tsx                  # Root component: providers, router, layout
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Tailwind base + AiGovOps theme tokens
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (auto-generated)
│   │   ├── app-sidebar.tsx      # Main navigation sidebar
│   │   ├── config-card.tsx      # Shared card for patterns + skills
│   │   ├── error-boundary.tsx   # React Error Boundary
│   │   ├── page-hero.tsx        # Shared page header component
│   │   ├── page-footer.tsx      # Shared foundation footer
│   │   ├── language-picker.tsx  # 15-language selector
│   │   ├── theme-toggle.tsx     # Dark/light mode
│   │   ├── breathing-logo.tsx   # Animated SVG logo
│   │   ├── sound-toggle.tsx     # Ambient sound control
│   │   └── celebration-toast.tsx# Success celebration overlay
│   ├── data/
│   │   ├── marketplace-skills.ts   # 29 MCP skills (uses config-loader)
│   │   ├── community-patterns.ts   # 32 community patterns (uses config-loader)
│   │   ├── config-loader.ts        # Vite glob ?raw YAML loader
│   │   ├── validate-data.ts        # Zod build-time validation
│   │   └── configs/
│   │       ├── patterns/*.yaml     # 38 externalized YAML configs
│   │       └── skills/*.yaml       # 29 externalized YAML configs
│   ├── hooks/
│   │   ├── use-copy-to-clipboard.ts # Clipboard + download fallback
│   │   ├── use-toast.ts            # Toast notifications
│   │   └── use-mobile.tsx          # Responsive breakpoint
│   ├── lib/
│   │   ├── i18n.tsx             # I18nProvider, useI18n, language metadata
│   │   ├── icon-map.ts          # 63-icon centralized map + resolveIcon()
│   │   ├── data-access.ts       # Data abstraction layer (getSkills, getPatterns)
│   │   ├── queryClient.ts       # TanStack Query client + apiRequest helper
│   │   ├── celebrations.ts      # Confetti/celebration effects
│   │   ├── sound-engine.ts      # Ambient audio system
│   │   └── utils.ts             # cn() and utility functions
│   ├── locales/
│   │   ├── en.json              # English (125 keys)
│   │   ├── fr.json              # French
│   │   ├── de.json, zh.json, pt.json, hi.json, es.json
│   │   ├── ar.json, ru.json, tr.json, ur.json, ps.json
│   │   ├── sw.json, chr.json    # Swahili, Cherokee
│   │   └── brl.json             # Braille display mode
│   └── pages/
│       ├── home.tsx             # Host selection landing
│       ├── wizard.tsx           # Step-by-step installer wizard
│       ├── hardening.tsx        # Security checklist
│       ├── scripts.tsx          # Shell script viewer
│       ├── preflight-runner.tsx # Real-time SSE preflight checks
│       ├── audit-log.tsx        # SHA-256 hash chain viewer
│       ├── compare.tsx          # Framework comparison matrix
│       ├── patterns.tsx         # 38 agent patterns (core + community)
│       ├── marketplace.tsx      # 29 MCP skills marketplace
│       ├── releases.tsx         # GitHub release dashboard
│       ├── foundation.tsx       # AiGovOps Foundation info
│       ├── humans.tsx           # "About the humans" page
│       └── ...
├── server/
│   ├── index.ts                 # Express server entry
│   ├── routes.ts                # All API routes
│   ├── storage.ts               # Drizzle ORM storage layer
│   └── vite.ts                  # Vite dev middleware
├── shared/
│   └── schema.ts                # Drizzle schema (shared types)
├── scripts/                     # Shell scripts for each host target
├── tests/
│   ├── unit/                    # Vitest unit tests
│   └── e2e/                     # Playwright E2E tests
└── docs/
    └── frontend-architecture.md # This file
```

## Key Conventions

### Routing

All routes use hash-based routing (`/#/path`) via Wouter's `useHashLocation`. This is required because the app is served in sandboxed iframes. The router wraps the entire app:

```tsx
<Router hook={useHashLocation}>
  <Switch>
    <Route path="/" component={Home} />
    ...
  </Switch>
</Router>
```

Never use `href="#section"` for anchor navigation — hash routing intercepts these. Use `scrollIntoView` instead.

### Internationalization (i18n)

- 15 languages + Braille display mode
- Translations live in `client/src/locales/*.json` (one file per language)
- Access via `const { t } = useI18n();` then `t.keyName`
- RTL languages (ar, ur, ps) auto-set `document.dir="rtl"`
- All UI strings must use i18n keys — no hardcoded English
- Use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`) instead of physical (`ml-`, `mr-`, `pl-`, `pr-`) so layout flips correctly in RTL

### Data Flow

```
YAML files ──(Vite ?raw glob)──> config-loader.ts
                                      │
community-patterns.ts ─── getPatternConfig(id) ───> Pattern objects
marketplace-skills.ts ─── getSkillConfig(id) ────> Skill objects
                                      │
              data-access.ts ──── getSkills(), getPatterns()
                                      │
                    Pages ──── useMemo(() => getSkills({...}), [deps])
```

Data validation runs at dev startup via `validate-data.ts` (Zod schemas).

### State Management

| State Type | Solution |
|-----------|----------|
| Server data (logs, audit, hosts) | TanStack Query (`useQuery` / `useMutation`) |
| Language selection | React Context (`I18nProvider`) |
| Theme (dark/light) | React Context (`ThemeProvider`) — no localStorage |
| UI state (search, filters, steps) | Component-level `useState` |

**Never use `localStorage`, `sessionStorage`, or `indexedDB`** — they are blocked in the sandboxed iframe.

### API Requests

Always use `apiRequest` from `@/lib/queryClient` for HTTP calls:

```tsx
import { apiRequest } from "@/lib/queryClient";

// In a mutation
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/logs", data),
});
```

Never use raw `fetch()` — it bypasses the `__PORT_5000__` URL rewriting needed for deployment.

### Shared Components

- **`ConfigCard`** — Used by both Patterns and Marketplace for displaying items with icon, description, YAML config preview, copy/download actions
- **`PageHero`** — Shared page header with icon, title, subtitle, badges
- **`PageFooter`** — Foundation credit footer

### Accessibility

- All icon-only buttons have `aria-label`
- Filter/toggle buttons have `aria-pressed`
- Loading states have `role="status"`
- Error states have `role="alert"`
- Live regions use `aria-live="polite"`
- Focus-visible rings on all interactive elements
- Critical for Braille mode users

### Testing

```bash
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E tests  
npm run test:all      # Both
```

E2E tests cover:
- Preflight runner flow (SSE streaming, check results, summary)
- Audit log hash chain verification (SHA-256 chain integrity)
- Wizard setup flow (step navigation, script preview, completion)
- i18n language switching (including RTL)

### Adding a New Page

1. Create `client/src/pages/my-page.tsx`
2. Add route entry to the route manifest in `client/src/lib/routes.ts`
3. Add i18n keys to all 15 locale JSON files in `client/src/locales/`
4. The route manifest drives both the router and sidebar automatically

### Adding a New Language

1. Create `client/src/locales/xx.json` with all keys from `en.json`
2. Add the language to the `languages` array in `client/src/lib/i18n.tsx`
3. Add the JSON import to `i18n.tsx`
4. If RTL, set `dir: "rtl"` in the language metadata

### Adding a Pattern or Skill

1. Create `client/src/data/configs/patterns/my-pattern.yaml` (or `skills/`)
2. Add the pattern/skill object to the appropriate data file
3. Use `getPatternConfig("my-pattern")` for the config field
4. The Zod validation will catch missing or malformed fields in dev

## Design System

- **Primary**: Navy `#1B3A6B`
- **Accent**: Teal `#01696F`
- **Font**: System font stack (Tailwind default)
- **Styling approach**: AiGovOps Foundation brand guidelines
- **Dark mode**: Supported via `.dark` class on `<html>`

## Security Notes

- Owner passphrase required for all mutating API endpoints
- Audit log uses immutable SHA-256 hash chain (each entry hashes the previous)
- Rate limiting on passphrase verification (5 attempts per 60 seconds)
- No PII stored in logs or audit entries
- PDF export requires passphrase header
