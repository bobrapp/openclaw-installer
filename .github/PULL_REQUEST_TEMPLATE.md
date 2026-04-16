## Description

Briefly describe what this PR changes and why. Link to the relevant issue if one exists.

Fixes #<!-- issue number, or delete this line if not applicable -->

---

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Documentation update
- [ ] i18n / translation update
- [ ] CI/CD improvement
- [ ] Dependency update
- [ ] Refactor / chore (no functional change)

---

## Changes Made

- 
- 
- 

---

## Testing

Describe how you tested these changes.

- [ ] `npx vitest run` passes — all unit tests green
- [ ] `npm run test:e2e` passes (required for wizard/install flow changes)
- [ ] `npm run lint` passes — no new ESLint warnings
- [ ] `npm run check` passes — TypeScript compiles without errors
- [ ] `npm run build` succeeds — production bundle builds cleanly
- [ ] Shell scripts checked with `shellcheck` (if any `.sh` files modified)
- [ ] Manually tested in both light and dark mode (for UI changes)
- [ ] Tested against affected host targets (list them): _______________

---

## Checklist

- [ ] Code follows the project's TypeScript and ESLint standards (see [CONTRIBUTING.md](../CONTRIBUTING.md))
- [ ] New API inputs are validated with Zod schemas
- [ ] No PII, secrets, credentials, or hardcoded environment values are included
- [ ] Documentation updated (README, relevant `docs/` files, or inline comments) if needed
- [ ] `CHANGELOG.md` updated with a summary of this change under the appropriate version heading
- [ ] New dependencies are justified — supply-chain impact noted below

---

## Supply-Chain Impact

Does this PR add, remove, or update dependencies?

- [ ] No dependency changes
- [ ] Added: `<package>` — Reason: _______________
- [ ] Removed: `<package>`
- [ ] Updated: `<package>` from vX to vY — Reason: _______________

---

## Screenshots (if applicable)

| Before | After |
|--------|-------|
|        |       |

---

## CLA & DCO

- [ ] I have read the [Contributor License Agreement](CLA.md) and agree to its terms.
- [ ] All commits in this PR include a `Signed-off-by` line (Developer Certificate of Origin).

```
I have read the CLA and agree to its terms.
Signed-off-by: Your Name <your-email@example.com>
```

---

> **Security-sensitive paths** (LICENSE, SECURITY.md, CODEOWNERS, `.github/workflows/`, `scripts/`, `server/`) require co-founder approval and a 48-hour cool-down before merge. See [GOVERNANCE.md](../GOVERNANCE.md).
