# =============================================================================
# OpenClaw Guided Install — Dockerfile
# AiGovOps Foundation  |  License: Apache-2.0 WITH Commons-Clause
# https://github.com/bobrapp/openclaw-installer
# =============================================================================
#
# Multi-stage build:
#   Stage 1 (builder) — installs all deps, compiles client + server
#   Stage 2 (runtime) — lean production image with only what's needed
#
# NOTE: The production server binds to 127.0.0.1 by default (server/index.ts).
# The runtime stage patches this at build time so the container listens on
# 0.0.0.0:5000, which is required for Docker port mapping to work.
#
# SQLite database (openclaw.db) is stored in /data inside the container.
# Mount a host directory to /data for persistence:
#   docker run -v $(pwd)/data:/data ...
# =============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL stage="builder"

# Build-time tools
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Install all dependencies (dev + prod) for the build
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY client/       ./client/
COPY server/       ./server/
COPY shared/       ./shared/
COPY script/       ./script/
COPY public/       ./public/
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Copy public assets that need to be available at runtime via dist/public/
COPY public/*.html ./public/
COPY public/*.pdf  ./public/

# Build client (Vite → dist/public/) and server (esbuild → dist/index.cjs)
RUN npm run build

# Copy public HTML + PDF files into dist/public/ so the static server can serve them
RUN cp -n public/*.html dist/public/ 2>/dev/null || true && \
    cp -n public/*.pdf  dist/public/ 2>/dev/null || true

# Patch the compiled server bundle so it binds to 0.0.0.0 inside Docker.
# The source hardcodes: production → 127.0.0.1, else → 0.0.0.0
# We replace the specific conditional so Docker containers are reachable.
RUN sed -i 's/process\.env\.NODE_ENV==="production"?"127\.0\.0\.1":"0\.0\.0\.0"/process.env.HOST||"0.0.0.0"/g' dist/index.cjs || true

# Install only production dependencies for the runtime stage
RUN npm ci --omit=dev

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

LABEL org.opencontainers.image.title="OpenClaw Guided Install" \
      org.opencontainers.image.description="AI Governance guided installer — AiGovOps Foundation" \
      org.opencontainers.image.licenses="Apache-2.0 WITH Commons-Clause" \
      org.opencontainers.image.vendor="AiGovOps Foundation" \
      org.opencontainers.image.source="https://github.com/bobrapp/openclaw-installer" \
      maintainer="AiGovOps Foundation"

# Runtime utilities: bash (scripts), curl (health check)
RUN apk add --no-cache bash curl

WORKDIR /app

# Copy production artifacts from builder
COPY --from=builder /build/dist/              ./dist/
COPY --from=builder /build/node_modules/      ./node_modules/
COPY --from=builder /build/package.json       ./package.json
COPY --from=builder /build/scripts/           ./scripts/

# Persistent data directory for SQLite
# The server resolves openclaw.db relative to cwd (/app by default).
# We symlink /data/openclaw.db → /app/openclaw.db so the DB lives in the
# mounted volume while the app finds it at the expected path.
RUN mkdir -p /data && chown node:node /data

# Environment defaults
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0 \
    DB_PATH=/data/openclaw.db

# Entrypoint script: fixes /data ownership (bind mounts inherit host uid/gid),
# sets up the DB symlink, then drops to the node user before exec.
# Runs as root initially so it can chown the mounted volume.
COPY <<'EOF' /app/docker-entrypoint.sh
#!/bin/bash
set -e

# Fix /data ownership so the node user can write to bind-mounted volumes.
# On named volumes this is a no-op; on bind mounts it corrects host uid/gid.
chown -R node:node /data 2>/dev/null || true

# Ensure DB lives in the persistent volume and is symlinked into cwd
if [ ! -f /data/openclaw.db ]; then
  # If a pre-seeded DB was baked in, move it; otherwise let the app create it
  if [ -f /app/openclaw.db ] && [ ! -L /app/openclaw.db ]; then
    mv /app/openclaw.db /data/openclaw.db
    chown node:node /data/openclaw.db 2>/dev/null || true
  fi
fi

# Create symlink so the app finds openclaw.db in cwd (/app)
if [ ! -L /app/openclaw.db ]; then
  ln -sf /data/openclaw.db /app/openclaw.db
fi

# Drop to non-root user for the actual server process
exec su-exec node "$@"
EOF

RUN apk add --no-cache su-exec && chmod +x /app/docker-entrypoint.sh

# Container process starts as root (entrypoint drops to node via su-exec)
# USER node — handled by entrypoint

EXPOSE 5000

# Persistent volume mount point for SQLite data
VOLUME ["/data"]

# Health check — uses the /health endpoint (not /api/health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/index.cjs"]
