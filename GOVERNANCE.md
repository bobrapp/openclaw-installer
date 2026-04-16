# Governance — OpenClaw Guided Install

## AiGovOps Foundation

The OpenClaw Guided Install project is governed by the **AiGovOps Foundation**, co-founded by **Ken Johnston** and **Bob Rapp**. This document defines decision-making authority, contributor trust tiers, and the process for significant changes.

---

## Decision Authority

| Decision Type | Who Decides | Process |
|--------------|-------------|---------|
| License changes | Both co-founders | Written agreement required |
| Security policy changes | Both co-founders | 48-hour review period |
| Release publication | Either co-founder + CI pass | Tag → release workflow |
| Workflow/CI changes | CODEOWNERS (co-founder) | PR review + 48-hour cool-down |
| Architecture changes | Co-founder approval | RFC in Discussions → PR |
| New dependencies | Co-founder approval | Justification in PR description |
| Marketplace entries (official/verified) | Co-founder approval | Review + trust tier assignment |
| Bug fixes, docs, translations | Any Maintainer | Standard PR review |

---

## Contributor Trust Tiers

| Tier | Access | Requirements | Promotion Criteria |
|------|--------|-------------|-------------------|
| **Visitor** | Open issues, join Discussions | None | — |
| **Contributor** | Submit PRs | Signed CLA + DCO | — |
| **Trusted Contributor** | PRs bypass first-time CI approval | 5+ merged PRs, 90+ days active, 2FA verified | Nominated by Maintainer |
| **Maintainer** | Approve non-critical PRs, triage issues | Invitation by co-founders, hardware 2FA required | Demonstrated expertise + trust |
| **Owner** | Full admin, CODEOWNERS approval, releases | Co-founders only | — |

### Tier Rules

- **No direct pushes to master.** All changes go through PRs, even from co-founders (except emergency security patches, which must be documented post-hoc).
- **Cool-down period.** PRs modifying security-sensitive files (LICENSE, NOTICE, SECURITY.md, CODEOWNERS, `.github/workflows/`, `scripts/`, `server/`) cannot be merged for 48 hours after approval, giving the other co-founder time to review.
- **Minimum tenure.** New contributors must have at least 90 days of activity and 5+ merged PRs before being considered for Trusted Contributor status.
- **No urgency-based promotion.** Contributors are never granted elevated access based on urgency, pressure, or social proof. The "helpful new contributor who quickly submits many valuable PRs and then requests maintainer access" is a documented attack pattern.

---

## Significant Changes

A "significant change" requires both co-founders' approval:

- License modifications
- Security policy changes
- Architecture or data model changes
- New runtime dependencies
- CI/CD pipeline modifications
- CODEOWNERS or branch protection changes
- Marketplace trust tier upgrades
- Release workflow changes

### Process for Significant Changes

1. Open a Discussion (RFC) describing the change, motivation, and impact
2. Allow 7 days for community feedback
3. Submit PR with implementation
4. Both co-founders review and approve
5. 48-hour cool-down before merge

---

## Marketplace Governance

### Trust Tiers

| Tier | Badge | Meaning | How to Achieve |
|------|-------|---------|---------------|
| **Official** | 🛡️ Navy shield | Created or endorsed by AiGovOps Foundation | Foundation-authored entries only |
| **Verified** | ✓ Teal checkmark | Reviewed and tested by Foundation | Submit for review via PR; Foundation tests and approves |
| **Listed** | (none) | Community-submitted, not yet reviewed | Submit via Manage Entries form |

### Entry Lifecycle

1. **Submission** — Community members submit entries via the Manage Entries form or PR
2. **Review** — Foundation reviews for security, quality, and accuracy
3. **Listing** — Entry appears in marketplace with "listed" status
4. **Verification** — After testing and review, upgraded to "verified"
5. **Quarantine** — If issues are found, entry is quarantined pending resolution
6. **Removal** — Entries with unresolved security issues are removed

### Quarantine Policy

An entry may be quarantined if:
- A security vulnerability is reported
- The upstream source changes ownership
- The entry's external links become unresponsive for 30+ days
- Community reports of malicious behavior

Quarantined entries are hidden from the marketplace until resolved. The submitter is notified and given 14 days to address the issue.

---

## Emergency Procedures

### Security Freeze

Either co-founder can declare a security freeze, which:
- Blocks all PR merges (via branch protection update)
- Pauses all scheduled workflows
- Notifies the other co-founder immediately

A freeze is lifted only by agreement of both co-founders.

### Compromised Account Response

If a co-founder's account is suspected compromised:
1. The other co-founder immediately revokes all tokens and changes branch protection
2. GitHub support is contacted for account recovery
3. All recent commits are audited against known-good backups
4. A security advisory is published once the situation is resolved

### Succession Planning

Both co-founders maintain sealed, encrypted succession documents that include:
- GitHub organization recovery codes
- Domain registrar credentials
- Cloud deployment access
- Backup archive decryption keys

These documents are stored with a trusted third party (legal counsel) and updated annually.

---

## Removal and Rollback Authority

| Action | Who Can Do It | When |
|--------|--------------|------|
| Quarantine marketplace entry | Any Maintainer | Security report or broken links |
| Revert merged PR | Any Maintainer | Build breakage or security issue |
| Revoke release | Co-founder | Confirmed compromised artifacts |
| Suspend contributor | Co-founder | Code of Conduct violation or security concern |
| Emergency branch lock | Either co-founder | Suspected compromise |

---

## Amendments

This governance document may be amended by agreement of both co-founders, following the Significant Changes process. Community input is welcome via Discussions.

---

**AiGovOps Foundation** — © 2024–2026 Ken Johnston & Bob Rapp, Co-Founders
