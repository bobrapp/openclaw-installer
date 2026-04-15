# OpenClaw Installer — API Reference

## Overview

OpenClaw Installer exposes a REST API served by an Express.js backend (default port `5000`). All endpoints return JSON unless otherwise noted. Shell-script endpoints return `text/plain` and the SSE preflight stream returns `text/event-stream`.

### Base URL

```
http://localhost:5000
```

### Authentication

Protected endpoints require the owner passphrase in an HTTP header:

```
x-owner-passphrase: <your-passphrase>
```

The passphrase is set once via `POST /api/owner/set-passphrase` and cannot be changed afterwards. Read-only endpoints listed below do **not** require authentication — they are intentionally public so the wizard UI can function without credentials.

See [Authentication](#authentication) for the full model.

---

## Endpoint Reference

### Authentication legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public — no authentication required |
| 🔒 | Owner auth required — send `x-owner-passphrase` header |
| ⏱ | Rate-limited — 5 requests per minute per IP |

---

## Health

### `GET /health` 🔓

Returns server health status. Useful for load-balancer health checks and uptime monitoring.

**Response**

```json
{
  "status": "ok",
  "uptime": 3612.4,
  "version": "1.0.0",
  "memory": {
    "rss": 45678592,
    "heapUsed": 22345678,
    "heapTotal": 31457280
  },
  "db": "connected",
  "timestamp": "2026-04-15T10:23:45.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"ok"` when healthy |
| `uptime` | number | Process uptime in seconds |
| `version` | string | App version from package.json |
| `memory` | object | Node.js `process.memoryUsage()` values (bytes) |
| `db` | string | Database connection status |
| `timestamp` | string | ISO 8601 current server time |

---

## Install Logs

### `GET /api/logs` 🔓

Returns install log entries, optionally filtered by host.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | No | Filter entries by host target (e.g. `macos`, `digitalocean`) |

**Example Request**

```
GET /api/logs?host=macos
```

**Response**

```json
[
  {
    "id": 1,
    "timestamp": "2026-04-15T10:00:00.000Z",
    "severity": "info",
    "step": "preflight",
    "message": "Node.js version check passed",
    "host": "macos"
  }
]
```

---

### `POST /api/logs` 🔒

Adds a new install log entry.

**Request Body**

```json
{
  "timestamp": "2026-04-15T10:00:00.000Z",
  "severity": "info",
  "step": "install",
  "message": "Homebrew dependencies installed successfully",
  "host": "macos"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | string | Yes | ISO 8601 timestamp |
| `severity` | string | Yes | One of `info`, `warn`, `error` |
| `step` | string | Yes | Wizard step name (e.g. `preflight`, `install`) |
| `message` | string | Yes | Human-readable log message |
| `host` | string | Yes | Host target identifier |

**Response** — `201 Created`

```json
{
  "id": 42,
  "timestamp": "2026-04-15T10:00:00.000Z",
  "severity": "info",
  "step": "install",
  "message": "Homebrew dependencies installed successfully",
  "host": "macos"
}
```

---

### `POST /api/logs/archive` 🔒

Archives (clears) all current install log entries. An audit trail entry is written before the logs are cleared, so the action is permanently recorded in the immutable audit chain.

**Request Body** — none required

**Response** — `200 OK`

```json
{
  "message": "Logs archived successfully",
  "archivedCount": 87
}
```

---

## Wizard State

### `GET /api/state` 🔓

Returns the current wizard installation state.

**Response**

```json
{
  "id": 1,
  "currentStep": 2,
  "hostTarget": "macos",
  "config": {
    "installDir": "/usr/local/openclaw",
    "dryRun": false
  },
  "completedSteps": [0, 1],
  "rollbackScript": null
}
```

---

### `PATCH /api/state/:id` 🔒

Partially updates wizard state. Unspecified fields are left unchanged.

**Path Parameters**

| Parameter | Description |
|-----------|-------------|
| `id` | State record ID (use `1` for the primary record) |

**Request Body** — any subset of wizard state fields

```json
{
  "currentStep": 3,
  "completedSteps": [0, 1, 2]
}
```

**Response** — `200 OK` — updated state object

---

### `POST /api/state/reset` 🔒

Resets wizard state to factory defaults. All progress and configuration is cleared.

**Request Body** — none required

**Response** — `200 OK`

```json
{
  "message": "State reset to defaults"
}
```

---

## Hardening Checks

### `GET /api/hardening/:hostTarget` 🔓

Returns the production hardening checklist for the specified host target.

**Path Parameters**

| Parameter | Description | Allowed values |
|-----------|-------------|----------------|
| `hostTarget` | Host environment | `macos`, `digitalocean`, `azure`, `generic-vps` |

**Example Request**

```
GET /api/hardening/digitalocean
```

**Response**

```json
[
  {
    "id": 5,
    "category": "network",
    "title": "UFW Firewall enabled",
    "description": "Ensure UFW is active and denies all inbound by default",
    "severity": "critical",
    "hostTarget": "digitalocean",
    "checked": false
  }
]
```

| Field | Description |
|-------|-------------|
| `category` | Grouping: `network`, `permissions`, `secrets`, `logging`, `observability` |
| `severity` | `critical`, `high`, `medium`, `low` |
| `checked` | Whether this item has been marked complete |

---

### `PATCH /api/hardening/toggle/:id` 🔒

Toggles the `checked` state of a hardening checklist item.

**Path Parameters**

| Parameter | Description |
|-----------|-------------|
| `id` | Hardening check record ID |

**Response** — `200 OK` — updated hardening check object

---

## Shell Scripts

All script endpoints return `text/plain` (a bash script). Scripts are generated dynamically based on the host target.

### `GET /api/scripts/preflight/:hostTarget` 🔓

Returns a bash script that performs preflight environment checks for the target host.

**Allowed `hostTarget` values:** `macos`, `digitalocean`, `azure`, `generic-vps`

**Example Request**

```
GET /api/scripts/preflight/macos
```

**Response** — `200 OK`, `Content-Type: text/plain`

```bash
#!/usr/bin/env bash
# OpenClaw Preflight Check — macos
# ...
```

---

### `GET /api/scripts/install/:hostTarget` 🔓

Returns a bash install script for the target host. The script supports a `DRY_RUN=true` environment variable for safe testing.

**Example Request**

```
GET /api/scripts/install/digitalocean
```

---

### `GET /api/scripts/rollback/:hostTarget` 🔓

Returns a bash rollback script to undo an installation for the target host.

**Example Request**

```
GET /api/scripts/rollback/azure
```

---

## Supported Hosts

### `GET /api/hosts` 🔓

Returns the list of supported host configurations with metadata.

**Response**

```json
[
  {
    "id": "macos",
    "name": "macOS (Local)",
    "description": "Local macOS development install",
    "icon": "apple"
  },
  {
    "id": "digitalocean",
    "name": "DigitalOcean",
    "description": "DigitalOcean Droplet (Ubuntu 22.04+)",
    "icon": "cloud"
  },
  {
    "id": "azure",
    "name": "Azure VM",
    "description": "Azure Virtual Machine (Ubuntu 22.04+)",
    "icon": "cloud"
  },
  {
    "id": "generic-vps",
    "name": "Generic VPS",
    "description": "Any Ubuntu 22.04+ VPS",
    "icon": "server"
  }
]
```

---

## Preflight Runner

### `GET /api/preflight/run/:hostTarget` 🔓

Opens a Server-Sent Events (SSE) stream that emits preflight check results in real time. Each check result is delivered as a `data:` event. The connection is closed by the server when all checks complete.

> **Note:** In the web preview environment, results are **simulated**. On a real host, the server executes the checks natively.

**Path Parameters**

| Parameter | Description | Allowed values |
|-----------|-------------|----------------|
| `hostTarget` | Host to run checks against | `macos`, `digitalocean`, `azure`, `generic-vps` |

**Response Headers**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event Format**

```
data: {"check":"node-version","status":"pass","message":"Node.js 20.11.0 found","duration":42}

data: {"check":"disk-space","status":"fail","message":"Only 2 GB free — 10 GB required","duration":15}

data: [DONE]
```

| Field | Description |
|-------|-------------|
| `check` | Check identifier |
| `status` | `pass`, `fail`, or `warn` |
| `message` | Human-readable result |
| `duration` | Check execution time in milliseconds |

Results are automatically appended to the install log and written to the immutable audit chain.

---

## Owner Authentication

### `GET /api/owner/has-passphrase` 🔓

Returns whether an owner passphrase has been set. Use this on first launch to determine whether to show the passphrase setup UI.

**Response**

```json
{
  "hasPassphrase": true
}
```

---

### `POST /api/owner/set-passphrase` 🔒*

Sets the owner passphrase. **This can only be called once.** Once set, the passphrase cannot be changed through the API — direct database access is required to reset it.

> *This endpoint requires no passphrase on first use (since none is set yet). After a passphrase is established, any further call is rejected.

**Request Body**

```json
{
  "passphrase": "your-strong-passphrase-here"
}
```

**Response** — `201 Created`

```json
{
  "message": "Passphrase set successfully"
}
```

**Error — passphrase already set** — `409 Conflict`

```json
{
  "error": "Passphrase already configured"
}
```

---

### `POST /api/owner/verify` ⏱

Verifies a candidate passphrase against the stored hash. Used by the UI to authenticate before performing owner-only actions.

**Rate limit:** 5 requests per minute per IP address. Exceeding the limit returns `429 Too Many Requests`.

**Request Body**

```json
{
  "passphrase": "your-strong-passphrase-here"
}
```

**Response — valid passphrase** — `200 OK`

```json
{
  "valid": true
}
```

**Response — invalid passphrase** — `200 OK`

```json
{
  "valid": false
}
```

**Response — rate limit exceeded** — `429 Too Many Requests`

```json
{
  "error": "Too many attempts. Try again in 60 seconds."
}
```

---

## Audit Log

All audit endpoints require the `x-owner-passphrase` header.

### `GET /api/audit/logs` 🔒

Returns all entries in the immutable SHA-256 audit hash chain.

**Response**

```json
[
  {
    "id": 1,
    "timestamp": "2026-04-15T09:00:00.000Z",
    "date": "2026-04-15",
    "user": "operator",
    "prompt": "Preflight run — macos",
    "results": "8/8 checks passed",
    "previousHash": "0",
    "currentHash": "a1b2c3d4e5f6..."
  },
  {
    "id": 2,
    "timestamp": "2026-04-15T09:05:12.000Z",
    "date": "2026-04-15",
    "user": "operator",
    "prompt": "Install — macos",
    "results": "Completed successfully",
    "previousHash": "a1b2c3d4e5f6...",
    "currentHash": "f6e5d4c3b2a1..."
  }
]
```

| Field | Description |
|-------|-------------|
| `previousHash` | SHA-256 hash of the preceding entry (`"0"` for the genesis entry) |
| `currentHash` | SHA-256 of `timestamp \| user \| prompt \| results \| previousHash` |

---

### `GET /api/audit/verify` 🔒

Verifies the integrity of the entire audit hash chain. Recomputes every hash and confirms each entry's `previousHash` matches the prior entry's `currentHash`.

**Response — chain intact**

```json
{
  "valid": true,
  "entries": 42,
  "message": "Hash chain verified successfully"
}
```

**Response — chain tampered**

```json
{
  "valid": false,
  "entries": 42,
  "firstBrokenAt": 17,
  "message": "Chain integrity failure detected at entry 17"
}
```

---

### `GET /api/audit/export-pdf` 🔒

Exports the full audit log as a branded PDF compliance artifact. The PDF includes the complete SHA-256 hash chain table, AiGovOps Foundation branding, a QR code linking to [aigovopsfoundation.org](https://www.aigovopsfoundation.org/), and digital signature metadata.

**Response** — `200 OK`

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="openclaw-audit-report.pdf"
```

---

## Wizard HTML

### `GET /api/wizard-html` 🔓

Returns the standalone 7-step installer wizard as a self-contained HTML file. No server calls, cookies, or localStorage — all state lives in browser memory. Can be saved and run offline.

**Response** — `200 OK`, `Content-Type: text/html`

---

## Releases

### `GET /api/releases` 🔓

Fetches release data, SBOM (Software Bill of Materials) diffs, and governance health metrics from GitHub.

**Response**

```json
{
  "releases": [...],
  "sbomDiff": {...},
  "governanceHealth": {...}
}
```

---

## Error Responses

All error responses use a consistent envelope:

```json
{
  "error": "Human-readable error message"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| `400 Bad Request` | Missing or invalid request body / parameters |
| `401 Unauthorized` | Missing or incorrect `x-owner-passphrase` header |
| `404 Not Found` | Resource or endpoint not found |
| `409 Conflict` | Action not allowed in current state (e.g. passphrase already set) |
| `429 Too Many Requests` | Rate limit exceeded on `POST /api/owner/verify` |
| `500 Internal Server Error` | Unexpected server-side error |

---

## Authentication

OpenClaw Installer uses a **single-owner passphrase** model. There are no user accounts or session tokens — one passphrase controls all write access.

### Setting the passphrase (first run)

On first launch, no passphrase is set. Call `POST /api/owner/set-passphrase` with your chosen passphrase. This stores a SHA-256 hash of the passphrase in the `owner_auth` table. The raw passphrase is never persisted.

```bash
curl -X POST http://localhost:5000/api/owner/set-passphrase \
  -H "Content-Type: application/json" \
  -d '{"passphrase": "your-strong-passphrase"}'
```

### Using the passphrase

Include the passphrase in the `x-owner-passphrase` header on every protected request:

```bash
curl http://localhost:5000/api/audit/logs \
  -H "x-owner-passphrase: your-strong-passphrase"
```

### What is protected

All mutating endpoints (POST, PATCH) and sensitive read endpoints (audit logs, PDF export) require owner auth. Read-only endpoints used by the wizard UI are intentionally public.

### Rate limiting

`POST /api/owner/verify` is limited to **5 attempts per minute per IP**. Brute-force attempts will be blocked with a `429` response.

### Resetting a forgotten passphrase

There is no API route to reset the passphrase. If you lose it, you must directly delete the row from the `owner_auth` table in the SQLite database:

```bash
sqlite3 /path/to/openclaw.db "DELETE FROM owner_auth;"
```

After deletion, `GET /api/owner/has-passphrase` will return `false` and you can set a new passphrase via the API.

### Production hardening recommendations

- Place the server behind a **reverse proxy** (nginx, Caddy) that enforces HTTPS and, optionally, adds HTTP Basic Auth as a second layer.
- Restrict access via **VPN-only** (e.g. Tailscale) so the app is never publicly reachable.
- Use **certbot** (Let's Encrypt) to provision TLS certificates for your domain.
- Bind the Express server to `127.0.0.1` and let the reverse proxy handle external traffic.
