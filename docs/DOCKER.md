# Docker Deployment Guide

**OpenClaw Guided Install** — AiGovOps Foundation  
License: Apache-2.0 WITH Commons-Clause

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+ with BuildKit enabled
- [Docker Compose](https://docs.docker.com/compose/install/) v2.20+ (ships with Docker Desktop)
- At least 512 MB free memory on the host

---

## Quick Start

### 1. Build and run

```bash
# Clone the repo (if you haven't already)
git clone https://github.com/bobrapp/openclaw-installer.git
cd openclaw-installer

# Create a data directory for SQLite persistence
mkdir -p data

# Set your owner passphrase (required before first use)
export OWNER_PASSPHRASE="your-strong-passphrase-here"

# Build the image and start the container
docker compose up -d --build

# Confirm it's healthy
docker compose ps
docker compose logs -f openclaw-installer
```

Open **http://localhost:5000** in your browser.

### 2. Stop / remove

```bash
docker compose down          # stop containers, keep volumes
docker compose down -v       # also remove named volumes (destroys DB!)
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` | Runtime mode. Do not change for production. |
| `PORT` | `5000` | Port the server listens on inside the container. |
| `HOST` | `0.0.0.0` | Bind address inside the container. Required for port mapping. |
| `OWNER_PASSPHRASE` | *(unset)* | Owner authentication passphrase. Set before first run. |

### Using a `.env` file

Create a `.env` file next to `docker-compose.yml` (it is gitignored):

```env
OWNER_PASSPHRASE=your-strong-passphrase-here
```

Docker Compose automatically picks it up. Never commit `.env` to version control.

---

## Persistent Data (SQLite)

The SQLite database (`openclaw.db`) is stored in `/data` inside the container and mounted from `./data` on the host:

```
./data/openclaw.db   ←→   /data/openclaw.db  (inside container)
```

The entrypoint script creates a symlink `/app/openclaw.db → /data/openclaw.db` so the application finds the database at the path it expects (`process.cwd()/openclaw.db`).

### Backup

```bash
# Safe online backup via SQLite's backup API
docker exec openclaw-installer \
  sqlite3 /data/openclaw.db ".backup /data/openclaw-backup-$(date +%Y%m%d).db"

# Or simply copy the file while the container is stopped
docker compose stop
cp data/openclaw.db data/openclaw-$(date +%Y%m%d).db
docker compose start
```

### Restore

```bash
docker compose stop
cp data/openclaw-backup-20250101.db data/openclaw.db
docker compose start
```

---

## Development Mode

The dev override mounts source directories so the server hot-reloads on file changes via `tsx`, and exposes the Node.js debugger on port 9229.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Attach a debugger

- **VS Code**: Add a launch config with `"type": "node"`, `"request": "attach"`, `"port": 9229`, `"address": "localhost"`.
- **Chrome DevTools**: Open `chrome://inspect` and click *Open dedicated DevTools for Node*.

---

## Production Deployment Tips

### Reverse proxy (nginx / Caddy)

For TLS termination, place a reverse proxy in front of the container. Example nginx snippet:

```nginx
server {
    listen 443 ssl;
    server_name openclaw.example.com;

    ssl_certificate     /etc/letsencrypt/live/openclaw.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/openclaw.example.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### Firewall

The container only needs port 5000 reachable from your reverse proxy. If the proxy runs on the same host, you can bind only to localhost:

```yaml
# docker-compose.yml — restrict external access
ports:
  - "127.0.0.1:5000:5000"
```

### Secrets management

Prefer Docker secrets or a secrets manager over plain environment variables in production:

```bash
echo "your-passphrase" | docker secret create owner_passphrase -
```

Then reference it via `secrets:` in `docker-compose.yml` and read from `/run/secrets/owner_passphrase` in an entrypoint script.

### Log rotation

The compose file configures `json-file` logging with 10 MB × 3 file rotation. For centralised logging, change the driver:

```yaml
logging:
  driver: "loki"
  options:
    loki-url: "http://loki:3100/loki/api/v1/push"
```

---

## Multi-Architecture Build (amd64 + arm64)

Use Docker Buildx to produce a multi-platform image (e.g. for Raspberry Pi or Apple Silicon servers):

```bash
# One-time: create a multi-arch builder
docker buildx create --use --name multiarch

# Build and push to a registry
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/your-org/openclaw-installer:latest \
  --push \
  .
```

> **Note on `better-sqlite3`**: This native module is compiled during `npm ci` in the builder stage. Buildx emulates the target architecture during build, so the native bindings will be correct for each platform. Builds for `linux/arm64` may take several minutes on an amd64 host due to QEMU emulation.

### Pre-built image workflow (CI)

```yaml
# .github/workflows/docker.yml (example)
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ghcr.io/bobrapp/openclaw-installer:${{ github.ref_name }}
```

---

## Health Check

The container exposes a health endpoint:

```
GET http://localhost:5000/health
```

Response (200 OK):

```json
{
  "status": "ok",
  "uptime": 42.1,
  "db": "ok"
}
```

Docker's built-in health check polls this every 30 seconds. Check status with:

```bash
docker inspect --format='{{.State.Health.Status}}' openclaw-installer
```

---

## Known Limitations

| Issue | Detail |
|---|---|
| Host binding | `server/index.ts` hardcodes `127.0.0.1` when `NODE_ENV=production`. The Dockerfile patches the compiled bundle (`dist/index.cjs`) at build time with `sed` to use `process.env.HOST \|\| "0.0.0.0"`. If you rebuild without Docker, set `HOST=0.0.0.0` manually or apply the one-line patch to the source. |
| SQLite concurrency | SQLite is single-writer. For high-concurrency deployments, consider migrating to PostgreSQL. |
| Passphrase in env | `OWNER_PASSPHRASE` in environment variables is visible in `docker inspect`. Use Docker secrets for production. |

---

*AiGovOps Foundation — https://github.com/bobrapp/openclaw-installer*
