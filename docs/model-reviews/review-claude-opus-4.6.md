# OpenClaw Guided Install — Deep-Dive Review

**Reviewer focus**: Authentication & secrets architecture, immutable audit chain integrity, and deployment pipeline safety. This review prioritizes findings that could lead to data loss, unauthorized access, or silent security regression in production.

---

## 1. Security

### HIGH — Passphrase Hashing Uses Bare SHA-256 (No Salt, No KDF)

**File**: `server/storage.ts:159-168`

The owner passphrase — the single credential protecting the entire audit log — is hashed with one round of unsalted SHA-256. This is trivially brute-forceable with commodity hardware (GPU hash rates exceed 10 billion SHA-256/sec).

```typescript
// Current — vulnerable
setOwnerPassphrase(passphrase: string): void {
  const hash = sha256(passphrase);        // one round, no salt
  db.delete(ownerAuth).run();
  db.insert(ownerAuth).values({ passphraseHash: hash }).run();
}

verifyOwnerPassphrase(passphrase: string): boolean {
  const record = db.select().from(ownerAuth).get();
  if (!record) return false;
  return record.passphraseHash === sha256(passphrase); // timing-unsafe comparison
}
```

**Recommendation**: Use `scrypt` or `argon2` (both available in Node.js `crypto` without extra deps). Also use `timingSafeEqual` for comparison:

```typescript
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

setOwnerPassphrase(passphrase: string): void {
  const salt = randomBytes(32).toString("hex");
  const hash = scryptSync(passphrase, salt, 64).toString("hex");
  db.delete(ownerAuth).run();
  db.insert(ownerAuth).values({ passphraseHash: `${salt}:${hash}` }).run();
}

verifyOwnerPassphrase(passphrase: string): boolean {
  const record = db.select().from(ownerAuth).get();
  if (!record) return false;
  const [salt, stored] = record.passphraseHash.split(":");
  const derived = scryptSync(passphrase, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(stored), Buffer.from(derived));
}
```

### HIGH — Passphrase Sent in Cleartext HTTP Headers

**File**: `server/routes.ts:140, 149, 183`

The owner passphrase is sent via `x-owner-passphrase` header. Deploy workflows and hosting-deals page all use plain HTTP (`http://$SERVER_IP`). The passphrase is exposed to network sniffing on every audit query.

```typescript
const passphrase = req.headers["x-owner-passphrase"] as string;
```

**Recommendation**: 
1. Issue a short-lived session token after verification (`POST /api/owner/verify`) and require that token in a cookie or Authorization header for subsequent requests.
2. Enforce HTTPS in production — the nginx config in `deploy/install.sh` currently serves only HTTP on port 80. Add an automatic certbot enrollment step or, at minimum, add `Strict-Transport-Security` headers and a redirect once TLS is configured.
3. Add rate-limiting to `POST /api/owner/verify` (currently unlimited, facilitating brute-force).

### HIGH — No Input Validation on POST/PATCH Endpoints

**File**: `server/routes.ts:17-19, 33-37`

`POST /api/logs` and `PATCH /api/state/:id` pass `req.body` directly to the database layer with zero validation. The Zod schemas exist in `shared/schema.ts` but are never called server-side.

```typescript
app.post("/api/logs", (req, res) => {
  const log = storage.addLog(req.body);    // unsanitized
  res.json(log);
});

app.patch("/api/state/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const state = storage.updateState(id, req.body);  // arbitrary fields
  res.json(state);
});
```

**Recommendation**: Parse every request body through the Zod schemas you already define:

```typescript
import { insertInstallLogSchema } from "@shared/schema";

app.post("/api/logs", (req, res) => {
  const parsed = insertInstallLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const log = storage.addLog(parsed.data);
  res.json(log);
});
```

### HIGH — Command Injection in PDF Export

**File**: `server/routes.ts:194`

The `PYTHON_BIN` env var is interpolated into `execSync` without sanitization. If an attacker controls that env var (e.g., via a crafted `.env` file on the server), they get arbitrary command execution:

```typescript
const python = process.env.PYTHON_BIN ?? "python3";
execSync(`${python} "${scriptPath}" --db "${dbPath}" --output "${tmpPdf}"`, { ... });
```

**Recommendation**: Use `execFileSync` instead of `execSync` to avoid shell interpretation:

```typescript
import { execFileSync } from "child_process";
execFileSync(python, [scriptPath, "--db", dbPath, "--output", tmpPdf], {
  timeout: 60_000,
  stdio: ["ignore", "pipe", "pipe"],
});
```

### HIGH — `install.sh` Encourages Piping Curl to Bash as Root

**File**: `deploy/install.sh:3`, `client/src/pages/hosting-deals.tsx:195`

```bash
# Usage: curl -fsSL https://...install.sh | bash
```

This is a well-known antipattern. If the download is interrupted mid-stream, partial scripts execute. The hosting-deals page prominently features this as a copy-paste one-liner.

**Recommendation**:
1. Download first, then execute: `curl -fsSL -o install.sh https://...; bash install.sh`
2. Add a checksum verification step.
3. At minimum, add `set -euo pipefail` (already present — good) and a trap to detect partial downloads.

### MEDIUM — Entire API is Unauthenticated (Except Audit)

**File**: `server/routes.ts`

Routes like `DELETE /api/logs`, `POST /api/state/reset`, `PATCH /api/hardening/toggle/:id` have no authentication. Anyone who can reach the server can wipe install logs, reset wizard state, or toggle hardening checks. On cloud deployments with nginx on port 80, this is internet-exposed.

**Recommendation**: Add middleware that requires the owner passphrase (or a session token) for all mutating endpoints. At minimum, bind the Express server to `127.0.0.1` instead of `0.0.0.0`.

### MEDIUM — Server Binds to 0.0.0.0 by Default

**File**: `server/index.ts:96-98`

```typescript
httpServer.listen({
  port,
  host: "0.0.0.0",     // publicly accessible
  reusePort: true,
});
```

The hardening checklist tells users to bind to localhost only, but the application itself does the opposite. In a `curl | bash` deploy, nginx proxies port 80 → 5000, but port 5000 is also directly reachable.

**Recommendation**: Default to `127.0.0.1` in production. The nginx reverse proxy already forwards to localhost:

```typescript
const host = process.env.NODE_ENV === "production" ? "127.0.0.1" : "0.0.0.0";
```

### MEDIUM — DELETE /api/logs Destroys Immutability Claim

**File**: `server/routes.ts:22-25`, `server/storage.ts:70-72`

The project's core value proposition is immutable audit logging, yet `DELETE /api/logs` wipes the entire install log table without authentication, and `clearLogs()` doesn't create any audit trail of the deletion.

**Recommendation**: Remove the DELETE endpoint entirely, or gate it behind owner authentication and record the deletion action in the audit chain before executing it.

### MEDIUM — Simulated Preflight Results in Production

**File**: `server/routes.ts:126-127`

The SSE-based preflight runner generates random pass/warn/fail results rather than executing actual checks:

```typescript
const statuses: Array<"pass" | "warn" | "fail"> = ["pass", "pass", "pass", "pass", "warn", "pass"];
check.status = statuses[Math.floor(Math.random() * statuses.length)];
```

These fake results are then written to the immutable audit log (line 105-109). This means the audit chain contains fabricated data with no indication it's simulated.

**Recommendation**: Add a `simulated: true` field to audit log entries, or actually execute the checks on the host (for the macOS target, the shell-based approach works). At minimum, document prominently that the web-based runner is a demo/preview.

### LOW — Audit Chain Ordering Bug Risk

**File**: `server/storage.ts:141`

`verifyAuditChain()` fetches all logs without explicit ordering:

```typescript
const allLogs = db.select().from(auditLogs).all(); // ascending by id
```

The comment says "ascending by id" but there's no `.orderBy()` clause. SQLite returns rows in insertion order *by default*, but this is an implementation detail, not a guarantee.

**Recommendation**: Add explicit ordering:
```typescript
const allLogs = db.select().from(auditLogs).orderBy(auditLogs.id).all();
```

---

## 2. CI/CD & DevOps

### HIGH — Both Deploy Workflows Trigger on Every Push to Master

**File**: `.github/workflows/deploy-hetzner.yml:3-5`, `.github/workflows/deploy-vultr.yml:3-5`

