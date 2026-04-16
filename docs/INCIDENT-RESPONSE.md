# Incident Response Runbook

## AiGovOps Foundation — OpenClaw Guided Install

**Classification:** INTERNAL — Do not share publicly.
**Last updated:** April 16, 2026
**Owners:** Ken Johnston, Bob Rapp (Co-Founders)

---

## General Principles

1. **Preserve evidence first.** Clone the current state before making changes.
2. **Communicate securely.** Use Signal or encrypted email for incident discussions. Never discuss active incidents in public channels.
3. **Document everything.** Every action taken during an incident must be logged with timestamp and actor.
4. **Two-person rule.** Critical remediation actions require both co-founders' confirmation when possible.

---

## Scenario 1: Compromised Maintainer Account

### Indicators
- Unexpected commits or PRs from a known account
- Branch protection rules modified without authorization
- New collaborators added without co-founder approval
- Unusual login activity (new IP, new device, new country)

### Response Steps

1. **IMMEDIATE (0–15 min)**
   - [ ] Revoke all sessions for the compromised account via GitHub org settings
   - [ ] Remove the account from the organization temporarily
   - [ ] Review and revert any commits made after the suspected compromise time
   - [ ] Check if any releases were published — if so, mark as compromised
   - [ ] Check if branch protection rules were modified
   - [ ] Check if CODEOWNERS was altered

2. **SHORT-TERM (15–60 min)**
   - [ ] Clone the current repo state: `git clone --mirror` for forensic analysis
   - [ ] Compare HEAD against the most recent nightly backup bundle
   - [ ] Check GitHub audit log: Settings → Audit log → filter by actor
   - [ ] Verify all critical files: LICENSE, NOTICE, SECURITY.md, CODEOWNERS, workflows
   - [ ] Rotate all tokens, deploy keys, and secrets associated with the compromised account

3. **RECOVERY (1–24 hours)**
   - [ ] Contact GitHub support for account recovery assistance
   - [ ] The compromised account holder must: reset password, rotate 2FA, review authorized apps
   - [ ] Publish a security advisory if any public-facing artifacts were affected
   - [ ] Restore any tampered files from the nightly backup
   - [ ] Re-enable branch protection rules from scratch (do not trust the current state)

4. **POST-INCIDENT**
   - [ ] Write a post-incident review within 72 hours
   - [ ] Update this runbook with lessons learned
   - [ ] Mandate hardware security key enrollment for the recovered account

---

## Scenario 2: Malicious Code Merged

### Indicators
- CI passes but unexpected behavior in production
- Community reports of suspicious behavior
- Nightly backup workflow detects critical file changes
- CodeQL alerts on merged code

### Response Steps

1. **IMMEDIATE**
   - [ ] Identify the malicious commit(s) via `git log --all --oneline`
   - [ ] Revert the commit(s): `git revert <sha>` — push immediately
   - [ ] If a release includes the malicious code, yank/retract the release
   - [ ] Declare a security freeze (see GOVERNANCE.md)

2. **INVESTIGATION**
   - [ ] Determine how the code passed review (social engineering? compromised reviewer?)
   - [ ] Check if the malicious code exfiltrated any data (secrets, PII, tokens)
   - [ ] Review the contributor's entire history for other subtle modifications
   - [ ] Check if the malicious code was deployed to GitHub Pages or any live site

3. **REMEDIATION**
   - [ ] Rotate all secrets that may have been exposed
   - [ ] Publish a security advisory with CVE if applicable
   - [ ] Remove the contributor's access
   - [ ] Deploy a clean build from verified source
   - [ ] Notify users if any data was potentially exposed

---

## Scenario 3: Supply Chain / Dependency Compromise

### Indicators
- Dependabot PR introduces a package with known issues
- npm audit reports critical vulnerability in a transitive dependency
- Socket.dev or similar tool flags suspicious package behavior
- Unexpected network calls from the application

### Response Steps

1. **IMMEDIATE**
   - [ ] Do NOT merge the Dependabot PR
   - [ ] Pin the last-known-good version of the affected package in package.json
   - [ ] Run `npm audit` and `npm ls <package>` to assess exposure
   - [ ] Check if the compromised version was included in any release

2. **ASSESSMENT**
   - [ ] Determine the nature of the compromise (data exfil, crypto mining, backdoor, etc.)
   - [ ] Check if the package was transferred to a new maintainer recently
   - [ ] Review the package's changelog and recent commits
   - [ ] Assess whether any production deployment used the compromised version

3. **REMEDIATION**
   - [ ] Replace the package with an alternative if the upstream is compromised
   - [ ] If the package is critical, fork it and vendor it locally
   - [ ] Update SBOM to reflect the change
   - [ ] Publish a notice to users if the compromised version was in a release

---

## Scenario 4: GitHub Token / Secret Leak

### Indicators
- GitHub secret scanning alerts
- Token found in public commit, log, or error message
- Unexpected API activity from the leaked token

### Response Steps

1. **IMMEDIATE (within minutes)**
   - [ ] Revoke the leaked token immediately via GitHub Settings → Developer Settings → PATs
   - [ ] If it's a GitHub Actions secret, rotate it in Settings → Secrets and variables
   - [ ] Check the token's permissions scope — what could an attacker have done?
   - [ ] Review recent API activity via GitHub audit log

2. **DAMAGE ASSESSMENT**
   - [ ] Was the token used? Check for unexpected commits, releases, or setting changes
   - [ ] Was the token included in any published artifact (release, npm package, Docker image)?
   - [ ] If the token was a deploy key, check deployment targets for unauthorized changes

3. **REMEDIATION**
   - [ ] Generate a new token with minimum required permissions
   - [ ] Update all workflows and services that used the old token
   - [ ] Add the leaked token to .gitignore patterns if it was in a file
   - [ ] Consider if `git filter-branch` is needed to remove the token from history

---

## Scenario 5: Domain / DNS Hijack

### Indicators
- aigovopsfoundation.org resolves to an unexpected IP
- SSL certificate errors when accessing the domain
- Users report phishing pages on the domain
- Domain registration transfer notifications

### Response Steps

1. **IMMEDIATE**
   - [ ] Contact the domain registrar (via phone, not email — email may be compromised)
   - [ ] Enable registrar lock if not already enabled
   - [ ] Check WHOIS records for unauthorized changes
   - [ ] If DNS was modified, document the malicious records

2. **MITIGATION**
   - [ ] Publish a notice on GitHub (the repo) warning users about the domain
   - [ ] If the domain serves any assets the installer fetches, disable those fetches
   - [ ] Contact Google Safe Browsing to flag the compromised domain if serving malware

3. **RECOVERY**
   - [ ] Work with registrar to restore DNS records
   - [ ] Enable DNSSEC if not already enabled
   - [ ] Add domain monitoring alerts
   - [ ] Rotate any credentials that used the domain (email accounts, etc.)

---

## Scenario 6: Unauthorized Commercial Use

### Indicators
- Discovery of a commercial product using OpenClaw branding
- Removal of Commons Clause from a fork
- Company selling services based substantially on OpenClaw code

### Response Steps

1. **EVIDENCE COLLECTION**
   - [ ] Screenshot and archive all evidence (web pages, marketing materials, code repos)
   - [ ] Use archive.org Wayback Machine to preserve snapshots
   - [ ] Document the specific license violations (which sections, what was removed/changed)

2. **INITIAL CONTACT**
   - [ ] Send a formal cease-and-desist letter (template in legal/templates/)
   - [ ] Include specific references to the LICENSE, NOTICE, and Commons Clause
   - [ ] Set a 14-day deadline for compliance
   - [ ] CC legal@aigovopsfoundation.org

3. **ESCALATION (if not resolved)**
   - [ ] File a DMCA takedown request with the hosting provider
   - [ ] If the violator is on GitHub, use GitHub's DMCA process
   - [ ] Engage IP counsel for formal legal action
   - [ ] Consider filing a trademark complaint if marks are being misused

---

## Communication Templates

### Security Advisory (GitHub)
```
Title: [SECURITY] <Brief description>
Severity: Critical / High / Medium / Low
Affected versions: v2.0.0 - v2.0.x
Fixed in: v2.0.y

Description:
<What happened, what was affected, what users should do>

Timeline:
- YYYY-MM-DD HH:MM UTC — Incident detected
- YYYY-MM-DD HH:MM UTC — Remediation started
- YYYY-MM-DD HH:MM UTC — Fix deployed
- YYYY-MM-DD HH:MM UTC — Advisory published

Recommended actions:
1. Update to version v2.0.y
2. Verify installation integrity: <instructions>
3. If you used version v2.0.x between <dates>, <specific guidance>
```

### User Notification Email
```
Subject: [AiGovOps Foundation] Security Notice — Action Required

Dear OpenClaw user,

We are writing to inform you of a security incident affecting...

What happened: <brief description>
What we've done: <remediation steps taken>
What you should do: <specific user actions>

If you have questions, contact security@aigovopsfoundation.org

— AiGovOps Foundation
  Ken Johnston & Bob Rapp, Co-Founders
```

---

## Contact List

| Role | Contact | Method |
|------|---------|--------|
| Co-Founder (Bob) | bob@aigovopsfoundation.org | Email + Signal |
| Co-Founder (Ken) | ken@aigovopsfoundation.org | Email + Signal |
| GitHub Support | https://support.github.com | Web portal |
| Domain Registrar | (document your registrar contact) | Phone preferred |
| Legal Counsel | legal@aigovopsfoundation.org | Email |

---

**Review this runbook quarterly. Test scenarios annually.**

© 2024–2026 AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders
