# Model Council Review — Synthesis

Three frontier AI models independently reviewed the OpenClaw Installer project end-to-end on April 15, 2026. Each model brought a different analytical focus:

- **GPT 5.4** — Broad coverage with emphasis on trust boundaries and deployment supply-chain
- **Claude Opus 4.6** — Deep focus on authentication architecture, audit chain integrity, and deployment pipeline safety
- **Gemini 3.1 Pro** — Enterprise governance lens with emphasis on immutability claims and operational constraints

## Where Models Agree

| Finding | GPT 5.4 | Claude Opus 4.6 | Gemini 3.1 Pro | Evidence |
|---------|---------|-----------------|----------------|----------|
| Passphrase hashing is critically weak (unsalted SHA-256, no KDF) | ✓ | ✓ | ✓ | `storage.ts` — single round, no salt, timing-unsafe comparison |
| Command injection in PDF export via `execSync` | ✓ | ✓ | ✓ | `routes.ts` — `PYTHON_BIN` env var interpolated into shell |
| All mutating API endpoints are unauthenticated | ✓ | ✓ | ✓ | `DELETE /api/logs`, `POST /api/state/reset` — internet-exposed |
| `curl \| bash` install pattern is a supply-chain risk | ✓ | ✓ | ✓ | No checksum, no pinned version, arbitrary postinstall scripts |
| No automated test suite exists | ✓ | ✓ | ✓ | Zero unit/integration tests, CI runs structural grep checks only |
| Cloud-init YAML hardcoded in React component will drift | ✓ | ✓ | ✓ | Three copies of similar logic that will inevitably diverge |

## Where Models Disagree

| Topic | GPT 5.4 | Claude Opus 4.6 | Gemini 3.1 Pro | Why They Differ |
|-------|---------|-----------------|----------------|-----------------|
| Audit chain immutability | External anchoring (Merkle tree) | Remove `DELETE /api/logs` | SQLite chain rebuildable; needs external anchoring (syslog, S3) | Gemini took the strongest position; Opus focused on API surface |
| Hetzner rebuild bug | Not flagged | P0 — rebuild omits `user_data` | Not flagged | Only Opus caught this concrete CI/CD bug |
| HTTPS enforcement | Medium priority | Session tokens + HSTS | Self-signed cert from second zero | Gemini more immediate; Opus more architecturally correct |
| `execSync` event loop blocking | Not specifically flagged | Flagged as LOW | Flagged as MEDIUM — blocks all requests 60s | Gemini identified concurrency problem, not just security |

## Unique Discoveries

| Model | Finding | Impact |
|-------|---------|--------|
| Claude Opus 4.6 | Hetzner rebuild workflow omits `user_data` — rebuilds produce bare Ubuntu | P0 bug — second deploys silently break |
| Claude Opus 4.6 | `package.json` name is `rest-express` — SBOMs report wrong component | Undermines supply-chain transparency |
| Claude Opus 4.6 | Unused `passport`/`express-session` deps suggest abandoned auth work | Signals incomplete security architecture |
| GPT 5.4 | Preflight runner writes simulated (random) results to immutable audit chain | Core governance artifact contains fabricated data |
| Gemini 3.1 Pro | Systemd service may hit `StartLimitHit` if app fails before secrets exist | Cloud-init restart loops on first boot |
| Gemini 3.1 Pro | Auto-generate OpenAPI docs from existing drizzle-zod schemas | Zero-effort API docs from existing code |

## Fixes Applied (v1.1.0)

Based on the council's recommendations, the following fixes were implemented:

### P0 (Critical — Applied)
1. **Passphrase hashing** — Replaced bare SHA-256 with `scryptSync` + random salt + `timingSafeEqual` (`server/storage.ts`)
2. **Command injection** — Replaced `execSync` with `execFileSync` in PDF export (`server/routes.ts`)
3. **Input validation** — Added Zod schema validation on all POST/PATCH endpoints (`server/routes.ts`)
4. **Hetzner rebuild** — Fixed to delete + recreate with cloud-init instead of bare rebuild (`.github/workflows/deploy-hetzner.yml`)

### P1 (High — Applied)
5. **Package identity** — Changed `package.json` name from `rest-express` to `openclaw-installer`
6. **Server binding** — Default to `127.0.0.1` in production mode (`server/index.ts`)
7. **Database backup** — Added daily SQLite backup cron to deploy script (`deploy/install.sh`)

### Remaining Recommendations (Future Work)
- [ ] Gate all mutating endpoints behind owner auth middleware
- [ ] Add unit tests for audit chain, auth, and API validation
- [ ] Add `.github/dependabot.yml` for automated dependency updates
- [ ] Split `routes.ts` into modules; extract bash to `.sh.template` files
- [ ] Auto-generate OpenAPI docs from drizzle-zod schemas
- [ ] External audit chain anchoring (append-only S3 or syslog)
- [ ] Add dedicated `/health` endpoint
- [ ] 20-language i18n system with runtime language switching
- [ ] 90% test coverage with chaos monkey and scale testing

## Individual Reviews

- [GPT 5.4 Review](./review-gpt-5.4.md)
- [Claude Opus 4.6 Review](./review-claude-opus-4.6.md)
- [Gemini 3.1 Pro Review](./review-gemini-3.1-pro.md)

---

*Review conducted against commit state as of 2026-04-15. Fixes applied in the same session.*
