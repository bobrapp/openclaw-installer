# Model Council Consensus Report — v2.0 "Larry's World"

**Date:** April 16, 2026
**Council Members:** Gemini 3.1 Pro, GPT-5.4, Claude Opus 4.6
**Subject:** Security Hardening Review for OpenClaw Guided Install v2.0

---

## Executive Summary

Three frontier AI models independently reviewed the v2.0 security hardening plan for the OpenClaw Guided Install project. All three models assessed the existing measures as a **solid foundation** that exceeds what most small open-source projects deploy, while identifying convergent gaps in six key areas. The council reached unanimous consensus on the top priority recommendations.

---

## Unanimous Consensus Points

All three council members independently identified and agreed on these critical findings:

### 1. Release Signing & Build Provenance (All 3 models — P0)
**Finding:** No cryptographic signing of releases, tags, or build artifacts. Users cannot verify that downloads are authentic.
**Recommendation:** Implement Sigstore/Cosign for artifact signing and SLSA provenance attestations. Sign all Git tags. Publish verification instructions.
**Status in v2.0:** Planned for post-release (within 30 days).

### 2. GitHub Actions Must Be Pinned to SHA (All 3 models — P0)
**Finding:** Tag-based action references are vulnerable to upstream compromise.
**Recommendation:** Pin every action to full commit SHA with version comment.
**Status in v2.0:** ✅ IMPLEMENTED — All 35 action references pinned to SHA digests.

### 3. Hardware Security Keys for Founders (All 3 models — P0)
**Finding:** TOTP-only 2FA is vulnerable to phishing. Founders are the highest-value targets.
**Recommendation:** Both founders must use FIDO2/WebAuthn hardware security keys (YubiKey) for GitHub, email, registrar, and cloud accounts.
**Status in v2.0:** Documented as mandatory requirement. Implementation is a personal action item for founders.

### 4. Marketplace Represents Major Unmanaged Risk (All 3 models — High)
**Finding:** 80 marketplace entries (agents, connectors, hosting, bundles) create a large attack surface with no automated vetting, signing, or sandboxing.
**Recommendation:** Implement tiered trust levels (listed → verified → official), signed manifests, re-validation schedules, and quarantine procedures.
**Status in v2.0:** Documented for v2.1 roadmap.

### 5. Shell Script Hardening (All 3 models — P0/P1)
**Finding:** Installer shell scripts that execute on user machines need strict static analysis and hardened execution contexts.
**Recommendation:** Add `shellcheck` to CI, enforce `set -euo pipefail`, minimize `sudo`, use absolute paths, validate all inputs.
**Status in v2.0:** Documented as P1 (30-day target).

### 6. License Consistency Must Be Airtight (All 3 models — P0)
**Finding:** Any inconsistency between LICENSE file, README, package.json, and NOTICE file undermines the entire commercial protection strategy.
**Recommendation:** Ensure identical license references across all artifacts. Use precise language: "source-available under Apache 2.0 with Commons Clause" rather than unqualified "open source."
**Status in v2.0:** ✅ IMPLEMENTED — LICENSE, NOTICE, README, package.json, and CONTRIBUTING.md all reference Apache 2.0 + Commons Clause consistently.

---

## Majority Consensus Points (2 of 3 models)

### 7. Tiered Contributor Trust Model (GPT-5.4, Opus)
Five tiers: Visitor → Contributor → Trusted Contributor → Maintainer → Owner, with explicit promotion criteria, 2FA requirements, and minimum tenure.

### 8. Dual-Approval for Critical Operations (GPT-5.4, Opus)
Two-person rule for releases, workflow changes, legal files, and security-sensitive code. Prevents single point of compromise.

### 9. Incident Response Runbook (Gemini, Opus)
Step-by-step procedures for: account takeover, malicious code merged, dependency compromise, token leak, DNS hijack. Store privately.

### 10. Trademark Registration (Gemini, Opus)
File trademark applications for "OpenClaw" and "AiGovOps" with USPTO. NOTICE-file assertions are necessary but insufficient for enforcement.

---

## Risk Matrix — Council Consensus

| Risk | Likelihood | Impact | Consensus Mitigation Status |
|------|-----------|--------|---------------------------|
| Founder account takeover → malicious merge/release/deletion | Medium-High | Critical | PARTIAL — Branch protection + CODEOWNERS in place; needs hardware 2FA + commit signing |
| Supply chain / dependency poisoning | Medium | High | GOOD — Dependabot, CodeQL, SHA-pinned actions, dependency review |
| Unauthorized commercial exploitation | High | High | GOOD — Commons Clause + NOTICE + trademark assertions; needs formal registration |
| CI/CD pipeline compromise → tampered artifacts | Low-Medium | Critical | GOOD — SHA-pinned actions; needs release signing + provenance |
| Malicious marketplace entry | High | High | GAP — No automated vetting or signing; planned for v2.1 |
| Shell injection via installer scripts | Medium | High | PARTIAL — Needs shellcheck in CI + hardened execution |
| Repository deletion/defacement | Low | Critical | GOOD — Nightly backups, DR docs, branch protection blocks force-push/delete |

---

## Implemented in v2.0 "Larry's World"

Based on council recommendations, the following measures were implemented:

### Legal & IP Protection
- ✅ Apache 2.0 + Commons Clause license (non-commercial open source)
- ✅ NOTICE file with copyright, trademark, and IP assertions
- ✅ Contributor License Agreement (CLA)
- ✅ Developer Certificate of Origin (DCO) requirement
- ✅ Consistent license references across all artifacts

### Repository Security
- ✅ Branch protection: require PR reviews, CI pass, CODEOWNERS review, block force-push/delete
- ✅ CODEOWNERS: founder review on all critical paths
- ✅ CodeQL: weekly + on-push security analysis
- ✅ Dependency review: blocks high-severity and GPL-3.0/AGPL-3.0 deps
- ✅ Secret scanning with push protection
- ✅ All GitHub Actions pinned to SHA digests
- ✅ PR template with security checklist and CLA sign-off

### Backup & Resilience
- ✅ Nightly backup workflow with git integrity verification
- ✅ Critical file SHA-256 monitoring
- ✅ SBOM snapshot generation
- ✅ 90-day artifact retention
- ✅ Disaster recovery documentation with restore procedures

### Application Security
- ✅ Content Security Policy (CSP) headers on standalone HTML files
- ✅ Existing: SHA-256 hash-chain audit log with tamper detection
- ✅ Existing: Owner passphrase authentication

---

## Post-Release Roadmap (Council Recommendations)

### Within 30 Days (P1)
- [ ] Implement Sigstore release signing
- [ ] Add `shellcheck` to CI pipeline
- [ ] Implement CSP via HTTP headers (helmet) on Express backend
- [ ] Document PAT lifecycle management and rotation schedule
- [ ] Add real-time critical file monitoring alerts

### Within 90 Days (P2)
- [ ] Marketplace trust tiers and signed manifests
- [ ] Formal trademark registration (USPTO)
- [ ] Reproducible builds documentation
- [ ] Incident response runbook (stored privately)
- [ ] Security advisory board formation
- [ ] Canary token deployment

---

**Council session concluded: April 16, 2026**
**Report prepared by: AiGovOps Foundation Model Council**
**Next review: v2.1 milestone or upon significant security event**

© 2024–2026 AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders
