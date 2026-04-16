# Contributing to OpenClaw Guided Install

Welcome, and thank you for your interest in contributing to **OpenClaw Guided Install by AiGovOps**. This project is maintained by the [AiGovOps Foundation](https://www.aigovopsfoundation.org/) and reflects our commitment to transparent, community-driven governance tooling for AI systems.

Whether you're fixing a bug, adding a language translation, improving documentation, or proposing a new host target — every contribution matters and is reviewed with care.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Report Bugs](#how-to-report-bugs)
3. [How to Suggest Features](#how-to-suggest-features)
4. [Development Setup](#development-setup)
5. [Pull Request Process](#pull-request-process)
6. [Contributor Trust Tiers](#contributor-trust-tiers)
7. [CLA Requirement](#cla-requirement)
8. [Coding Standards](#coding-standards)
9. [Testing Requirements](#testing-requirements)
10. [Shell Script Standards](#shell-script-standards)
11. [Internationalization (i18n) Guidelines](#internationalization-i18n-guidelines)
12. [License](#license)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it. Violations can be reported to [conduct@aigovopsfoundation.org](mailto:conduct@aigovopsfoundation.org).

---

## How to Report Bugs

1. **Search first.** Check [existing issues](https://github.com/bobrapp/openclaw-installer/issues) to see if the bug has already been reported.
2. **Use the bug report template.** Open a new issue and select **Bug Report** from the template list. Fill in all fields — especially the host target, browser, OS, and Node.js version.
3. **Be specific.** Include steps to reproduce, expected behavior, actual behavior, and any relevant log output or screenshots.
4. **Assign severity.** Use the severity field in the template: `critical`, `high`, `medium`, or `low`.

> For security vulnerabilities, do **not** open a public issue. See the [Security Policy](#security-policy) section below or use the **Security Vulnerability** issue template.

---

## How to Suggest Features

1. **Check Discussions first.** Browse [GitHub Discussions](https://github.com/bobrapp/openclaw-installer/discussions) to see if your idea has been raised.
2. **Open a Feature Request issue.** Use the **Feature Request** template. Include a problem statement, proposed solution, and any alternatives you've considered.
3. **For significant architectural changes,** open a Discussion (RFC) first to gather community input before writing code. See [GOVERNANCE.md](GOVERNANCE.md) for the RFC process.

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm (or pnpm)
- Git

### Steps

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/openclaw-installer.git
cd openclaw-installer

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app starts at `http://localhost:5000`.

### Other useful commands

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run check` | TypeScript type check |
| `npm run lint` | ESLint |
| `npx vitest run` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `NODE_ENV=production node dist/index.cjs` | Run production build locally |

---

## Pull Request Process

1. **Fork** the repository and create a branch from `master`.
   ```bash
   git checkout -b fix/my-bug-description
   ```
2. **Make your changes.** Keep commits focused and atomic. Use descriptive commit messages.
3. **Sign off each commit** with a Developer Certificate of Origin (DCO):
   ```bash
   git commit -s -m "fix: correct preflight check for Ubuntu 24.04"
   ```
4. **Run tests and lint** before pushing (see [Testing Requirements](#testing-requirements)).
5. **Open a Pull Request** against `master`. Fill out the PR template completely, including the CLA acknowledgment.
6. **Address review feedback.** A maintainer or co-founder will review your PR. Security-sensitive paths require co-founder approval and a 48-hour cool-down before merge (see [GOVERNANCE.md](GOVERNANCE.md)).
7. **Squash if requested.** We may ask you to squash commits before merge to keep history clean.

### Branch naming conventions

| Type | Pattern | Example |
|------|---------|---------|
| Bug fix | `fix/<short-description>` | `fix/docker-port-mapping` |
| Feature | `feat/<short-description>` | `feat/railway-host-target` |
| Documentation | `docs/<short-description>` | `docs/update-setup-guide` |
| i18n | `i18n/<locale-code>` | `i18n/de-translation` |
| Chore | `chore/<short-description>` | `chore/bump-vite-version` |

---

## Contributor Trust Tiers

OpenClaw uses a 5-tier trust model defined in [GOVERNANCE.md](GOVERNANCE.md):

| Tier | Description |
|------|-------------|
| **Visitor** | Can open issues and join Discussions |
| **Contributor** | Can submit PRs after signing the CLA + DCO |
| **Trusted Contributor** | PRs bypass first-time CI hold; requires 5+ merged PRs, 90+ days active, 2FA verified |
| **Maintainer** | Can approve non-critical PRs and triage issues; invitation by co-founders only |
| **Owner** | Co-founders only; full admin and release authority |

Promotion to Trusted Contributor is nominated by a Maintainer. There are no shortcuts — "urgent need" is never a basis for elevated access. This is a deliberate security posture.

---

## CLA Requirement

All contributors must agree to the [Contributor License Agreement](.github/CLA.md) before a PR can be merged. The CLA grants the AiGovOps Foundation broad licensing rights over your contribution while you retain copyright ownership.

To sign, include the following line in your PR description or the relevant commit message:

```
I have read the CLA and agree to its terms.
Signed-off-by: Your Name <your-email@example.com>
```

Questions about the CLA: [legal@aigovopsfoundation.org](mailto:legal@aigovopsfoundation.org)

---

## Coding Standards

### TypeScript

- All new code must be written in TypeScript. No plain `.js` files in `client/` or `server/`.
- Avoid `any` — use proper types or `unknown`.
- Export types and interfaces from dedicated files where reuse is anticipated.

### ESLint

The project uses ESLint with TypeScript rules. Run `npm run lint` before submitting. PRs that introduce new lint warnings will be asked to resolve them.

### Zod Validation

- All API inputs **must** be validated with [Zod](https://zod.dev/) schemas.
- Schemas live in `shared/schema.ts` or inline with the route.
- Use `.strict()` on object schemas where the shape is fully known.
- Apply length bounds and enum constraints — do not accept unbounded strings from user input.

### General style

- Use named exports (not default exports) for components and utilities.
- Keep components under 300 lines; split larger components into smaller composable units.
- Follow the existing file naming convention: `kebab-case` for files, `PascalCase` for React components.
- No hardcoded secrets, credentials, PII, or environment-specific values in source code.

---

## Testing Requirements

All PRs must pass the full test suite before merge. Run this locally before submitting:

```bash
npx vitest run
```

For PRs touching installation flows, E2E tests are also required:

```bash
npm run test:e2e
```

The CI pipeline runs both automatically. A PR that breaks existing tests will not be merged without explanation.

When adding new features, add corresponding tests. The project targets meaningful coverage on business logic — not line coverage for its own sake.

---

## Shell Script Standards

Scripts in `scripts/` and `deploy/` must be clean under [ShellCheck](https://www.shellcheck.net/). This is enforced in CI.

Run locally:

```bash
shellcheck scripts/*.sh deploy/*.sh
```

Guidelines:
- Use `#!/usr/bin/env bash` (not `/bin/sh` unless POSIX compliance is explicitly needed).
- Quote all variable expansions: `"$VAR"`, `"${VAR}"`.
- Use `set -euo pipefail` at the top of every script.
- Prefer `[[ ... ]]` over `[ ... ]` for conditionals.
- Add a comment block at the top of every script explaining its purpose, usage, and required environment variables.

---

## Internationalization (i18n) Guidelines

OpenClaw supports 15 languages. Adding or updating translations is one of the most impactful contributions you can make.

### Adding a new translation

1. Locate the translations file (typically under `client/src/lib/i18n/` or the equivalent locale directory).
2. Copy an existing locale file as a starting point.
3. Translate all string values. Do **not** translate keys.
4. For RTL languages (Arabic, Urdu, Pashto), verify the layout renders correctly by testing with the RTL locale active.
5. Add the locale code and display name to the language selector list.
6. Submit a PR with the branch prefix `i18n/<locale-code>`.

### Updating an existing translation

1. Find the strings that need updating in the relevant locale file.
2. If you're correcting a translation error, note the original text and the corrected version in the PR description.
3. Do not change source strings in the English (base) locale without a corresponding issue — source string changes can break all other locales.

### Special considerations

- **Braille display mode** is a special accessibility locale — treat changes to it with extra care.
- **Cherokee** uses the Syllabary script — use a verified Cherokee language source when making changes.
- When in doubt, open a Discussion to get community input before committing a translation.

---

## Security Policy

For non-critical security issues, use the **Security Vulnerability** issue template.

For critical vulnerabilities (remote code execution, authentication bypass, credential exposure), please email **[security@aigovopsfoundation.org](mailto:security@aigovopsfoundation.org)** directly rather than opening a public issue. We aim to respond within 48 hours.

---

## License

This project is licensed under the **Apache License 2.0 with Commons Clause** — free for non-commercial use. Commercial use requires written permission from the AiGovOps Foundation.

See [LICENSE](LICENSE) for the full text. For commercial licensing inquiries: [legal@aigovopsfoundation.org](mailto:legal@aigovopsfoundation.org).

By contributing to this project, you agree that your contributions will be licensed under the same terms and subject to the [Contributor License Agreement](.github/CLA.md).

---

**AiGovOps Foundation** — [www.aigovopsfoundation.org](https://www.aigovopsfoundation.org/)
© 2024–2026 Ken Johnston & Bob Rapp, Co-Founders
