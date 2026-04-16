# Reproducible Builds Guide

## AiGovOps Foundation — OpenClaw Guided Install

---

## Overview

Reproducible builds allow independent parties to verify that the published release artifacts were built from the claimed source code, using the documented build environment. This is a critical supply chain security measure.

---

## Build Environment Specification

| Component | Version | Source |
|-----------|---------|--------|
| Node.js | 20.x LTS | https://nodejs.org/ |
| npm | 10.x (bundled with Node.js) | Bundled |
| OS (CI) | Ubuntu 22.04 (ubuntu-latest) | GitHub Actions |
| TypeScript | See package.json `devDependencies` | npm |
| Vite | See package.json `devDependencies` | npm |

### Exact Versions

The exact versions are locked in `package-lock.json`. This file is the authoritative dependency manifest.

---

## Build Steps

To reproduce a release build:

```bash
# 1. Clone the exact release tag
git clone --branch v2.0.1 --depth 1 https://github.com/bobrapp/openclaw-installer.git
cd openclaw-installer

# 2. Verify the tag signature (when signed tags are implemented)
git tag -v v2.0.1

# 3. Install exact locked dependencies
npm ci  # MUST use 'npm ci', never 'npm install'

# 4. Build
npm run build

# 5. Prepare deployment artifacts (same as CI)
cp public/aigovops-wizard.html dist/public/
cp -r scripts dist/
mkdir -p dist/public/app
cp dist/public/index.html dist/public/app/index.html
cp -r dist/public/assets dist/public/app/
cp public/aigovops-framework.html dist/public/index.html
cp public/*.pdf dist/public/

# 6. Compare output hashes against published checksums
find dist/public -type f -exec sha256sum {} \; | sort > local-checksums.txt
# Compare with CHECKSUMS.txt from the GitHub release
```

---

## Verification

### Verify Release Checksums

Each GitHub Release includes a `CHECKSUMS-v<version>.txt` file containing SHA-256 hashes of all release artifacts. To verify:

```bash
# Download the checksums file from the release
curl -LO https://github.com/bobrapp/openclaw-installer/releases/download/v2.0.1/CHECKSUMS-v2.0.1.txt

# Verify against your local build
sha256sum -c CHECKSUMS-v2.0.1.txt
```

### Verify SBOM

Each release includes a CycloneDX SBOM (`sbom-v<version>.json`). To verify your local dependency tree matches:

```bash
# Generate local SBOM
npx @cyclonedx/cyclonedx-npm --output-file local-sbom.json

# Compare component lists
jq '.components[].name' local-sbom.json | sort > local-deps.txt
jq '.components[].name' sbom-v2.0.1.json | sort > release-deps.txt
diff local-deps.txt release-deps.txt
```

---

## Known Limitations

1. **Timestamps.** Build artifacts may contain timestamps (e.g., in generated HTML comments). These will differ between builds but do not affect functionality.
2. **Source maps.** Vite may generate slightly different source map references across builds. This does not affect the runtime code.
3. **Asset hashes.** Vite uses content-based hashing for asset filenames. If the input is identical, the output should be identical.

---

## CI Build Reproducibility

The CI pipeline ensures reproducibility through:

- `npm ci` — Uses exact locked versions from package-lock.json
- Pinned GitHub Actions (SHA digests) — Prevents action supply chain attacks
- Pinned Node.js version (20.x) — Consistent runtime
- Ubuntu-latest — While not pinned to an exact OS image, this is standard for GitHub Actions

### Future Improvements

- [ ] Pin ubuntu version explicitly (e.g., `ubuntu-22.04` instead of `ubuntu-latest`)
- [ ] Add Sigstore provenance attestations linking builds to source
- [ ] Publish build environment metadata with each release

---

© 2024–2026 AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders
