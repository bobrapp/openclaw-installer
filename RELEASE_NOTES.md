# AiGovOps Foundation Framework — v1.0.0 (April 2026)

The inaugural release of the **OpenClaw Guided Install** — a guided macOS/cloud installer with AiGovOps immutable audit logging, production hardening, and compliance tooling.

## Highlights

- **Guided Installation Wizard** — 6-step flow for macOS, Ubuntu, Docker, and DigitalOcean hosts with pre-filled defaults and confirmation at each step
- **Production Hardening Checklist** — 12 actionable checks with severity badges (Critical / Warning / Info)
- **Framework Comparison** — 8 AI governance frameworks (NVIDIA, OpenAI, Anthropic, Google DeepMind, Microsoft, EU AI Act, NIST, ISO 42001) with radar chart, risk matrix, and detailed profiles
- **Preflight Runner** — Live SSE-streamed system checks in the browser with real-time log output
- **Immutable Audit Logging** — SHA-256 hash chain with passphrase-protected owner authentication; every prompt, user, timestamp, and result is cryptographically chained
- **PDF Compliance Export** — Signed PDF report with full hash chain verification, co-founder attribution, and QR code linking to aigovopsfoundation.org
- **Standalone HTML Wizard** — Single-file `aigovops-wizard.html` that runs offline with 7 steps, 4 host targets, dark mode, and privacy notice
- **Shell Script Generation** — Per-host preflight, install, and rollback bash scripts
- **CI Pipeline** — GitHub Actions workflow runs preflight checks on every PR and posts pass/fail as a commit status
- **AiGovOps Foundation Branding** — Co-founders Bob Rapp & Ken Johnston, donation CTA, navy/teal design language
- **How I Built This** — 9-phase development timeline with project stats
- **Dark Mode** — Full dark mode toggle across the main app and standalone wizard

## Changelog

### Features
- Complete OpenClaw Guided Install: wizard UI, shell scripts, hardening checklist, multi-host deploy (`95a6686`)
- OpenClaw Guided Install v1.0 — Guided macOS/cloud installer with AiGovOps immutable logging (`b14b046`)
- AiGovOps Foundation Framework v1 — CI pipeline, PDF export, standalone wizard, How I Built This timeline (`2912ab1`)

### Documentation
- Update README with v1 features — CI pipeline, PDF export, wizard, timeline (`55fb6fe`)

### Bug Fixes
- PDF hash chain verification — match Node.js genesis hash and column names (`06e5d06`)

### Initial
- Initial scaffold: OpenClaw Guided Install (`cbca34f`)

## Artifacts

- **`aigovops-wizard.html`** — Standalone single-file HTML wizard (runs offline, no server required)

## Tech Stack

Express · Vite · React · Tailwind CSS · shadcn/ui · Drizzle ORM · SQLite · ReportLab (PDF) · Chart.js

## Co-Founders

**Bob Rapp** & **Ken Johnston** — [AiGovOps Foundation](https://www.aigovopsfoundation.org/)

---

_Built with care for the AI governance community. ☕ Buy us a coffee at the Foundation page._
