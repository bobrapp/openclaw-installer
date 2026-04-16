# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] — 2026-04-16 — "Green Board"

All 349 tests passing in CI with live server integration. Release pipeline now auto-publishes to npm and Docker Hub.

### Added — Test Infrastructure
- **Vitest globalSetup** (`tests/global-setup.ts`): automatically starts Express server before all tests, tears it down after; sets owner passphrase and seeds audit log entries for chain verification
- All 11 hash-chain integration tests now run against the live server — **349/349 tests green**

### Added — CI Publish Pipelines
- **npm publish job** in `release.yml`: triggered on tag push, builds production bundle, publishes to npm registry (`npx openclaw-installer`). Requires `NPM_TOKEN` secret.
- **Docker Hub push job** in `release.yml`: triggered on tag push, multi-platform build (amd64 + arm64), pushes with `latest`, semver, minor, and major tags. Requires `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` secrets.
- Both jobs run after the existing release job (PDF + SBOM generation)
- CI workflow test step renamed to reflect unit + integration coverage

### Secrets Required
| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm publish authentication |
| `DOCKERHUB_USERNAME` | Docker Hub login |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

---

## [2.3.0] — 2026-04-16 — "Council Complete"

All 20 Model Council improvements implemented. Three-model review (Claude Opus 4.6, GPT-5.4, Gemini 3.1 Pro) is now 20/20 complete.

### Fixed — Final 4 Council Items
- **#5** Deploy wizard clipboard: replaced raw `navigator.clipboard.writeText()` with `useCopyToClipboard` hook (safe in sandboxed iframe)
- **#10** Server error handling: wrapped all 12 API endpoints in try/catch with labeled `console.error` logging and structured 500 responses; Zod body validation already present on all POST/PATCH routes
- **#18** home.tsx local iconMap: already cleaned up in prior batch (verified — uses `resolveHostIcon` from shared `host-utils.ts`)
- **#20** ErrorBoundary chunk-retry: auto-detects lazy-chunk/dynamic-import failures and triggers one automatic page reload; shows specialized "Page failed to load" UI with Reload button on persistent failures

### Council Scorecard (20/20)
| # | Improvement | Status |
|---|-------------|--------|
| 1 | Hoist `React.lazy()` out of render loop | Done (v2.2.0) |
| 2 | `getQueryFn` → `apiRequest` + AbortSignal | Done (v2.2.0) |
| 3 | Memoize I18nContext.Provider value | Done (v2.2.0) |
| 4 | Fix broken DELETE /api/logs → archive | Done (v2.2.0) |
| 5 | Clipboard → useCopyToClipboard hook | Done (v2.3.0) |
| 6 | Cache /api/releases GitHub fan-out | Done (v2.2.0) |
| 7 | Core patterns deduplication | Done (v2.2.0) |
| 8 | HostConfig extraction to host-utils.ts | Done (v2.2.0) |
| 9 | validate-data.ts dev-only import | Done (v2.2.0) |
| 10 | Server error handling + Zod validation | Done (v2.3.0) |
| 11 | React Query loading/error states | Done (v2.2.0) |
| 12 | CelebrationToast stale closure fix | Done (v2.2.0) |
| 13 | Canvas particles pause in bg/light | Done (v2.2.0) |
| 14 | ARIA labels on interactive buttons | Done (v2.2.0) |
| 15 | Language switching race condition | Done (v2.2.0) |
| 16 | OwnerAuthContext + 30-min timeout | Done (v2.2.0) |
| 17 | Debounce search + canvas resize | Done (v2.2.0) |
| 18 | home.tsx iconMap → global resolveIcon | Done (v2.2.0) |
| 19 | Dead code cleanup | Done (v2.2.0) |
| 20 | Per-route ErrorBoundary + chunk retry | Done (v2.3.0) |

---

## [2.2.2] — 2026-04-16 — "Polyglot"

Standalone wizard now ships a 15-language locale switcher with full RTL and Cherokee support.

### Added — Standalone Wizard i18n
- **Locale switcher UI**: dropdown in wizard header lets users preview the full 7-step install flow in any of the 15 supported languages
- **WIZARD_I18N translation map**: all 165 keys × 15 locales (2,475 strings) embedded in the standalone HTML
- **RTL layout support**: automatic `dir="rtl"` switching for Arabic, Urdu, and Pashto; full RTL CSS for buttons, navigation, progress bar, and content alignment
- **Cherokee syllabary fonts**: Noto Sans Cherokee loaded via Google Fonts CDN; CSP updated for `fonts.googleapis.com` and `fonts.gstatic.com`
- **Arabic font support**: Noto Sans Arabic loaded for proper Arabic/Urdu/Pashto rendering
- **`switchLocale()` + `t()` helper**: runtime translation function with English fallback
- **Playwright verification suite** (`tests/e2e/wizard-i18n-verify.ts`): automated RTL layout checks (Arabic + Urdu, 7 steps each, no overflow), Cherokee syllabary rendering (67 chars, zero tofu)

### Changed
- Standalone wizard expanded from ~1,505 to ~4,068 lines
- Version bumped to 2.2.2

---

## [2.2.1] — 2026-04-16 — "Rosetta"

Complete i18n: all 504 missing translations generated across 14 languages, plus 8 quality fixes.

### Fixed — Translation Quality
- **French**: `mktCuratedBy` "Curé par la" → "Organisé par la" (false cognate — "curé" means priest)
- **French**: `mktConfig` "Config" → "Configuration"
- **German**: `homeTitle` "by AiGovOps" → "von AiGovOps"
- **Chinese**: `mktByProvider` "提供者" → "按提供商" (noun → prepositional phrase)
- **Russian**: `mktCuratedBy` "Собрано" → "Курируется" (collected → curated)
- **Portuguese**: `marketplaceSkillCount` "skills" → "habilidades"
- **Portuguese**: `mktConfig` "Config" → "Configuração"
- **Spanish**: `mktConfig` "Config" → "Configuración"

### Added — 504 Translations (36 keys × 14 languages)
Marketplace management, 1-Click Deploy wizard, and Unified Marketplace strings:
- **Romance**: French, Spanish, Portuguese
- **Germanic**: German
- **Slavic**: Russian
- **Turkic**: Turkish
- **CJK**: Simplified Chinese
- **Indic**: Hindi
- **Bantu**: Swahili
- **RTL**: Arabic, Urdu, Pashto
- **Indigenous**: Cherokee (ᏣᎳᎩ syllabary)
- **Accessibility**: Braille (Grade 1 UEB)

All 15 locales now at 165 keys with zero placeholders.

---

## [2.2.0] — 2026-04-16 — "Ironclad"

Full hardening pass: CVE patch, canary tokens, Docker, 208 new tests, accessibility, localization QA, npm/Homebrew distribution, and community readiness.

### Fixed — Security
- **CVE-2026-39356**: Upgraded `drizzle-orm` to 0.45.2 (SQL injection via improperly escaped identifiers)
- npm audit now returns 0 vulnerabilities

### Added — Canary Token System
- `scripts/canary-check.sh` — SHA-256 integrity monitoring for 21 critical files
- Three modes: `--init` (baseline), `--verify` (check with colored output), `--update` (diff + refresh)
- `scripts/canary-webhook.sh` — Alert via webhook or local log on tampering detection
- `.github/workflows/canary-check.yml` — CI workflow: push + daily schedule, auto-creates GitHub issue on tampering
- `docs/INCIDENT-RESPONSE.md` updated with Scenario 7: Canary Token Alerts

### Added — Docker Support
- `Dockerfile` — Multi-stage build (builder + runtime), non-root user, health check
- `docker-compose.yml` — Production stack with SQLite volume persistence
- `docker-compose.dev.yml` — Development override with hot reload
- `.dockerignore` — Build context exclusions
- `docs/DOCKER.md` — Full quick-start guide including multi-arch builds

### Added — Test Coverage (208 new tests)
- `tests/unit/routes-validation.test.ts` — 74 tests for Zod schema validation
- `tests/unit/marketplace-data.test.ts` — 33 tests for marketplace data integrity
- `tests/unit/hosting-regions.test.ts` — 23 tests for regional hosting data
- `tests/unit/builds-data.test.ts` — 34 tests for build catalog data
- `tests/unit/security-headers.test.ts` — 44 tests for security configuration
- Total: 338 passing unit tests (was 130)

### Added — Community & Distribution
- `CONTRIBUTING.md` — Full contributor guide (260 lines)
- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1
- `.github/ISSUE_TEMPLATE/bug_report.md` — Bug report template with 16 host targets
- `.github/ISSUE_TEMPLATE/feature_request.md` — Feature request template
- `.github/ISSUE_TEMPLATE/security_vulnerability.md` — Security vulnerability report
- `.github/PULL_REQUEST_TEMPLATE.md` — PR template with CLA/DCO checkboxes
- `bin/openclaw.mjs` — CLI entry point (`openclaw start|preflight|validate|canary-verify`)
- `Formula/openclaw.rb` — Homebrew formula
- `docs/DISTRIBUTION.md` — npm, Homebrew, Docker, and source install guide
- `package.json` — Added bin, files, repository, keywords, engines, description, contributors

