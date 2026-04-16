# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Unified Marketplace** — 80 entries across 5 tabs: Agents (38), Connectors (29), Hosting (9), 1-Click Deploy (4)
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
