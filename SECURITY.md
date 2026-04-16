# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The OpenClaw Guided Install team takes security seriously. If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email:** Send a detailed report to **security@aigovopsfoundation.org**
2. **Subject line:** `[SECURITY] openclaw-installer — <brief description>`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours of receipt
- **Triage & assessment:** Within 5 business days
- **Fix & disclosure:** We aim to release patches within 30 days for critical issues

### Scope

The following are in scope for security reports:

- Server-side vulnerabilities in the Express backend
- Authentication/authorization bypasses (owner passphrase, audit log access)
- Shell injection or command execution in generated scripts
- Supply-chain risks in dependencies (reference SBOM artifacts)
- Data exposure (PII, secrets, audit logs)
- Cross-site scripting (XSS) in the web UI

### Out of Scope

- Issues in third-party dependencies that are already publicly disclosed (check our SBOM)
- Social engineering attacks
- Denial of service attacks against demo/development instances
- Issues that require physical access to the server

### Recognition

We maintain a security acknowledgments section in our release notes for researchers who responsibly disclose vulnerabilities. If you would like to be credited, please include your preferred name/handle in your report.

## Security Best Practices

When deploying OpenClaw Guided Install:

1. **Set a strong owner passphrase** — minimum 12 characters recommended
2. **Run behind a reverse proxy** (nginx/Caddy) with TLS
3. **Restrict network access** — bind to localhost or use Tailscale
4. **Review generated scripts** before execution — use `--dry-run` first
5. **Keep dependencies updated** — monitor SBOM diffs in the Release Dashboard
6. **Enable audit logging** — the hash-chain audit log provides tamper detection
