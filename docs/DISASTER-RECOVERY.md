# Disaster Recovery & Backup Guide

## AiGovOps Foundation — OpenClaw Guided Install

### Overview

This document outlines procedures for protecting against data loss, tampering, and hostile takeover of the repository.

---

## 1. Automated Backups

### Nightly Backup Workflow
The `.github/workflows/backup.yml` workflow runs daily at 4:00 AM UTC and:

1. **Verifies git object integrity** via `git fsck --full`
2. **Checks all critical files** exist (LICENSE, NOTICE, SECURITY.md, etc.)
3. **Generates an SBOM snapshot** (CycloneDX format)
4. **Creates a full git bundle** (complete repository history)
5. **Uploads as a GitHub Actions artifact** with 90-day retention

### Manual Backup
```bash
# Create a full bundle (all branches, tags, history)
git bundle create openclaw-backup-$(date +%Y%m%d).bundle --all

# Verify the bundle
git bundle verify openclaw-backup-$(date +%Y%m%d).bundle

# Generate checksum
sha256sum openclaw-backup-$(date +%Y%m%d).bundle > CHECKSUMS.txt
```

---

## 2. Setting Up a Mirror (Insurance Copy)

### Option A: GitHub Mirror (Different Account)
```bash
# Clone as bare repo
git clone --mirror https://github.com/bobrapp/openclaw-installer.git

# Push to mirror location
cd openclaw-installer.git
git remote add mirror https://github.com/<backup-account>/openclaw-installer-mirror.git
git push --mirror mirror

# Schedule periodic sync (crontab)
# 0 */6 * * * cd /path/to/openclaw-installer.git && git fetch origin && git push --mirror mirror
```

### Option B: Self-Hosted (Gitea/GitLab)
```bash
# On your Gitea/GitLab server
git clone --mirror https://github.com/bobrapp/openclaw-installer.git
# Configure as a mirror repository in the UI
```

### Option C: Local Archive
```bash
# Store encrypted backup
git bundle create openclaw-full.bundle --all
gpg --symmetric --cipher-algo AES256 openclaw-full.bundle
# Store openclaw-full.bundle.gpg in cloud storage (S3, GCS, etc.)
```

---

## 3. Restore Procedures

### From Git Bundle
```bash
# Restore from bundle
git clone openclaw-backup-20260416.bundle openclaw-installer-restored
cd openclaw-installer-restored
git remote set-url origin https://github.com/bobrapp/openclaw-installer.git
git fetch origin
```

### From GitHub Actions Artifact
1. Go to **Actions** → **Nightly Backup & Integrity Check**
2. Select the most recent successful run
3. Download the `nightly-backup-*` artifact
4. Extract the `.tar.gz` and use the `.bundle` file as above

### Full Repository Recovery
If the repository is deleted or compromised:
1. Create a new repository with the same name
2. Restore from the latest bundle
3. Re-enable branch protection rules (see SECURITY-SETUP.md)
4. Re-enable GitHub Actions workflows
5. Verify the LICENSE, NOTICE, and CODEOWNERS files are intact

---

## 4. Tamper Detection

### Audit Log Hash Chain
The application maintains a SHA-256 hash chain for all actions. If the chain is broken, tampering has occurred.

### Git Commit Signing
All official releases are signed. Verify with:
```bash
git tag -v v2.0.0
git log --show-signature -1
```

### Critical File Monitoring
The nightly backup workflow checks SHA-256 hashes of all critical files. If a hash changes without a corresponding commit, investigate immediately.

---

## 5. Incident Response

If you suspect the repository has been compromised:

1. **Do not push any changes** — preserve the evidence
2. **Download a copy** of the current state: `git clone --mirror`
3. **Check the git log** for unauthorized commits: `git log --all --oneline`
4. **Compare hashes** of critical files against known-good values
5. **Contact GitHub support** if unauthorized access is confirmed
6. **Restore from backup** if needed (see Section 3)
7. **Rotate all secrets** (owner passphrase, API keys, deploy tokens)
8. **Post an advisory** via GitHub Security Advisories

---

## 6. Contact

- **Security incidents:** security@aigovopsfoundation.org
- **General inquiries:** legal@aigovopsfoundation.org
- **Co-Founders:** Ken Johnston & Bob Rapp

---

**AiGovOps Foundation** — © 2024–2026