Both Hetzner and Vultr deployment workflows trigger on `push: branches: [master]`. This means every merge to master triggers two cloud server provisions simultaneously.

```yaml
on:
  push:
    branches: [master]
```

While they have GitHub environment protection rules, both target the same `production` environment. If approvers aren't diligent, each push deploys to two providers and potentially doubles cloud costs.

**Recommendation**: Change at least one to `workflow_dispatch` only, or create a single dispatch workflow that takes `provider` as an input. Add `paths-ignore` for docs-only changes.

### HIGH — Rebuild Step Doesn't Pass Cloud-Init (Hetzner)

**File**: `.github/workflows/deploy-hetzner.yml:101-127`

When rebuilding an existing server, the workflow calls the Hetzner rebuild API with only the `image` parameter. It does **not** pass `user_data` (cloud-init). The rebuilt server will boot a bare Ubuntu without any application deployed.

```bash
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer ${{ secrets.HETZNER_API_TOKEN }}" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE_ID\"}" \       # no user_data!
  "https://api.hetzner.cloud/v1/servers/${{ steps.existing.outputs.server_id }}/actions/rebuild")
```

**Recommendation**: Include `user_data` in the rebuild payload, or SSH into the existing server and run `deploy/install.sh` instead.

### MEDIUM — Secret Validation Uses Shell String Interpolation

**File**: `.github/workflows/deploy-hetzner.yml:65`, `.github/workflows/deploy-vultr.yml:67`

```bash
if [ -z "${{ secrets.HETZNER_API_TOKEN }}" ]; then
```

This interpolates the secret into the shell command. While GitHub Actions masks secrets in logs, if the secret contains shell metacharacters (`$`, backticks), it could cause unexpected behavior or partial execution. 

**Recommendation**: Use environment variables:
```yaml
- name: Validate API token
  env:
    TOKEN: ${{ secrets.HETZNER_API_TOKEN }}
  run: |
    if [ -z "$TOKEN" ]; then
      echo "::error::Token not set"
      exit 1
    fi
```

### MEDIUM — No Test Suite

The project has zero automated tests. The CI pipeline (`preflight.yml`) performs structural grep checks (schema presence, hardcoded secrets) but no unit tests, integration tests, or API endpoint tests. The `package.json` has no `test` script.

**Recommendation**: Add at minimum:
1. Unit tests for `storage.ts` — audit chain creation, verification, hash correctness
2. API integration tests for auth-protected routes (verify passphrase rejection)
3. A smoke test for the deploy script using Docker

### LOW — `package.json` Name Mismatch

**File**: `package.json:2`

```json
"name": "rest-express"
```

The package name is a generic template name, not `openclaw-installer`. This affects SBOM output (CycloneDX will report the wrong package name) and npm registry operations.

---

## 3. Code Quality

### HIGH — 1,180-Line God File (`routes.ts`)

**File**: `server/routes.ts` — 1,180 lines

This single file contains:
- All API route handlers (logs, state, hardening, preflight, audit, owner auth, PDF export, releases)
- Shell script generation for 4 host targets (400+ lines of bash strings)
- Preflight check definitions and message maps
- Host configuration data

**Recommendation**: Split into modules:
```
server/
  routes/
    logs.ts
    state.ts  
    hardening.ts
    preflight.ts
    audit.ts
    releases.ts
  scripts/
    generators.ts    (preflight/install/rollback scripts)
  config/
    hosts.ts          (host configs, check definitions)
```

### MEDIUM — Hardcoded Shell Scripts as Template Literals

**File**: `server/routes.ts:400-1090`

Nearly 700 lines of bash code are embedded as TypeScript template literals. This makes the bash untestable, unlintable, and hard to maintain. ShellCheck can't analyze it. The deploy-validate workflow lints `deploy/install.sh` but can't lint these inline scripts.

**Recommendation**: Move generated scripts to `.sh.template` files and use a simple variable substitution engine. This allows ShellCheck to lint them.

### MEDIUM — Duplicate Cloud-Init Logic

The cloud-init YAML exists in three places:
1. `deploy/cloud-init.yaml` (actual file, used by CI)
2. `client/src/pages/hosting-deals.tsx:226` (hardcoded string in `CloudInitViewer`)
3. `server/routes.ts` install script generators (similar but slightly different logic)

