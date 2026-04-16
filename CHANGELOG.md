# Changelog

All notable changes to the OpenClaw Installer project will be documented in this file.

## [v1.1] — 2026-04-16

### Added
- **Buy Us a Coffee** — Persistent AiGovOps Foundation donation CTA in sidebar footer, visible from every page
- **Standalone Wizard Smoke Tests** — Playwright E2E test suite validating full dry-run flow across all 4 host targets (macOS, DigitalOcean, Azure VM, Generic VPS) with SHA-256 chain verification
- **Standalone Playwright Config** — Dedicated `playwright.standalone.config.ts` for wizard-only CI testing

### Changed
- **Humanity Tagline** — Updated footer across all 15 languages to: "Made for Humans, by Humans — with AI, for the good of humanity"
- **i18n Expansion** — Added `sidebarCoffee` and `sidebarCoffeeDesc` keys to all 15 locale files (en, fr, de, zh, pt, hi, es, ar, ru, tr, ur, ps, sw, chr, brl)
- **Sidebar Footer** — Redesigned with coffee CTA card, humanity tagline, and link to Humans easter egg page
- **CI Pipeline** — Enhanced with standalone wizard smoke test job (4 host targets, SHA-256 chain validation, JSON export verification)

### Fixed
- **Compliance PDF** — Replaced emoji glyphs (✅) with text labels (PASS/COMPLIANT) for font compatibility; fixed contrast on signature lines and cover stats

## [v1.0] — 2026-04-15

### Core Platform
- 4-target guided installer (macOS, DigitalOcean, Azure VM, Generic VPS)
- 7-step wizard with dry-run preflight, install simulation, and SHA-256 audit chain
- Production hardening checklists per host (UFW, SSH, systemd, Keychain)
- Shell script library with rollback support
- Standalone HTML wizard (`aigovops-wizard.html`) — zero dependencies, offline-capable

### Governance & Compliance
- Immutable SHA-256 hash-chain audit logging with tamper detection
- 38 YAML governance patterns (agent lifecycle, data access, human-in-the-loop)
- Framework comparison: OpenClaw vs 8 alternatives across 8 dimensions
- AiGovOps Foundation page with co-founder credits and 4-pillar assessment
- Signed compliance PDF with QR code and co-founder attribution

### Multilingual
- 15-language support: English, French, German, Simplified Chinese, Portuguese, Hindi, Spanish, Arabic, Russian, Turkish, Urdu, Pashto, Swahili, Cherokee, Braille
- RTL layout support (Arabic, Urdu, Pashto)
- Language picker in header with instant switching

### Community & Marketplace
- Skills Marketplace with categories, ratings, and install flow
- Hosting Deals page with partner pricing
- Release Dashboard with version history and Recharts visualizations
- "How I Built This" engineering story page
- Humans easter egg page with gratitude wall and confetti

### Quality
- 141 Vitest unit tests
- 46 Playwright E2E tests
- GitHub Actions CI pipeline (build, test, security audit, wizard validation)
- Owner passphrase authentication with brute-force protection
- Sound engine with ambient audio and interaction feedback

### Infrastructure
- Express + Vite + React + Tailwind CSS + shadcn/ui
- Drizzle ORM + SQLite with encrypted passphrase
- Dark/light theme toggle with system preference detection
- GitHub Pages deployment at bobrapp.github.io/openclaw-installer

---

**AiGovOps Foundation** — Made for Humans, by Humans — with AI, for the good of humanity.
Co-founded by Bob Rapp and Ken Johnston.
[www.aigovopsfoundation.org](https://www.aigovopsfoundation.org/)