### Improved — Accessibility (24 fixes)
- Added skip navigation link and `id="main-content"` landmark
- Added global `focus-visible` ring in CSS
- Fixed heading hierarchy and semantic HTML (converted step indicators to `<ol>`)
- Added `aria-label`, `aria-pressed`, `aria-hidden`, `role="group"` across 9 files
- Added keyboard support on interactive cards (CountryCard)
- All decorative icons now have `aria-hidden="true"`

### Improved — Localization
- All 14 non-English locales now have 165 keys (was 129, 36 keys were missing)
- Missing keys filled with `[NEEDS TRANSLATION]` placeholders
- Flagged quality issues: French "curé" false cognate, German untranslated "by", Chinese provider vs. "by"

### Changed
- `README.md` — Full refresh with badges, quick starts (npm, Docker, VPS, PaaS), architecture diagram, route table, docs index
- i18n completeness test updated to expect 165 keys

---

## [2.1.0] — 2026-04-16 — "Global Deploy"

Massive expansion of hosting targets, build catalog, global deals matrix, and end-to-end validation.

### Added — Host Targets (6 → 16)
- Railway (PaaS, GitHub-connected, free tier + $5/mo hobby)
- Render (PaaS, Docker, auto-scaling, free tier)
- Fly.io (edge containers, global low-latency, from $3/mo)
- Hetzner Cloud (EU, best price/performance, from €3.79/mo)
- Oracle Cloud (always-free ARM: 4 OCPU, 24GB RAM)
- OVHcloud (EU sovereignty, GDPR, CA + APAC regions)
- Tencent Cloud Lighthouse (China/Asia, OpenClaw template)
- Alibaba Cloud ECS (Asia, Middle East, Africa)
- Vultr Cloud (32 global locations, from $6/mo)
- Kamatera (24 DCs, Middle East + Asia, from $4/mo)

### Added — Build Catalog (#/builds)
- 13 OpenClaw build variants compared: Core, AlphaClaw, ClawHost, ClawTank, DigitalOcean 1-Click, Tencent Lighthouse, Railway, Render, Fly.io, Hetzner, Oracle Cloud, Ollama Local, AiGovOps Guided Install
- Search/filter by category (self-hosted/managed/PaaS/local), difficulty, price range
- "Recommended for you" picks, side-by-side comparison table

### Added — Global Hosting Deals (#/hosting-global)
- 16-country coverage: top 10 cloud spend + top 10 population countries
- By Country and By Provider tab views with expandable detail cards
- 51 provider recommendations with pricing, free tier status, latency estimates
- CSS world map with coverage dots, comparison table

### Added — 7 New Marketplace Hosting Entries
- Railway, Fly.io, Oracle Cloud Free, OVHcloud, Tencent Lighthouse, Alibaba Cloud ECS, Kamatera
- Total marketplace entries: 87 (was 80)

### Added — E2E Validation Suite
- `scripts/e2e-validate.sh` — 754-line shellcheck-clean script testing 9 validation steps across all 16 hosts
- Steps: prerequisites, preflight, install, rollback, hardening, health, state, deploy-smoke, audit-chain
- Colored pass/warn/fail matrix, JSON report output, configurable API URL and passphrase
- `.github/workflows/e2e-validate.yml` — CI workflow (push, PR, weekly schedule)

### Changed
- Conference handout hub: 10 adventure cards (was 8), updated feature list
- Sidebar: added Build Catalog, Global Hosting, Hosting Deals routes
- All count references updated: 6 hosts → 16, 80 marketplace → 87

---

## [2.0.1] — 2026-04-16 — "Larry's World" Model Council Patch

Implements ALL consensus recommendations from the 3-model security council (Gemini 3.1 Pro, GPT-5.4, Claude Opus 4.6).

### Added — Application Security
- Helmet security headers (CSP, HSTS, X-Content-Type-Options, etc.) on Express server
- Rate limiting: 100/min global API, 20/min mutating endpoints, 5/min passphrase verify
- CORS configuration with same-origin default
- Input validation audit: Zod schema refinements with enum constraints, length bounds, integer ranges
- Host target whitelist validation on all parameterized endpoints
- Passphrase type + length bounds (6–256 characters)
- ID parameter bounds checking (NaN + integer range)

