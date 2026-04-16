# Distribution Guide

How to install OpenClaw Guided Install through various package managers.

## npm (Global Install)

```bash
# Install globally
npm install -g openclaw-installer

# Run the installer
openclaw start

# Or run without installing
npx openclaw-installer
```

## Homebrew (macOS / Linux)

```bash
# Add the tap
brew tap bobrapp/openclaw

# Install
brew install openclaw

# Run
openclaw start
```

## Docker

See [DOCKER.md](DOCKER.md) for full Docker instructions.

```bash
docker compose up -d
open http://localhost:5000
```

## From Source

```bash
git clone https://github.com/bobrapp/openclaw-installer.git
cd openclaw-installer
npm install
npm run build
npm start
```

## CLI Commands

```
openclaw start              # Start the web UI (default)
openclaw start --port 3000  # Custom port
openclaw preflight          # Run preflight checks
openclaw validate           # Run E2E validation suite
openclaw canary-init        # Initialize canary baseline
openclaw canary-verify      # Verify file integrity
openclaw version            # Show version
openclaw help               # Show help
```

## Environment Variables

| Variable           | Default     | Description                    |
| ------------------ | ----------- | ------------------------------ |
| `PORT`             | `5000`      | Server port                    |
| `HOST`             | `127.0.0.1` | Bind address                   |
| `NODE_ENV`         | `production` | Environment                   |
| `OWNER_PASSPHRASE` | —           | Owner passphrase for secure endpoints |

## Publishing to npm

> Requires npm account with publish access.

```bash
# Login
npm login

# Dry run (verify package contents)
npm pack --dry-run

# Publish
npm publish
```

## Publishing Homebrew Formula

1. Create a tap repo: `https://github.com/bobrapp/homebrew-openclaw`
2. Copy `Formula/openclaw.rb` into the tap repo
3. Update the `sha256` hash after each release:
   ```bash
   curl -sL https://github.com/bobrapp/openclaw-installer/archive/refs/tags/v2.2.0.tar.gz | shasum -a 256
   ```
4. Commit and push the formula

---

© AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders
