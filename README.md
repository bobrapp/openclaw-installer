# OpenClaw Installer

A guided macOS/cloud installer for **OpenClaw/Clawdbot/Moltbot** that checks permissions, missing dependencies, low-privilege constraints, logging, and rollback steps before it changes anything. Packaged as a web UI plus shell scripts, with a production-hardening checklist and observability defaults.

Built with **AiGovOps Foundation** immutable logging — every action is cryptographically secured in a SHA-256 hash chain.

## Features

### Guided Installation Wizard
- **4 host targets**: macOS (Local), DigitalOcean, Azure VM, Generic VPS
- **6-step wizard** per host: Environment Check → Dependencies → Permissions/Firewall → Configuration → Install → Verify
- **Auto-generated shell scripts**: Preflight, Install (with DRY_RUN mode), and Rollback scripts per host
- **Production hardening checklist**: 40+ security checks across network, permissions, secrets, logging, and observability

### Preflight Runner (Live)
- **Streams check results in real-time** via Server-Sent Events (SSE)
- Executes host-specific checks (macOS version, Node.js, Homebrew, disk space, Tailscale, firewall, SSH config, etc.)
- Results auto-logged to both the install log and the immutable audit chain

### Framework Comparison
- **8 frameworks** compared: OpenClaw, NemoClaw (NVIDIA), Anthropic Computer Use, OpenAI Operator, Browser Use, Agent S2, AutoGen, CrewAI
- Interactive radar chart, comparison table, risk matrix
- Detailed benefit/risk/approach cards per framework

### Immutable Audit Logging (AiGovOps Standard)
- **SHA-256 hash chain**: Each log entry hashes the previous entry, creating a tamper-evident chain
- Fields: `timestamp`, `date`, `user`, `prompt`, `results`, `previousHash`, `currentHash`
- **Chain verification**: One-click integrity verification detects any tampering
- **Owner-only access**: Secured by passphrase authentication (irreversible once set)
- Implements the [AiGovOps Foundation](https://www.aigovopsfoundation.org/) governance-as-code standard

### Signed PDF Audit Report Export
- **Export the immutable audit log as a branded PDF** compliance artifact
- Full SHA-256 hash chain table with all entries
- AiGovOps Foundation branding (navy/teal color scheme, shield logo)
- QR code linking to [aigovopsfoundation.org](https://www.aigovopsfoundation.org/)
- Co-founder attribution and digital signature metadata
- Python-based generator using ReportLab (`scripts/generate-audit-pdf.py`)

### GitHub Actions CI Pipeline
- **Automated preflight checks on every PR** (`.github/workflows/preflight.yml`)
- 8 checks: Node.js version, npm audit, TypeScript compilation, build, lint, test, schema validation, security scan
- Posts pass/fail results as a GitHub commit status check

### One-Click Cloud Deploy
- **Deploy buttons** for DigitalOcean App Platform, Render, Hetzner, Vultr, Hostinger, Contabo, and IONOS
- **Cloud-init YAML** for providers that support it (Hetzner, Vultr, DO) — auto-installs Node.js, nginx, systemd, UFW
- **One-liner SSH install script** (`deploy/install.sh`) — deploy in ~3 minutes on any Ubuntu 22.04+ VPS
- **GitHub Actions auto-deploy** to Hetzner and Vultr on merge to master with approval gates
- **Deploy validation workflow** lints all deploy configs on every PR and posts readiness status

### Standalone HTML Wizard
- **Self-contained single-file installer wizard** (`public/aigovops-wizard.html`)
- 7 steps: Welcome → Configuration → Security → Review → Dry Run → Install → Audit Log
- Pre-filled sensible defaults per host platform (macOS, DigitalOcean, Azure VM, Generic VPS)
- Privacy-first: all data stays in browser memory — no server calls, no cookies, no localStorage
- Dark mode, step-by-step progress tracking, confirmation at each step
- Works offline as a standalone HTML file

### How I Built This (Project Timeline)
- **9-phase narrative** of the entire project build from research to deployment
- Documents every decision, every architecture choice, every lesson learned
- Stats: 9 Phases, 4 Host Targets, 40+ Hardening Checks, 8 Frameworks Compared

### AiGovOps Foundation Attribution
- Credits co-founders **Bob Rapp** and **Ken Johnston**
- Links to [www.aigovopsfoundation.org](https://www.aigovopsfoundation.org/)
- "Buy Us a Coffee" donation call-to-action

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS v3, shadcn/ui, Recharts, wouter |
| Backend | Express.js, Server-Sent Events (SSE) |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| Crypto | Node.js `crypto` module (SHA-256) |
| PDF Export | Python 3, ReportLab, qrcode, Pillow |
| CI/CD | GitHub Actions (CI, deploy-validate, deploy-hetzner, deploy-vultr) |
| Build | Vite, esbuild, TypeScript |

## Getting Started

### Prerequisites
- Node.js 20+ 
- npm or pnpm

### Install & Run

```bash
git clone https://github.com/bobrapp/openclaw-installer.git
cd openclaw-installer
npm install
npm run dev
```

The app starts at `http://localhost:5000`.

### Production Build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Project Structure

```
openclaw-installer/
├── client/
│   └── src/
│       ├── components/         # UI components (sidebar, theme)
│       ├── pages/
│       │   ├── home.tsx        # Host selection
│       │   ├── wizard.tsx      # 6-step installation wizard
│       │   ├── hardening.tsx   # Production hardening checklist
│       │   ├── scripts.tsx     # Shell script viewer/downloader
│       │   ├── logs.tsx        # Install log viewer
│       │   ├── compare.tsx     # Framework comparison (8 frameworks)
│       │   ├── preflight-runner.tsx  # Live preflight check executor
│       │   ├── audit-log.tsx   # Immutable audit log viewer + PDF export (owner-only)
│       │   ├── how-i-built-this.tsx  # 9-phase project build timeline
│       │   └── foundation.tsx  # AiGovOps Foundation attribution
│       └── lib/
│           └── queryClient.ts  # API client with deployment proxy support
├── server/
│   ├── routes.ts               # API routes + SSE + script generators
│   ├── storage.ts              # SQLite storage + audit chain + owner auth
│   └── index.ts                # Express server entry
├── scripts/
│   └── generate-audit-pdf.py   # Branded PDF audit report generator
├── public/
│   └── aigovops-wizard.html    # Standalone 7-step wizard (50KB, self-contained)
├── .github/
│   ├── actions/
│   │   └── post-deploy-status/ # Reusable action: PR comments + commit status
│   └── workflows/
│       ├── preflight.yml       # CI pipeline with 8 checks + commit status
│       ├── deploy-validate.yml # Lint deploy configs on PR
│       ├── deploy-hetzner.yml  # Auto-deploy to Hetzner Cloud
│       └── deploy-vultr.yml    # Auto-deploy to Vultr Cloud
├── deploy/
│   ├── install.sh              # One-liner VPS install script
│   └── cloud-init.yaml         # Cloud-init config for VPS providers
├── .do/
│   └── deploy.template.yaml   # DigitalOcean App Platform spec
├── render.yaml                 # Render PaaS deploy config
├── shared/
│   └── schema.ts               # Drizzle ORM schema (5 tables)
└── README.md
```

## Database Schema

### `install_logs`
Append-only installation log entries. No PII stored.

### `install_state`
Tracks wizard progress (current step, host target, config values, rollback scripts).

### `hardening_checks`
40+ security/hardening checklist items, categorized by host target and severity.

### `audit_logs` (Immutable Hash Chain)
| Column | Description |
|--------|-------------|
| `timestamp` | ISO 8601 timestamp |
| `date` | YYYY-MM-DD date |
| `user` | Anonymized operator identifier |
| `prompt` | Action or command executed |
| `results` | Outcome of the action |
| `previous_hash` | SHA-256 hash of the prior entry (genesis = "0") |
| `current_hash` | SHA-256(timestamp\|user\|prompt\|results\|previousHash) |

### `owner_auth`
Stores the SHA-256 hash of the owner passphrase. Set once, cannot be changed.

## How the Crypto Hash Chain Works

1. The **first entry** (genesis) uses `previousHash = "0"`
2. Each subsequent entry sets `previousHash` to the `currentHash` of the prior entry
3. `currentHash = SHA-256(timestamp | user | prompt | results | previousHash)`
4. Any modification to any entry breaks the chain — the "Verify Chain" button detects this instantly

```
Entry #1: prevHash="0"        → hash=SHA256("...|0")        = abc123...
Entry #2: prevHash="abc123.." → hash=SHA256("...|abc123..") = def456...
Entry #3: prevHash="def456.." → hash=SHA256("...|def456..") = ghi789...
```

## API Endpoints

### Installation
- `GET /api/hosts` — Host configurations
- `GET /api/state` — Current install state
- `PATCH /api/state/:id` — Update install state
- `GET /api/logs` — Install log entries
- `POST /api/logs` — Add log entry
- `GET /api/hardening/:hostTarget` — Hardening checklist

### Scripts
- `GET /api/scripts/preflight/:hostTarget` — Preflight check script
- `GET /api/scripts/install/:hostTarget` — Install script (with DRY_RUN)
- `GET /api/scripts/rollback/:hostTarget` — Rollback script

### Preflight Runner
- `GET /api/preflight/run/:hostTarget` — SSE stream of live check results

### Audit Log (Owner-only)
- `GET /api/audit/logs` — Fetch audit entries (requires `x-owner-passphrase` header)
- `GET /api/audit/verify` — Verify hash chain integrity
- `GET /api/audit/export-pdf` — Export signed PDF audit report (requires `x-owner-passphrase`)
- `GET /api/owner/has-passphrase` — Check if owner passphrase is configured
- `POST /api/owner/set-passphrase` — Set owner passphrase (one-time only)
- `POST /api/owner/verify` — Verify a passphrase

### Wizard
- `GET /api/wizard-html` — Serve standalone wizard HTML
- `GET /aigovops-wizard.html` — Direct access to standalone wizard

## Security Model

- **No PII** stored in any log
- **Localhost-only binding** recommended (127.0.0.1)
- **Tailscale** for secure remote access (never expose ports publicly)
- **macOS Keychain** for secrets (not .env files)
- **Owner passphrase** protects audit log access (SHA-256 hashed, set once)
- **Immutable hash chain** ensures log integrity
- **Hardened systemd units** for cloud deployments (ProtectSystem, PrivateTmp, NoNewPrivileges)

## AiGovOps Foundation

This project implements standards from the [AiGovOps Foundation](https://www.aigovopsfoundation.org/):
- **Governance as Code** — Automated policy enforcement
- **AI Technical Debt Elimination** — Systematic reduction of AI system debt
- **Operational Compliance** — Runtime monitoring and regulatory adherence
- **Community-Driven Standards** — Open-source governance frameworks

### Co-Founders
- **Bob Rapp** — Principal AI Architect, former Vodafone, IBM Watson, GE Healthcare, Microsoft
- **Ken Johnston** — Former Microsoft, Ford Motor Company, CEO Autonomic.ai

## Version History

### April 2026 v1 — AiGovOps Foundation Framework
- GitHub Actions CI pipeline with 8 automated checks
- Signed PDF audit report export with SHA-256 chain and QR code
- Standalone HTML wizard (7 steps, pre-filled defaults, offline-capable)
- "How I Built This" project timeline (9 phases)
- Full AiGovOps Foundation branding integration

### Initial Release
- Guided installation wizard (4 hosts, 6-step flow)
- Live preflight runner with SSE streaming
- Framework comparison (8 AI agent frameworks)
- Immutable audit logging with SHA-256 hash chain
- Production hardening checklist (40+ checks)
- Owner passphrase authentication

## Cloud Deployment

### One-Click PaaS Deploy

| Provider | Method | Link |
|----------|--------|------|
| **Render** | One-click from `render.yaml` | [Deploy to Render](https://render.com/deploy?repo=https://github.com/bobrapp/openclaw-installer) |
| **DigitalOcean** | One-click App Platform | [Deploy to DO](https://cloud.digitalocean.com/apps/new?repo=https://github.com/bobrapp/openclaw-installer/tree/master) |

### VPS Deploy (SSH One-Liner)

```bash
curl -fsSL https://raw.githubusercontent.com/bobrapp/openclaw-installer/master/deploy/install.sh | sudo bash
```

Installs Node.js 20, nginx reverse proxy, systemd service, and UFW firewall on Ubuntu 22.04+.

### Cloud-Init (Hetzner, Vultr, DO Droplets)

Paste this URL into the "Cloud config" or "Startup script" field when creating a VPS:

```
https://raw.githubusercontent.com/bobrapp/openclaw-installer/master/deploy/cloud-init.yaml
```

### GitHub Actions Auto-Deploy

The repo includes automated deployment workflows for Hetzner and Vultr that trigger on every merge to `master`. Both require:

1. **GitHub Environment**: Create a `production` environment in Settings → Environments with required reviewers (approval gate)
2. **Secrets**: Add the following in Settings → Secrets → Actions:

| Secret | Description | Required By |
|--------|-------------|-------------|
| `HETZNER_API_TOKEN` | [Hetzner Cloud API token](https://docs.hetzner.cloud/#getting-started) | `deploy-hetzner.yml` |
| `VULTR_API_KEY` | [Vultr API key](https://my.vultr.com/settings/#settingsapi) | `deploy-vultr.yml` |

#### How It Works

1. **PR opened** → `deploy-validate.yml` runs: ShellCheck on `install.sh`, YAML lint on all configs, dry-run build. Posts a validation summary comment to the PR.
2. **PR merged to master** → `deploy-hetzner.yml` and `deploy-vultr.yml` trigger, but **pause for approval** (via the `production` environment protection rule).
3. **Reviewer approves** → Workflow checks for an existing `openclaw-prod` server. If found, it rebuilds/reinstalls. If not, it creates a new server with cloud-init/startup script.
4. **Health check** → Polls `http://<server-ip>/api/hosts` for up to 10 minutes until the app is live.
5. **Status posted** → The reusable `post-deploy-status` action posts a formatted deployment report as a PR comment and sets a commit status check.

#### Manual Dispatch

Both workflows support `workflow_dispatch` for manual runs with configurable server type, region, and a "destroy after deploy" option for cost-controlled testing.

#### Cost Safety

- **Approval gate**: Deploys require manual approval — no accidental server creation
- **Single-server logic**: Reuses existing `openclaw-prod` server instead of creating duplicates
- **Destroy flag**: Manual dispatch includes a "destroy after" option for testing without ongoing costs
- **Concurrency control**: Only one deploy per provider can run at a time

## Authentication

OpenClaw Installer uses a **single-owner passphrase** model. There are no user accounts or session tokens — one passphrase gates all write and sensitive-read access.

### How it works

The passphrase is set once via `POST /api/owner/set-passphrase`. The server stores a SHA-256 hash of the passphrase in the `owner_auth` table — the raw passphrase is never persisted. Once set, it cannot be changed through the API.

### Setting the passphrase (first run)

On first launch, `GET /api/owner/has-passphrase` returns `{ "hasPassphrase": false }`. Set your passphrase before the server is reachable from untrusted networks:

```bash
curl -X POST http://localhost:5000/api/owner/set-passphrase \
  -H "Content-Type: application/json" \
  -d '{"passphrase": "your-strong-passphrase"}'
```

### What it protects

All **mutating endpoints** require the passphrase in the `x-owner-passphrase` header:

- Adding and archiving install logs
- Updating or resetting wizard state
- Toggling hardening checklist items
- Accessing and exporting the immutable audit log

Read-only endpoints (host list, scripts, hardening checks, wizard UI, preflight SSE stream) are intentionally **public** — the wizard frontend needs them without a login step.

### Sending the passphrase

```bash
curl http://localhost:5000/api/audit/logs \
  -H "x-owner-passphrase: your-strong-passphrase"
```

### Rate limiting on verify

`POST /api/owner/verify` is rate-limited to **5 attempts per minute per IP**. Excess attempts receive a `429 Too Many Requests` response. This endpoint is used by the UI to authenticate the session; brute-force from external IPs is blocked at this layer.

### Resetting a forgotten passphrase

There is no API route to reset the passphrase — this is intentional, to prevent an attacker who gains brief API access from locking you out or covering tracks. If you lose it, delete the row directly from SQLite:

```bash
sqlite3 /path/to/openclaw.db "DELETE FROM owner_auth;"
```

Afterwards, `GET /api/owner/has-passphrase` returns `false` and you can set a new passphrase via the API.

### Production hardening

The passphrase model is designed for a **trusted-operator** environment. For production deployments, apply additional layers:

| Recommendation | How |
|----------------|-----|
| **HTTPS** | Provision a TLS certificate with [certbot](https://certbot.eff.org/) (Let's Encrypt) behind nginx or Caddy |
| **Reverse proxy auth** | Add HTTP Basic Auth at the nginx layer as a second factor before requests reach the app |
| **VPN-only access** | Use [Tailscale](https://tailscale.com/) so the server is never publicly reachable; bind Express to `127.0.0.1` |
| **Firewall** | UFW: allow only ports 22 (SSH) and 443 (HTTPS); block 5000 externally |
| **Secrets management** | On macOS, store the passphrase in Keychain rather than shell history or `.env` files |

---

## Contributing

Contributions welcome. Please open an issue or pull request.

## License

MIT

---

*A work of the AiGovOps Foundation — [www.aigovopsfoundation.org](https://www.aigovopsfoundation.org/)*
