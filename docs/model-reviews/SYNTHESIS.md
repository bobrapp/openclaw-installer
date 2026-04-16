# Model Council Review — Synthesis

Three frontier AI models independently reviewed the OpenClaw Guided Install project end-to-end on April 15, 2026. Each model brought a different analytical focus:

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

## Fixes Applied

### Session 1 — v1.1.0 (P0/P1 Critical)

1. **Passphrase hashing** — Replaced bare SHA-256 with `scryptSync` + random salt + `timingSafeEqual` (`server/storage.ts`)
2. **Command injection** — Replaced `execSync` with `execFileSync` in PDF export (`server/routes.ts`)
3. **Input validation** — Added Zod schema validation on all POST/PATCH endpoints (`server/routes.ts`)
4. **Hetzner rebuild** — Fixed to delete + recreate with cloud-init instead of bare rebuild (`.github/workflows/deploy-hetzner.yml`)
5. **Package identity** — Changed `package.json` name from `rest-express` to `openclaw-installer`
6. **Server binding** — Default to `127.0.0.1` in production mode (`server/index.ts`)
7. **Database backup** — Added daily SQLite backup cron to deploy script (`deploy/install.sh`)

### Session 2 — v1.2.0 (All Remaining P0/P1)

**P0 — Critical Security:**

8. **Owner auth middleware** — All mutating endpoints (`POST /api/logs`, `PATCH /api/state/:id`, `POST /api/state/reset`, `PATCH /api/hardening/toggle/:id`, `POST /api/logs/archive`) now require owner passphrase in `x-owner-passphrase` header (`server/routes.ts`)
9. **DELETE /api/logs removed** — Contradicted immutability claim. Replaced with `POST /api/logs/archive` which logs the action to the audit chain before clearing (`server/routes.ts`)
10. **Preflight results marked as simulated** — Audit log entries from the SSE preflight runner now include `[SIMULATED — web preview, not real host checks]` to prevent fabricated data in the audit chain (`server/routes.ts`)
11. **GitHub Actions script injection** — Moved `${{ secrets.* }}` and `${{ inputs.* }}` from shell interpolation into `env:` blocks in both Hetzner and Vultr deploy workflows
12. **Deploy trigger deduplication** — Hetzner changed to `workflow_dispatch` only (Vultr keeps push trigger with `paths-ignore` for docs/markdown)

**P1 — High Priority:**

13. **`/health` endpoint** — Returns `{ status, uptime, version, memory, db, timestamp }` at `GET /health` (`server/routes.ts`)
14. **Rate limiting** — `POST /api/owner/verify` limited to 5 attempts per IP per 60 seconds with automatic cleanup (`server/routes.ts`)
15. **Unused deps removed** — Stripped `passport`, `passport-local`, `express-session`, `memorystore` and their `@types/*` packages (20 packages removed)
16. **Dependabot** — Added `.github/dependabot.yml` for weekly npm and GitHub Actions dependency updates
17. **Error handling** — Changed `catch (err: any)` to `catch (err: unknown)` with proper narrowing; internal paths/tracebacks no longer leaked to clients
18. **install.sh hardened** — Download-then-execute pattern (not pipe to bash), `npm ci` instead of `npm install`, secrets.env directory created with 600 permissions
19. **update.sh created** — Safe update script with pre-update backup, build, health check, and automatic rollback on failure (`deploy/update.sh`)
20. **Systemd hardened** — `RestartSec=10`, `StartLimitIntervalSec=300`, `StartLimitBurst=5`, `EnvironmentFile=-/etc/openclaw/secrets.env` for graceful handling of missing secrets
21. **Unit tests** — 16 Vitest tests covering audit chain integrity, scrypt auth (including legacy SHA-256 fallback), Zod validation, install logs, and health endpoint schema (`tests/storage.test.ts`)
22. **API documentation** — Full reference for all 21 endpoints with auth requirements, request/response examples (`docs/api.md`)
23. **README auth section** — Documents the passphrase model, what it protects, rate limiting, production hardening recommendations, and passphrase reset procedure

## Remaining Recommendations (Future Work)

- [ ] External audit chain anchoring (append-only S3 or syslog) — all three models agree this is needed for true immutability
- [ ] HTTPS enforcement from first boot (self-signed cert → Certbot upgrade)
- [ ] Split `routes.ts` into modules; extract bash to `.sh.template` files
- [ ] Auto-generate OpenAPI docs from drizzle-zod schemas (Gemini recommendation)
- [ ] Cloud-init YAML deduplication (fetch from API/build-time instead of hardcoding in React)
- [ ] 20-language i18n system with runtime language switching
- [ ] 90% test coverage with chaos monkey and scale testing
- [ ] 3rd grade reading level documentation rewrite
- [ ] Project rename (recommended: keep `openclaw-installer`)

## Individual Reviews

- [GPT 5.4 Review](./review-gpt-5.4.md)
- [Claude Opus 4.6 Review](./review-claude-opus-4.6.md)
- [Gemini 3.1 Pro Review](./review-gemini-3.1-pro.md)

---

*Review conducted against commit state as of 2026-04-15. Session 1 fixes applied same day. Session 2 fixes (all remaining P0/P1) applied 2026-04-15.*