These will inevitably drift.

**Recommendation**: The `CloudInitViewer` component should fetch `deploy/cloud-init.yaml` at build time or serve it from an API endpoint. The hosting-deals page already has `CLOUD_INIT_URL` pointing to the raw GitHub file.

### MEDIUM — Unused Dependencies

**File**: `package.json`

Multiple Radix UI packages are imported but don't appear in any page component (e.g., `@radix-ui/react-context-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-aspect-ratio`). Same for `passport`, `passport-local`, `express-session`, `memorystore` — there's no session management or passport authentication in the actual code.

**Recommendation**: Run `npx depcheck` and remove unused packages. The unused auth packages (`passport`, `express-session`) are especially concerning because they suggest abandoned authentication work.

### LOW — Error Messages Leak Internal Paths

**File**: `server/routes.ts:218`

```typescript
res.status(500).json({ error: "PDF generation failed", detail: String(err.message).slice(0, 500) });
```

Error messages from `execSync` include full filesystem paths, Python tracebacks, and potentially environment variable contents. In production, return generic errors and log details server-side.

---

## 4. Open-Source Maturity

### HIGH — No LICENSE File Content Verification

The `package.json` declares MIT but the review context lists a `LICENSE` file. The governance check in `routes.ts:303` only checks for file existence, not that the license matches the declared type.

**Recommendation**: Add `SPDX-License-Identifier: MIT` headers to source files. Include an automated check in CI that validates `LICENSE` file content.

### MEDIUM — CODEOWNERS May Be Missing

The release dashboard checks for `CODEOWNERS` via the GitHub API, but there's no `CODEOWNERS` file in the repo listing. For an open-source governance project, this is table stakes.

**Recommendation**: Create `.github/CODEOWNERS`:
```
* @bobrapp
deploy/ @bobrapp
server/storage.ts @bobrapp
```

### MEDIUM — SBOM Names Will Be Wrong

As noted, `package.json` says `name: "rest-express"`. CycloneDX will generate SBOMs with this as the root component name, undermining the supply-chain transparency that SBOM is meant to provide.

### LOW — No Dependabot / Renovate Configuration

No automated dependency update mechanism. For a security-focused project, stale dependencies are a risk signal.

**Recommendation**: Add `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## 5. UX & Accessibility

### MEDIUM — Hosting Deals Page Has Accessibility Gaps

**File**: `client/src/pages/hosting-deals.tsx`

1. **CopyButton** (line 207-215) uses a bare `<button>` with no `aria-label`. Screen readers would announce it as just "Copy" with no context of what's being copied.
2. Comparison table (line 337-403) has no `<caption>` or `aria-describedby`.
3. Affiliate/coupon codes use only color to indicate importance (`text-emerald-600`), with no accompanying text marker for color-blind users.

**Recommendation**:
```tsx
<button
  onClick={handleCopy}
  aria-label={`Copy ${code} to clipboard`}
  className="..."
>
```

### MEDIUM — No Loading/Error States for Release Dashboard

**File**: `server/routes.ts:234-364`

The `/api/releases` endpoint makes ~15 parallel GitHub API calls. If the API is rate-limited (unauthenticated: 60 req/hr), the entire page fails with a generic 502. The client likely has no graceful degradation for partial failures.

**Recommendation**: Cache release data server-side (even a 5-minute in-memory cache) and return partial results with a `warnings` field for failed sub-requests.

### LOW — Hardcoded Pricing in Static Component

**File**: `client/src/pages/hosting-deals.tsx:44-193`

All hosting pricing is hardcoded in a TypeScript constant. Prices change frequently. The disclaimer at line 632 mentions "as of April 2026" which will quickly become stale.

**Recommendation**: Move deal data to a JSON file that can be updated without code changes. Add a `last_verified` field per deal.

---

## 6. Deployment & Operations

### HIGH — No Database Backup in Deploy Scripts

**File**: `deploy/install.sh`, `deploy/cloud-init.yaml`

Neither the install script nor cloud-init configures any backup for `openclaw.db`. The SQLite database contains the immutable audit chain — the project's primary value artifact. A server failure means permanent loss of the audit trail.

**Recommendation**: Add a cron job in the install script:
```bash
# Daily SQLite backup
cat > /etc/cron.daily/openclaw-backup << 'CRON'
#!/bin/bash
sqlite3 /opt/openclaw/app/openclaw.db ".backup /opt/openclaw/backups/openclaw-$(date +%Y%m%d).db"
find /opt/openclaw/backups -name "*.db" -mtime +30 -delete
CRON
chmod +x /etc/cron.daily/openclaw-backup
```

### HIGH — No Update Path

**File**: `deploy/install.sh:64-70`

The install script handles initial clone and `git pull --ff-only`, but there's no safe update mechanism that:
1. Backs up the database before updating
2. Runs migrations if the schema changes
3. Restarts the service after rebuilding
4. Rolls back if the new version fails health checks

**Recommendation**: Add an `update.sh` script or a `/api/admin/update` endpoint (owner-authenticated) that performs: backup → pull → npm install → build → migrate → restart → health-check → rollback-on-failure.

### MEDIUM — Cloud-Init YAML Indentation Issues

**File**: `deploy/cloud-init.yaml:44-67`

The heredoc sections use leading whitespace inside the `runcmd` block. Cloud-init's YAML parser may include these leading spaces in the file content, creating invalid systemd unit files with indented `[Unit]`, `[Service]`, and `[Install]` section headers.

**Recommendation**: Use `|2` or remove leading indentation from the heredoc content. Test with `cloud-init devel schema --config-file deploy/cloud-init.yaml`.

### MEDIUM — No Health Check Endpoint

The hardening checklist recommends a `/health` endpoint (lines 190, 207, 229 in `storage.ts`), but routes.ts doesn't implement one. The deploy workflows poll `/api/hosts` as a proxy health check.

**Recommendation**: Add a dedicated health endpoint:
```typescript
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    memory: process.memoryUsage().rss,
    db: (() => { try { storage.getOrCreateState(); return "ok"; } catch { return "error"; } })(),
  });
});
```

### LOW — Log Rotation Not Configured in Deploy

Neither `install.sh` nor `cloud-init.yaml` sets up logrotate for the application. The systemd journal will grow unbounded for services using `StandardOutput=journal`. The generated install scripts for DigitalOcean do configure logrotate, but the actual deploy scripts don't.

---

## 7. Documentation

### MEDIUM — README Doesn't Document Auth Model

The README extensively documents features but never explains:
- How to set the owner passphrase
- What the passphrase protects
- How to reset it if forgotten (currently impossible without database access)
- That the passphrase is the only auth mechanism and most endpoints are unprotected

**Recommendation**: Add an "Authentication" section to the README explaining the single-passphrase model, its limitations, and recommended production hardening (reverse proxy auth, VPN-only access).

### MEDIUM — No API Documentation

There are 15+ API endpoints but no documentation for them. For a project targeting governance-conscious users, API docs should cover request/response schemas, authentication requirements, and audit implications.

**Recommendation**: Add an OpenAPI spec file (`openapi.yaml`) or at minimum a `docs/api.md` file documenting each endpoint.

### LOW — Inline Comments Missing in Critical Sections

`server/storage.ts` has good comments on the audit chain logic, but `server/routes.ts` has minimal comments on security-critical decisions (why passphrase is checked via headers, why preflight results are simulated, etc.).

---

## Summary: Top 5 Fixes by Impact

| Priority | Issue | File | Effort |
|----------|-------|------|--------|
| **P0** | Replace SHA-256 passphrase hashing with scrypt + salt | `server/storage.ts` | 1 hour |
| **P0** | Add input validation using existing Zod schemas | `server/routes.ts` | 2 hours |
| **P0** | Fix Hetzner rebuild to include cloud-init | `deploy-hetzner.yml` | 30 min |
| **P1** | Authenticate all mutating API endpoints | `server/routes.ts` | 4 hours |
| **P1** | Add SQLite backup to deploy scripts | `deploy/install.sh` | 1 hour |

---

*Review conducted against commit state as of 2026-04-15. Reviewer focused on security architecture, deployment integrity, and audit chain correctness.*
