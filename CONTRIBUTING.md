# Contributing to OpenClaw Guided Install

Thank you for your interest in contributing to the OpenClaw Guided Install. This project is maintained by the [AiGovOps Foundation](https://www.aigovopsfoundation.org/) and welcomes contributions from the community.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/<your-username>/openclaw-installer.git`
3. **Install dependencies:** `npm install`
4. **Start the dev server:** `npm run dev`
5. **Create a branch:** `git checkout -b feat/my-feature`

## Development Setup

- **Node.js** 20+ required
- **Python 3** required for PDF generation and SBOM diff scripts
- **SQLite** (bundled via `better-sqlite3`)

```bash
npm install          # Install dependencies
npm run dev          # Start Express + Vite dev server on port 5000
npm run build        # Production build
npm run check        # TypeScript type check
```

## Project Structure

```
client/src/         — React frontend (pages, components, hooks)
server/             — Express backend (routes, storage, middleware)
shared/             — Shared types and schemas (Drizzle + Zod)
scripts/            — Python scripts (PDF generator, SBOM diff)
public/             — Static assets (standalone wizard HTML)
.github/workflows/  — CI/CD pipelines (preflight, release, deploy)
```

## Making Changes

### Code Style

- TypeScript throughout — no `any` unless interfacing with external APIs
- Use `shadcn/ui` components for UI consistency
- Follow existing patterns for new API routes (thin route → storage interface)
- React Query (`@tanstack/react-query`) for all data fetching
- Use `apiRequest` from `@/lib/queryClient` — never raw `fetch()`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new host target support
fix: correct SBOM diff parsing for empty releases
docs: update deployment instructions
ci: add SBOM validation step to release workflow
```

### Pull Requests

1. Ensure your branch is up to date with `master`
2. Run `npm run check` to verify types
3. Run `npm run build` to verify the build succeeds
4. Fill out the PR template completely
5. Link any related issues

### What We Look For

- **Tests pass** — CI must be green
- **No PII or secrets** — never commit credentials, tokens, or personal data
- **SBOM awareness** — new dependencies increase supply-chain surface; justify additions
- **Accessibility** — semantic HTML, keyboard navigation, ARIA labels
- **Dark mode** — all UI changes must work in both light and dark themes

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) when filing issues. Include:

- Steps to reproduce
- Expected vs. actual behavior
- Browser/OS version
- Screenshots if applicable

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md). Describe the problem you're trying to solve, not just the solution you want.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