### Added — Supply Chain Security
- Release signing workflow (Sigstore cosign + SLSA provenance + SHA-256/SHA-512 checksums)
- Critical file monitoring workflow (real-time alerts on LICENSE, NOTICE, GOVERNANCE, workflows)
- Shellcheck audit job in CI pipeline for all shell scripts

### Added — Governance & Marketplace
- `GOVERNANCE.md` with tiered contributor trust model (5 levels: Visitor → Owner)
- Marketplace trust tiers: official, verified, listed — with UI badges and filter
- Read-only trust tier display on Manage Entries page

### Added — Documentation
- `docs/INCIDENT-RESPONSE.md` — 6-scenario runbook with severity classification
- `docs/TOKEN-MANAGEMENT.md` — PAT lifecycle management and rotation schedule
- `docs/REPRODUCIBLE-BUILDS.md` — Build verification and attestation guide
- `docs/SESSION-SECURITY.md` — Headers, rate limiting, auth model, deployment checklist
- Updated `docs/MODEL-COUNCIL-v2.md` — All P1 items marked implemented, P2 mostly complete

---

## [2.0.0] — 2026-04-16 — "Larry's World"

### Added — Security & Protection
- **Commons Clause license** — Apache 2.0 + Commons Clause for non-commercial open source; commercial use requires Foundation permission
- **NOTICE file** — Formal copyright assertion, trademark notice, and IP declaration for AiGovOps Foundation, Ken Johnston & Bob Rapp
- **Contributor License Agreement (CLA)** — All contributors must sign before PRs merge
- **Developer Certificate of Origin (DCO)** — `Signed-off-by` required on all commits
- **CODEOWNERS** — Co-founder review required on critical paths (LICENSE, SECURITY, scripts/, server/)
- **CodeQL analysis** — Automated security scanning on every push and weekly schedule
- **Dependency review** — Blocks PRs with high-severity or GPL-3.0/AGPL-3.0 dependencies
- **Nightly backup workflow** — Git integrity verification, critical file checks, SBOM snapshot, 90-day artifact retention
- **Content Security Policy (CSP)** — Meta headers on standalone wizard and conference handout
- **PR template** — Security checklist, CLA agreement, and DCO sign-off required
- **Disaster recovery documentation** — Mirror setup, backup verification, and restore procedures

### Added — Features
- **Unified Marketplace** — 87 entries across 5 tabs: Agents (38), Connectors (29), Hosting (16), 1-Click Deploy (4)
- **1-Click Deploy Wizard** — 6-step pipeline: Select Bundle → Choose Host → Configure → Review → Deploy → Complete
- **Manage Marketplace Entries** — Create agents, connectors, or hosting entries with live YAML export
- **AWS EC2 & Google Cloud** host targets (added to existing macOS, DigitalOcean, Azure, Generic VPS)
- **Conference handout as hub** — Landing page with 8 adventure cards linking to all project assets

### Changed
- **License** upgraded from Apache 2.0 to Apache 2.0 + Commons Clause
- **Version** bumped from 1.0.0 to 2.0.0
- **README** updated with license badge, CI badge, CodeQL badge, copyright notice, and trademark info
- **CONTRIBUTING.md** updated with CLA and DCO requirements
- **GitHub Pages workflow** — Landing page is now the conference handout hub

### Fixed
- All 12 TypeScript compilation errors resolved
- Explicit `app/index.html` paths in hub links (static hosting directory resolution)
- Shell variable escaping in server route template literals

### Security
- Branch protection enforced on master (require PR reviews, CI pass, block force-push/delete)
- Secret scanning enabled
- Dependabot configured for npm and GitHub Actions (weekly Monday)
- Input validation on all marketplace entry fields
- CSP headers block unauthorized script/style injection

## [1.1] — 2026-04-14

### Added
- Standalone 7-step wizard (single HTML file, works offline)
- 15-language support with RTL for Arabic, Urdu, Pashto
- Conference handout (1-page framework overview)
- 20-page visual showcase PDF
- Compliance report v1 with SHA-256 hash chain
- Model council consensus process (3-model review)

## [1.0.0] — 2026-04-12

### Added
- Initial release: 4-step guided installer wizard
- 4 host targets: macOS, DigitalOcean, Azure VM, Generic VPS
- Preflight runner with real-time SSE streaming
- Production hardening checklist (40+ checks)
- Framework comparison (8 frameworks)
- Immutable audit logging with SHA-256 hash chain
- CI/CD pipeline with Playwright E2E tests
