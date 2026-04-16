# OpenClaw Guided Install by AiGovOps

[![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)](CHANGELOG.md)
[![License: Apache 2.0 + Commons Clause](https://img.shields.io/badge/License-Apache%202.0%20%2B%20Commons%20Clause-blue.svg)](LICENSE)
[![CI](https://github.com/bobrapp/openclaw-installer/actions/workflows/ci.yml/badge.svg)](https://github.com/bobrapp/openclaw-installer/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bobrapp/openclaw-installer/actions/workflows/codeql.yml/badge.svg)](https://github.com/bobrapp/openclaw-installer/actions/workflows/codeql.yml)
[![Canary Check](https://github.com/bobrapp/openclaw-installer/actions/workflows/canary-check.yml/badge.svg)](https://github.com/bobrapp/openclaw-installer/actions/workflows/canary-check.yml)
[![npm version](https://img.shields.io/npm/v/openclaw-installer?color=cb3837&logo=npm)](https://www.npmjs.com/package/openclaw-installer)
[![Docker Pulls](https://img.shields.io/docker/pulls/bobrapp/openclaw-installer?logo=docker&color=2496ED)](https://hub.docker.com/r/bobrapp/openclaw-installer)
[![Tests](https://img.shields.io/badge/tests-349%20passing-brightgreen.svg)](tests/)
[![Languages](https://img.shields.io/badge/i18n-15%20languages-teal.svg)](client/src/locales/)

A guided, production-hardened installer for **OpenClaw** — the open-source AI agent framework — with a 7-step wizard, 16 host targets, 87 marketplace entries, 15 languages, and cryptographically immutable audit logging.

Built and maintained by the [AiGovOps Foundation](https://www.aigovopsfoundation.org/) as the reference implementation of its Governance-as-Code standard.

> **© 2024–2026 AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders**
> Licensed under Apache 2.0 with Commons Clause. Free for non-commercial use.
> "AiGovOps", "OpenClaw", and the AiGovOps Foundation logo are trademarks of the AiGovOps Foundation. See [NOTICE](NOTICE) for details.

---

## Features

### Guided Installation Wizard
- **16 host targets** — macOS, DigitalOcean, Azure VM, Generic VPS, Railway, Render, Fly.io, Hetzner Cloud, Oracle Cloud Free, OVHcloud, Tencent Cloud Lighthouse, Alibaba Cloud ECS, Vultr Cloud, Kamatera, and more
- **7-step wizard** — Welcome → Environment Check → Dependencies → Permissions/Firewall → Configuration → Install → Verify
- **13 build variants** — Core, AlphaClaw, ClawHost, ClawTank, DigitalOcean 1-Click, Tencent Lighthouse, Railway, Render, Fly.io, Hetzner, Oracle Cloud, Ollama Local, AiGovOps Guided Install
- **Auto-generated shell scripts** — Preflight, Install (with `DRY_RUN` mode), and Rollback per host
- **Production hardening checklist** — 40+ security checks across network, permissions, secrets, logging, and observability

### Marketplace
- **87 marketplace entries** across 5 tabs: Agents (38), Connectors (29), Hosting (16), 1-Click Deploy (4)
- Trust tiers: Official (Foundation-authored), Verified (reviewed and tested), Listed (community-submitted)
- Search, filter, and one-click install for all entries

### Internationalization
- **15 languages** — English, French, German, Simplified Chinese, Portuguese, Hindi, Spanish, Arabic, Russian, Turkish, Urdu, Pashto, Swahili, Cherokee, and Braille display mode
- Full RTL layout support for Arabic, Urdu, and Pashto

### Immutable Audit Logging
- **SHA-256 hash chain** — Each entry hashes the previous, creating a tamper-evident record
- **One-click chain verification** — Detects any modification instantly
- **Owner-only access** — Protected by a one-time passphrase (SHA-256 hashed, never stored in plaintext)
- **Signed PDF export** — Branded compliance artifact with hash chain table, QR code, and co-founder attribution

### E2E Validation
- `scripts/e2e-validate.sh` — 754-line ShellCheck-clean script testing 9 validation steps across all 16 hosts
- Automated CI workflow runs on push, PR, and weekly schedule

### Live Preflight Runner
- Streams check results in real-time via Server-Sent Events (SSE)
- Host-specific checks: OS version, Node.js, disk space, firewall, SSH config, and more
- Results logged to both install log and immutable audit chain

### Framework Comparison
- 8 AI frameworks compared: OpenClaw, NemoClaw (NVIDIA), Anthropic Computer Use, OpenAI Operator, Browser Use, Agent S2, AutoGen, CrewAI
- Interactive radar chart, comparison table, and risk matrix

---

## Quick Start

### npm (local development)

```bash
git clone https://github.com/bobrapp/openclaw-installer.git
cd openclaw-installer
npm install
npm run dev
```

Open `http://localhost:5000`.

### Docker

```bash
docker build -t openclaw-installer .
docker run -p 5000:5000 openclaw-installer
```

### VPS one-liner (Ubuntu 22.04+)

```bash
curl -fsSL https://raw.githubusercontent.com/bobrapp/openclaw-installer/master/deploy/install.sh | sudo bash
```

Installs Node.js 20, nginx, systemd service, and UFW firewall in ~3 minutes.

### One-click PaaS deploy

| Provider | Deploy |
|----------|--------|
| **Render** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/bobrapp/openclaw-installer) |
| **DigitalOcean** | [Deploy to DigitalOcean App Platform](https://cloud.digitalocean.com/apps/new?repo=https://github.com/bobrapp/openclaw-installer/tree/master) |

---

## Screenshots

| Wizard | Marketplace | Audit Log |
|--------|-------------|-----------|
| ![Wizard](docs/screenshots/wizard.png) | ![Marketplace](docs/screenshots/marketplace.png) | ![Audit](docs/screenshots/audit.png) |

> Screenshots coming soon. See the [live demo](https://bobrapp.github.io/openclaw-installer/) on GitHub Pages.

---

## Architecture

```
openclaw-installer/
├── client/src/
│   ├── components/         # Sidebar, theme toggle, shared UI
│   └── pages/              # All route pages (see Routes below)
├── server/
│   ├── routes.ts           # API routes + SSE + script generators
│   ├── storage.ts          # SQLite storage + audit chain + owner auth
│   └── index.ts            # Express entry point
├── shared/
│   └── schema.ts           # Drizzle ORM schema (5 tables)
├── scripts/
│   ├── generate-audit-pdf.py   # Branded PDF report (ReportLab)
│   └── e2e-validate.sh         # Full E2E validation suite (16 hosts)
├── public/
│   └── aigovops-wizard.html    # Standalone offline wizard (50KB, no server)
├── deploy/
│   ├── install.sh          # VPS one-liner install
│   └── cloud-init.yaml     # Cloud-init for Hetzner / Vultr / DO
└── .github/
    └── workflows/          # CI, deploy, validate, release workflows
```

**Tech stack:**

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Tailwind CSS v3, shadcn/ui, Recharts, wouter |
| Backend | Express.js, Server-Sent Events (SSE) |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| Validation | Zod |
| Crypto | Node.js `crypto` (SHA-256) |
| PDF Export | Python 3, ReportLab, qrcode, Pillow |
| CI/CD | GitHub Actions |
| Build | Vite, esbuild, TypeScript |

---

## Available Routes

The app uses hash routing (`/#/route`). The root path (`/`) serves the conference handout hub.

| Route | Description |
|-------|-------------|
| `/` | Conference handout hub |
| `/#/` | Host selection home |
| `/#/wizard/:host` | 7-step installation wizard |
| `/#/hardening` | Production hardening checklist |
| `/#/scripts` | Shell script viewer and downloader |
| `/#/logs` | Install log viewer |
| `/#/compare` | Framework comparison (8 frameworks) |
| `/#/preflight` | Live preflight check runner |
| `/#/audit-log` | Immutable audit log viewer + PDF export |
| `/#/marketplace` | 87-entry marketplace |
| `/#/builds` | 13 build variant comparison |
| `/#/hosting-global` | Global hosting deals (16 countries) |
| `/#/how-i-built-this` | 9-phase project build timeline |
| `/#/foundation` | AiGovOps Foundation attribution |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/api.md](docs/api.md) | Full API reference |
| [docs/frontend-architecture.md](docs/frontend-architecture.md) | Frontend architecture overview |
| [docs/INCIDENT-RESPONSE.md](docs/INCIDENT-RESPONSE.md) | 6-scenario incident runbook |
| [docs/TOKEN-MANAGEMENT.md](docs/TOKEN-MANAGEMENT.md) | PAT lifecycle and rotation |
| [docs/REPRODUCIBLE-BUILDS.md](docs/REPRODUCIBLE-BUILDS.md) | Build verification and attestation |
| [docs/SESSION-SECURITY.md](docs/SESSION-SECURITY.md) | Auth model and deployment hardening |
| [docs/DISASTER-RECOVERY.md](docs/DISASTER-RECOVERY.md) | Mirror setup and restore procedures |
| [docs/MODEL-COUNCIL-v2.md](docs/MODEL-COUNCIL-v2.md) | AI model council review record |
| [GOVERNANCE.md](GOVERNANCE.md) | Decision authority and trust tiers |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide |

---

## Security

This project uses a **single-owner passphrase** model. The passphrase is set once, SHA-256 hashed, and never stored in plaintext. All mutating API endpoints require it via the `x-owner-passphrase` header. Read-only endpoints are intentionally public.

Key security properties:
- No PII stored in any log
- Localhost-only binding recommended (127.0.0.1)
- Tamper-evident SHA-256 hash chain on all audit entries
- Rate limiting: 100/min global, 20/min mutating, 5/min passphrase verify
- Helmet security headers (CSP, HSTS, X-Content-Type-Options)
- Release signing via Sigstore cosign + SLSA provenance

For security vulnerabilities, email **[security@aigovopsfoundation.org](mailto:security@aigovopsfoundation.org)** for critical issues, or use the [Security Vulnerability issue template](.github/ISSUE_TEMPLATE/security_vulnerability.md) for lower-severity findings.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

All contributors must sign the [Contributor License Agreement](.github/CLA.md) and include a `Signed-off-by` line (DCO) in their commits. The project uses a [5-tier trust model](GOVERNANCE.md) — start at Contributor tier by opening a PR.

See also: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

## License

Licensed under the **Apache License 2.0 with Commons Clause** — free for non-commercial use.
Commercial use requires written permission from the AiGovOps Foundation.

See [LICENSE](LICENSE) for the full text.
Commercial licensing inquiries: [legal@aigovopsfoundation.org](mailto:legal@aigovopsfoundation.org)

---

## Credits

Created and maintained by the **AiGovOps Foundation**.

| Name | Role |
|------|------|
| [Ken Johnston](https://www.aigovopsfoundation.org/) | Co-Founder, AiGovOps Foundation |
| [Bob Rapp](https://github.com/bobrapp) | Co-Founder, AiGovOps Foundation |

This project implements the AiGovOps Foundation's Governance-as-Code standards:
- **Governance as Code** — Automated policy enforcement
- **AI Technical Debt Elimination** — Systematic reduction of AI system debt
- **Operational Compliance** — Runtime monitoring and regulatory adherence
- **Community-Driven Standards** — Open-source governance frameworks

[www.aigovopsfoundation.org](https://www.aigovopsfoundation.org/) · [Buy Us a Coffee](https://buymeacoffee.com/aigovops)

---

*A work of the AiGovOps Foundation — building trustworthy AI infrastructure, one commit at a time.*
