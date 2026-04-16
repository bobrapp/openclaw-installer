# Session & Application Security Guide

## AiGovOps Foundation — OpenClaw Guided Install

---

## Architecture Overview

OpenClaw is designed as a **localhost-first** application. In production deployments, it runs on `127.0.0.1:5000` behind a reverse proxy (nginx/Caddy) with TLS termination. This architecture simplifies session security because the application is not exposed to the public internet by default.

---

## Security Headers (v2.0.1+)

The Express server applies the following security headers via `helmet`:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: blob:; frame-ancestors 'self' *.perplexity.ai *.pplx.app` | Prevents XSS, clickjacking |
| X-Content-Type-Options | `nosniff` | Prevents MIME sniffing |
| X-Frame-Options | `SAMEORIGIN` | Prevents clickjacking |
| X-XSS-Protection | `0` (disabled — CSP is the modern replacement) | — |
| Strict-Transport-Security | `max-age=15552000; includeSubDomains` | HTTPS enforcement |
| Referrer-Policy | `no-referrer` | Prevents URL leakage |
| X-DNS-Prefetch-Control | `off` | Prevents DNS prefetch leakage |
| X-Download-Options | `noopen` | IE-specific protection |
| X-Permitted-Cross-Domain-Policies | `none` | Prevents Flash/PDF cross-domain |

---

## Rate Limiting (v2.0.1+)

| Endpoint Group | Limit | Window | Purpose |
|---------------|-------|--------|---------|
| All `/api/*` routes | 100 requests | 60 seconds | General abuse prevention |
| Mutating routes (POST/PUT/PATCH/DELETE) | 20 requests | 60 seconds | Write amplification prevention |
| Passphrase verification | 5 attempts | 60 seconds | Brute-force protection |

Rate limits are per-IP using `express-rate-limit`. Standard rate limit headers (`RateLimit-*`) are included in responses.

---

## Authentication Model

### Owner Passphrase
- **Set once** via `POST /api/owner/set-passphrase`
- **SHA-256 hashed** before storage — plaintext never persisted
- **Required** for all mutating API endpoints via `x-owner-passphrase` header
- **Rate-limited** to 5 attempts per minute per IP
- **No recovery mechanism** — this is intentional (prevents social engineering)

### Recommendations for Deployment
- Use a passphrase of at least 16 characters
- Use a unique passphrase not reused from other services
- Store the passphrase in a password manager
- If the passphrase is lost, the database must be reset (data preserved in audit log backups)

---

## Input Validation (v2.0.1 Audit)

### Validation Strategy
Every API input is validated at the **server layer** before processing. The approach uses:
1. **Whitelist enums** for all `hostTarget` parameters (6 valid values)
2. **Refined Zod schemas** layered on top of Drizzle-generated schemas, adding enum constraints, length bounds, and integer ranges
3. **Passphrase validation** with type + length bounds (6–256 characters)
4. **ID parameter bounds** checked for NaN + integer range (1–2,147,483,647)

### Endpoint Validation Matrix

| Endpoint | Schema / Validation | What’s Checked |
|----------|---------------------|----------------|
| `GET /api/logs?host=` | `hostTargetSchema` | Host param whitelisted; invalid values ignored |
| `POST /api/logs` | `refinedInsertLogSchema` | Severity enum, host (1–64 chars), step (1–128), message (1–4096), timestamp (1–64) |
| `PATCH /api/state/:id` | `patchStateSchema` + ID bounds | ID integer range, hostTarget enum, status enum, currentStep (0–20) |
| `PATCH /api/hardening/toggle/:id` | ID bounds | ID integer range validated |
| `GET /api/hardening/:hostTarget` | `hostTargetSchema` | Whitelisted against 6 valid hosts |
| `GET /api/scripts/*/:hostTarget` | `hostTargetSchema` | Whitelisted (preflight, install, rollback) |
| `GET /api/preflight/run/:hostTarget` | `hostTargetSchema` | Whitelisted before SSE stream begins |
| `POST /api/deploy/execute` | Custom Zod object | bundleId, hostTarget (string), inputs (Record), confirm (boolean) |
| `POST /api/owner/set-passphrase` | `passphraseSchema` | String, 6–256 characters |
| `POST /api/owner/verify` | `passphraseSchema` | String, 6–256 characters; rejects invalid early |
| `GET /api/audit/export-pdf?lang=` | Language whitelist | 15 valid language codes; defaults to `en` |

### Client-Side Validation
The React frontend uses form validation on all user inputs, but **server-side validation is the authoritative layer** — client validation is for UX only.

### Shell Command Safety
- All shell scripts are generated server-side from validated templates
- **`execFileSync`** is used instead of `execSync` to prevent shell injection
- User-provided values are never interpolated directly into shell commands
- All generated scripts use `set -euo pipefail` for strict error handling
- Language parameter for PDF export is whitelisted (not interpolated)

---

## CORS Policy

In production, CORS should be restricted to the application's own origin:

```javascript
// Production deployment behind reverse proxy
app.use(cors({ origin: 'https://yourdomain.com' }));

// Local development
app.use(cors({ origin: 'http://127.0.0.1:5000' }));
```

The default deployment uses same-origin requests (no CORS needed for the main app). Cross-origin is only relevant when the API is accessed from a different domain.

---

## Deployment Security Checklist

When deploying OpenClaw to a server:

- [ ] **Set a strong owner passphrase** (16+ characters)
- [ ] **Run behind a reverse proxy** (nginx/Caddy) with TLS
- [ ] **Bind to localhost** (`127.0.0.1:5000`) — never expose port 5000 directly
- [ ] **Use Tailscale or WireGuard** for remote access instead of opening ports
- [ ] **Enable firewall** — allow only 80/443 (reverse proxy) and 22 (SSH)
- [ ] **Set `NODE_ENV=production`** to disable development features
- [ ] **Review generated scripts** before execution — always use `--dry-run` first
- [ ] **Monitor audit logs** — check the hash chain periodically for tampering
- [ ] **Keep dependencies updated** — Dependabot PRs should be reviewed weekly

---

© 2024–2026 AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders
