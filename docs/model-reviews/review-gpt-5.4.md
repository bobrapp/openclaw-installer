# OpenClaw Guided Install review (GPT 5.4)

## Executive summary

OpenClaw Guided Install has a strong product concept and unusually good governance intent for an early open-source installer project: the repository already includes a security policy, contribution guide, code owners, issue/PR templates, release automation, SBOM generation, and deployment workflows. ([repository](https://github.com/bobrapp/openclaw-installer), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [SECURITY.md](https://github.com/bobrapp/openclaw-installer/blob/master/SECURITY.md), [CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [CODEOWNERS](https://github.com/bobrapp/openclaw-installer/blob/master/CODEOWNERS), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml), [deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml))

The biggest risks are not missing features but trust boundaries: the backend exposes several unauthenticated mutation endpoints, the passphrase model is weak for a networked service, the app binds publicly to `0.0.0.0`, and the deploy paths rely on live `curl|bash`, `npm install`, and unpinned repository state. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))

The next major opportunity is to convert the project from a compelling demo/governance showcase into a production-ready installer platform by tightening auth, validating input, making deployments reproducible, adding real tests, and decomposing the monolithic backend. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

---

## Priority roadmap

### High impact

1. Add real authentication/authorization around all mutating API endpoints, not just audit endpoints. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts))
2. Replace raw SHA-256 passphrase storage with Argon2id or scrypt, add rate limiting, and require stronger passphrases. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts))
3. Stop deploying from mutable live sources (`curl|bash`, `git clone`, `npm install`) and pin releases, commits, and dependency resolution. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))
4. Put TLS and deployment hardening into the default path rather than a manual “next step.” ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))
5. Add real automated tests and make CI enforce them. ([package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml), [deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml))
6. Fix the documentation contradictions, especially the Apache-vs-MIT license mismatch and README claims that exceed what CI currently verifies. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [LICENSE](https://github.com/bobrapp/openclaw-installer/blob/master/LICENSE), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))

### Medium impact

1. Break `server/routes.ts` into route modules, service modules, and host-specific installers. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
2. Make the preflight runner execute real checks instead of randomized demo output. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))
3. Add backup/restore, health, and update procedures for the SQLite state and deployment targets. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))
4. Improve mobile/accessibility quality on the hosting deals page, especially text size, data density, and feedback semantics. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))
5. Add caching and error isolation for the GitHub release dashboard API. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

### Low impact

1. Remove stale dependencies and narrow the installed surface area. ([package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))
2. Polish contributor ergonomics with local dev bootstrap, sample envs, and architecture docs. ([CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))
3. Convert PR status comments to upserts to reduce bot noise. ([deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml), [deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))

---

## 1) Security

### High

- `server/routes.ts` exposes unauthenticated write/delete endpoints for logs, install state, and hardening toggles: `POST /api/logs`, `DELETE /api/logs`, `PATCH /api/state/:id`, `POST /api/state/reset`, and `PATCH /api/hardening/toggle/:id`. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
- Because `server/index.ts` listens on `0.0.0.0`, those endpoints are network reachable whenever the service is exposed behind nginx or a cloud load balancer. ([server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))
- That combination means an attacker does not need to break the audit passphrase path to manipulate state or erase operational logs. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts))

**Recommendation:** add an explicit auth layer for all non-readonly API routes, with a session or signed bearer token plus role checks. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))

```ts
// server/middleware/requireOwner.ts
import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !isValidOwnerToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
```

- The owner passphrase is accepted at only six characters in `POST /api/owner/set-passphrase`, and `server/storage.ts` stores it as a plain SHA-256 hash with no salt and no memory-hard work factor. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts))
- `POST /api/owner/verify` is unauthenticated and there is no visible rate limiting anywhere in the server entrypoint, which makes online guessing materially easier than it should be. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts))

**Recommendation:** use Argon2id or scrypt, require at least 12-16 characters, add per-IP and per-account rate limiting, and add lockout/alerting for repeated failures. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [SECURITY.md](https://github.com/bobrapp/openclaw-installer/blob/master/SECURITY.md))

```ts
import argon2 from "argon2";

export async function setOwnerPassphrase(passphrase: string) {
  const passphraseHash = await argon2.hash(passphrase, { type: argon2.argon2id });
  db.delete(ownerAuth).run();
  db.insert(ownerAuth).values({ passphraseHash }).run();
}
```

- The request logger in `server/index.ts` captures and logs every JSON API response body for `/api/*`, so a successful response from `/api/audit/logs` would be re-emitted into application logs and partially defeat the owner-only protection model. ([server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

**Recommendation:** log metadata only for sensitive routes, and redact or suppress bodies for `/api/audit/*`, `/api/owner/*`, and any future secret-bearing endpoints. ([server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [SECURITY.md](https://github.com/bobrapp/openclaw-installer/blob/master/SECURITY.md))

```ts
const SENSITIVE_PATHS = [/^\/api\/audit\//, /^\/api\/owner\//];
if (path.startsWith("/api")) {
  const shouldRedact = SENSITIVE_PATHS.some((re) => re.test(path));
  let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
  if (!shouldRedact && capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
  log(logLine);
}
```

- The project imports `drizzle-zod` schemas in `shared/schema.ts`, but the route layer accepts `req.body` directly for log creation, state mutation, and passphrase operations without schema validation. ([shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

**Recommendation:** validate every request body and route param at the boundary and return typed 400 errors. ([shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

```ts
import { z } from "zod";

const setPassphraseSchema = z.object({
  passphrase: z.string().min(12).max(256),
});

app.post("/api/owner/set-passphrase", (req, res) => {
  const parsed = setPassphraseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  // continue...
});
```

- Both the one-liner installer and cloud-init path execute mutable remote bootstrap steps such as the NodeSource setup script, `git clone` of the live repository, and `npm install` from the current dependency graph without a pinned commit or artifact signature. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))
- The hosting page further encourages `curl -fsSL .../deploy/install.sh | bash`, which compounds the trust problem by executing whatever is on the default branch at request time. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

**Recommendation:** publish versioned release artifacts, install from pinned tags or SHAs, use `npm ci` against a lockfile, and add checksum verification for downloaded artifacts. ([release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))

```bash
TAG="v1.2.3"
curl -fsSLO "https://github.com/bobrapp/openclaw-installer/releases/download/${TAG}/openclaw-installer-${TAG}.tar.gz"
curl -fsSLO "https://github.com/bobrapp/openclaw-installer/releases/download/${TAG}/openclaw-installer-${TAG}.sha256"
sha256sum -c "openclaw-installer-${TAG}.sha256"
tar -xzf "openclaw-installer-${TAG}.tar.gz"
cd "openclaw-installer-${TAG}" && npm ci && npm run build
```

- TLS is not part of the default successful install path: both deployment scripts finish with an `http://` URL, and the installer tells users to run Certbot later. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))
- The Hetzner and Vultr workflows also validate readiness over plain HTTP to `/api/hosts`. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))

**Recommendation:** make TLS first-class by supporting a domain input, ACME provisioning, HSTS, and secure-by-default nginx headers. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))

### Medium

- `addAuditLog` reads the current tip hash and then inserts the next record outside an explicit transaction, so simultaneous requests can compute the same `previousHash` and create a forked chain. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts))

**Recommendation:** serialize audit writes with a transaction or a single-writer queue. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts))

```ts
addAuditLog(entry) {
  return sqlite.transaction(() => {
    const lastEntry = db.select().from(auditLogs).orderBy(desc(auditLogs.id)).get();
    const previousHash = lastEntry ? lastEntry.currentHash : "0";
    const payload = `${timestamp}|${entry.user}|${entry.prompt}|${entry.results}|${previousHash}`;
    return db.insert(auditLogs).values({ ...entry, timestamp, date, previousHash, currentHash: sha256(payload) }).returning().get();
  })();
}
```

- The PDF export path shells out with `execSync`, which is workable because the current arguments are internally generated, but `execFile` or `spawn` would reduce shell parsing risk and improve timeout/error control. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

- The server entrypoint does not show `helmet`, CORS policy, CSRF protections, or rate limiting middleware, so the default HTTP posture is weaker than it should be for an internet-facing installer UI. ([server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))

**Recommendation:** add `helmet`, explicit trusted origins, and rate limiting at minimum. ([server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts))

### Low

- The repository root in the local checkout contains SQLite database artifacts (`openclaw.db`, WAL, and SHM files), which is a repo hygiene and secret-handling smell even if those files are not committed intentionally. ([repository](https://github.com/bobrapp/openclaw-installer))

**Recommendation:** expand `.gitignore`, add a CI guard for DB artifacts, and document how state files are handled in dev vs production. ([repository](https://github.com/bobrapp/openclaw-installer), [CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md))

---

## 2) CI/CD & DevOps

### High

- The README says the CI pipeline runs Node.js checks, npm audit, TypeScript, build, lint, test, schema validation, and security scan, but `preflight.yml` actually performs dependency install, TypeScript check, build, and a series of `grep` heuristics. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))
- `package.json` also has no `test` or `lint` script, which reinforces that the documented coverage is ahead of the implemented coverage. ([package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

**Recommendation:** either narrow the README claim immediately or add the missing jobs now. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))

Suggested baseline matrix:

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npm run lint
      - run: npm run test -- --runInBand
      - run: npm audit --omit=dev --audit-level=high
      - run: npm run build
```

- The deployment workflows run automatically on every push to `master`, and the Hetzner job will rebuild an existing server while the Vultr job will reinstall an existing instance, so a merge can become a destructive infra action even if the change is minor. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

**Recommendation:** split “provision infra” from “deploy app,” require explicit manual dispatch for rebuild/reinstall, and reserve push-triggered deploys for in-place application rollout. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))

- The workflows and release automation pin actions by version tags like `@v4`, `@v5`, and `@v7`, but not by full commit SHA, which leaves some supply-chain exposure in CI itself. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

**Recommendation:** pin all third-party actions to immutable SHAs and enable Dependabot or Renovate for action updates. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

### Medium

- `deploy-validate.yml` validates syntax well enough for early-stage work, but it does not do integration checks like booting a disposable instance, validating nginx config end-to-end, or verifying the generated app responds after provisioning. ([deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml))

**Recommendation:** add an ephemeral smoke test job that boots a short-lived VM or container image and verifies `/health` or another real readiness endpoint. ([deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml), [deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml))

- The workflows post a fresh PR comment on every run via `createComment`, which will create noisy long-running PR threads. ([deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml), [deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))

**Recommendation:** update an existing bot comment instead of appending a new one each time. ([deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml))

- The release workflow deletes an existing release before recreating it, which is convenient for reruns but can disrupt asset URLs and downstream consumers. ([release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

**Recommendation:** prefer `gh release edit` or only replace missing assets on rerun. ([release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

### Low

- Branch naming is mixed across docs and workflows, with `master` as the assumed deployment branch even though `preflight.yml` also watches `main`. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

**Recommendation:** standardize on one default branch and centralize it as a reusable workflow input or org convention. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

---

## 3) Code quality

### High

- `server/routes.ts` is doing too much at once: CRUD APIs, audit auth, SSE streaming, PDF export, GitHub release aggregation, host metadata, shell-script generation, rollback-script generation, and preflight logic all live in a single file. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
- At roughly 1,180 lines, this file is already a maintenance hotspot and will get harder to test safely as more providers are added. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

**Recommendation:** split by concern.

Proposed structure:

```text
server/
  routes/
    logs.ts
    state.ts
    audit.ts
    releases.ts
    scripts.ts
  services/
    audit-service.ts
    release-service.ts
    preflight-service.ts
  installers/
    macos.ts
    digitalocean.ts
    azure.ts
    generic-vps.ts
```

- The preflight SSE endpoint claims live checks, but the implementation assigns statuses from a hard-coded weighted array and manufactures messages through `getCheckMessage`, so users are not seeing real host inspection results. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

**Recommendation:** either label it as a simulation in the UI/docs or wire it to a real command-execution backend with explicit host agents. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

- The generated install scripts use `eval` inside `run_or_dry`, which makes quoting fragile and complicates safe evolution of installer commands. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

**Recommendation:** use arrays or explicit command functions instead of string-evaluated shell snippets. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

### Medium

- `server/routes.ts` uses `any` in error and external API parsing paths, especially in `/api/releases`, which weakens the benefit of `strict: true` in `tsconfig.json`. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [tsconfig.json](https://github.com/bobrapp/openclaw-installer/blob/master/tsconfig.json))

**Recommendation:** define typed DTOs for GitHub releases and narrow unknown errors explicitly. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [tsconfig.json](https://github.com/bobrapp/openclaw-installer/blob/master/tsconfig.json))

- `server/routes.ts` parses SBOM counts and diffs by regexing the release body text, which is brittle and couples API behavior to markdown phrasing. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

**Recommendation:** publish structured SBOM metadata as a release asset or JSON manifest and read that directly. ([release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

- The package manifest includes `express-session`, `passport`, `passport-local`, and `memorystore`, but the reviewed backend path does not appear to use them, which increases install surface and cognitive load. ([package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json), [server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

**Recommendation:** remove unused packages until the auth/session layer actually needs them. ([package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))

- The generated host install scripts are inconsistent with the actual installer deployment path: script generation for macOS/Linux clones `https://github.com/openclaw/openclaw.git`, while `deploy/install.sh` and `deploy/cloud-init.yaml` clone `https://github.com/bobrapp/openclaw-installer.git`. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))

**Recommendation:** define one authoritative install source and surface it through shared config to avoid silent divergence. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))

### Low

- The build/deploy path depends on copying `public/aigovops-wizard.html` and `scripts/` into `dist/` manually in multiple places, which is a fragile packaging convention. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

**Recommendation:** move these into the build pipeline once and verify them in CI. ([package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json), [deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml))

---

## 4) Open-source maturity

### High

- The repo already has solid baseline project-health files: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODEOWNERS`, issue templates, PR template, release workflow, and funding config. ([repository](https://github.com/bobrapp/openclaw-installer), [LICENSE](https://github.com/bobrapp/openclaw-installer/blob/master/LICENSE), [SECURITY.md](https://github.com/bobrapp/openclaw-installer/blob/master/SECURITY.md), [CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [CODEOWNERS](https://github.com/bobrapp/openclaw-installer/blob/master/CODEOWNERS), [PULL_REQUEST_TEMPLATE.md](https://github.com/bobrapp/openclaw-installer/blob/master/.github/PULL_REQUEST_TEMPLATE.md), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))
- However, the README says the project license is MIT while the repository license file is Apache 2.0, which is a significant maturity issue because downstream users need a single unambiguous licensing answer. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [LICENSE](https://github.com/bobrapp/openclaw-installer/blob/master/LICENSE))

**Recommendation:** fix the README immediately and add a release gate that checks license text and badge consistency. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [LICENSE](https://github.com/bobrapp/openclaw-installer/blob/master/LICENSE))

- `CODEOWNERS` names only `@bobrapp`, which leaves the project with an obvious single-maintainer bottleneck despite the public framing around the AiGovOps Foundation and two named co-founders. ([CODEOWNERS](https://github.com/bobrapp/openclaw-installer/blob/master/CODEOWNERS), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

**Recommendation:** add at least one backup maintainer, define maintainer responsibilities, and publish a lightweight governance/decision-making doc. ([CODEOWNERS](https://github.com/bobrapp/openclaw-installer/blob/master/CODEOWNERS), [CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md))

### Medium

- The release workflow generates CycloneDX SBOM assets at release time, which is a strong sign, but there is no visible ongoing dependency-update automation or policy enforcement tied to those artifacts. ([release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

**Recommendation:** add Dependabot/Renovate plus a “high-severity vulnerability blocks release” rule. ([release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml), [SECURITY.md](https://github.com/bobrapp/openclaw-installer/blob/master/SECURITY.md))

- `CONTRIBUTING.md` is helpful, but it assumes several conventions that are not enforced locally by scripts, such as test expectations and `apiRequest` usage discipline. ([CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))

**Recommendation:** turn contributor guidance into tooling where possible with lint rules, test commands, and CI checks. ([CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

### Low

- The repository feels community-ready in tone, but it would benefit from a maintainer roadmap, “good first issue” labels, architectural decision records, and a public support policy. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [SECURITY.md](https://github.com/bobrapp/openclaw-installer/blob/master/SECURITY.md))

---

## 5) UX & accessibility

### High

- The new hosting page is content-rich, but it uses multiple 10-11px text treatments for price notes, deploy notes, buttons, and disclaimers, which is below a comfortable accessibility floor for many users. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

**Recommendation:** raise all UI text to at least 12-14px for secondary content and 16px for body copy. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

- The quick-comparison table is usable on desktop because it is horizontally scrollable, but there is no mobile-specific condensation strategy, so users on narrow screens still have to pan a dense comparison matrix. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

**Recommendation:** switch to stacked provider cards or a responsive “key facts only” table on mobile. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

### Medium

- `CopyButton` silently swallows clipboard failures and only changes local icon/text state, so screen-reader users do not get a robust success or failure announcement. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

**Recommendation:** add `aria-live="polite"`, visible fallback instructions, and an error toast on clipboard rejection. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

```tsx
<span aria-live="polite" className="sr-only">
  {copied ? "Copied to clipboard" : copyError ? "Copy failed" : ""}
</span>
```

- `CloudInitViewer` triggers `loadYaml()` during render when `yaml` is empty, which is a React anti-pattern and can create unpredictable re-render behavior. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

**Recommendation:** move that side effect into `useEffect` tied to the expanded state. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

- The page mixes educational content, affiliate/coupon content, direct deployment paths, and a bonus AI coding recommendation, which makes the information architecture feel more promotional than task-focused. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

**Recommendation:** separate “recommended hosting,” “deployment methods,” and “sponsor/affiliate disclosures” into clearer sections with explicit trust labels. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

### Low

- The page already uses semantic landmarks like `h1`, `table`, and `details/summary`, which is a good baseline. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))
- Dark-mode support is also clearly considered in several utility classes, but a dedicated accessibility pass for contrast and focus states would still be worthwhile. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx), [CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md))

---

## 6) Deployment & operations

### High

- `deploy/install.sh` and `deploy/cloud-init.yaml` install nginx, create a systemd service, and enable UFW, but neither path sets up automated backups for the SQLite database or deployment state. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts))
- The Vultr workflow explicitly creates instances with `backups: "disabled"`, which further weakens the recovery story. ([deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))

**Recommendation:** add provider backup toggles, scheduled SQLite snapshots, and a documented restore runbook. ([deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml), [server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

- The systemd service hardening is a good start with `ProtectSystem=strict`, `PrivateTmp=true`, and `NoNewPrivileges=true`, but it stops short of stronger isolation like `ProtectHome=true`, `PrivateDevices=true`, `CapabilityBoundingSet=`, `RestrictAddressFamilies=`, and `SystemCallFilter=` for the default app service. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))

**Recommendation:** ship a hardened systemd unit template with stricter defaults and a documented escape hatch for providers that need looser settings. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml))

- Health checking currently uses `/api/hosts`, which proves the server is alive but does not verify DB access, release metadata fetch health, audit subsystem health, or storage writeability. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml), [deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

**Recommendation:** add `/health` and `/ready` endpoints with dependency-level checks. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))

```ts
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get("/ready", (_req, res) => {
  db.select().from(installState).limit(1).all();
  res.json({ ok: true, db: "up" });
});
```

### Medium

- The update path in `deploy/install.sh` is effectively `git pull` followed by rebuild, which is simple but not reproducible and makes rollback to a known-good version harder than necessary. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))

**Recommendation:** add a versioned upgrade command that installs tagged releases and preserves a previous artifact for rollback. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

- Cloud-init and the installer both install Certbot packages, but neither path actually wires domain ownership, certificate issuance, renewal status checks, or nginx redirect hardening into the bootstrap flow. ([deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))

**Recommendation:** ask for domain/email upfront or provide a post-install wizard that blocks “production ready” status until TLS is complete. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))

### Low

- `render.yaml` is intentionally minimal, which is fine for first deployment, but the repo would benefit from an explicit note about ephemeral filesystem implications for SQLite on PaaS targets. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [deploy-validate.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-validate.yml))

---

## 7) Documentation

### High

- The README is broad and energetic, but it contains important inconsistencies: it says the frontend uses React 19 while `package.json` pins React 18.3.1, and it ends with `MIT` even though the repo license file is Apache 2.0. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json), [LICENSE](https://github.com/bobrapp/openclaw-installer/blob/master/LICENSE))

**Recommendation:** treat the README as a release artifact and add a docs consistency checklist to CI. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

- The README claims live preflight execution and an 8-check CI pipeline with lint/test/security scan language that is materially stronger than what the current backend and workflow implement. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

**Recommendation:** align docs with reality now, then improve reality and re-expand the claims later. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml))

### Medium

- The API endpoint list in the README is useful, but there is no OpenAPI spec, request/response schema documentation, or auth matrix for which endpoints are public vs protected. ([README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts))

**Recommendation:** generate an OpenAPI document from shared Zod/Drizzle schemas and publish it in the repo. ([shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

- `CONTRIBUTING.md` is solid for a human reader, but new contributors would benefit from a “first 15 minutes” path, sample environment setup, and a short architecture map of frontend/backend/data flow. ([CONTRIBUTING.md](https://github.com/bobrapp/openclaw-installer/blob/master/CONTRIBUTING.md), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

### Low

- Inline comments are generally decent in the deploy files and storage layer, but the backend would benefit more from module extraction than from adding more comments inside a thousand-line routes file. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts))

---

## Concrete file-by-file recommendations

### `server/routes.ts`

1. Add auth middleware to all mutating routes. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
2. Validate `req.body` and route params with Zod before passing data into storage. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts))
3. Split the file into focused modules. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
4. Replace simulated preflight with real execution or relabel it as a demo. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
5. Replace shell-based `execSync` PDF generation with `execFile` and a tighter temporary-file lifecycle. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))
6. Add `/health` and `/ready` endpoints. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts))

### `server/storage.ts`

1. Move passphrase hashing to Argon2id/scrypt. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts))
2. Wrap `addAuditLog` in a transaction or single-writer lock. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts))
3. Add schema-level constraints or helper methods for valid host targets and severity values. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [shared/schema.ts](https://github.com/bobrapp/openclaw-installer/blob/master/shared/schema.ts))
4. Consider append-only protections for install logs if “immutable” is part of the project promise. ([server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

### `client/src/pages/hosting-deals.tsx`

1. Move cloud-init loading side effects into `useEffect`. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))
2. Increase minimum text sizes and simplify the densest cards. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))
3. Add screen-reader feedback for copy actions and explicit failure handling. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))
4. Separate educational, affiliate, and deployment content more clearly. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))
5. Consider sourcing provider/pricing data from versioned JSON rather than embedding it directly in the component. ([client/src/pages/hosting-deals.tsx](https://github.com/bobrapp/openclaw-installer/blob/master/client/src/pages/hosting-deals.tsx))

### `.github/workflows/deploy-hetzner.yml`

1. Make rebuild an explicit manual action, not the default behavior when an existing server is found. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml))
2. Add smoke tests against `/ready` over HTTPS. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml))
3. Pin actions by SHA and add structured rollback/reporting. ([deploy-hetzner.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-hetzner.yml))

### `.github/workflows/deploy-vultr.yml`

1. Enable optional backups and document the cost tradeoff rather than hard-disabling them. ([deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))
2. Reuse or replace startup scripts idempotently to avoid config drift. ([deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))
3. Make reinstall explicit and separate from standard app deploy. ([deploy-vultr.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/deploy-vultr.yml))

### `deploy/install.sh`

1. Install from a tagged release artifact, not the default branch head. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))
2. Switch `npm install` to `npm ci`. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [package.json](https://github.com/bobrapp/openclaw-installer/blob/master/package.json))
3. Add real TLS bootstrapping and `/health` checks. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))
4. Harden systemd further and add backup/log retention guidance. ([deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh))

---

## Final assessment

OpenClaw Guided Install already looks more mature than many early open-source infra tools in governance intent, release hygiene, and deployment ambition. ([repository](https://github.com/bobrapp/openclaw-installer), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md), [release.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/release.yml))

What holds it back today is not vision but trustworthiness under real-world exposure: weak auth boundaries, mutable supply-chain execution, simulated preflight behavior, thin CI enforcement, and several docs/runtime mismatches. ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/storage.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/storage.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [deploy/cloud-init.yaml](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/cloud-init.yaml), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))

If the team fixes the top six issues in the high-impact list, the project will move from “impressive demo and governance showcase” to “credible, production-oriented open-source installer.” ([server/routes.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/routes.ts), [server/index.ts](https://github.com/bobrapp/openclaw-installer/blob/master/server/index.ts), [deploy/install.sh](https://github.com/bobrapp/openclaw-installer/blob/master/deploy/install.sh), [preflight.yml](https://github.com/bobrapp/openclaw-installer/blob/master/.github/workflows/preflight.yml), [README](https://github.com/bobrapp/openclaw-installer/blob/master/README.md))
