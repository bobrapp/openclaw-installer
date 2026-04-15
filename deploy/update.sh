#!/usr/bin/env bash
# OpenClaw Installer — Safe Update Script
# Usage: sudo bash /opt/openclaw/app/deploy/update.sh
# Steps: backup → pull → install → build → restart → health-check → rollback-on-failure

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[OpenClaw]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="/opt/openclaw/app"
BACKUP_DIR="/opt/openclaw/backups"

[[ $EUID -ne 0 ]] && fail "Please run as root: sudo bash update.sh"
[[ ! -d "$APP_DIR/.git" ]] && fail "OpenClaw not found at $APP_DIR"

info "OpenClaw — Safe Update"
echo ""

# --- Pre-update backup ---
info "Backing up database..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
if [ -f "$APP_DIR/openclaw.db" ]; then
  sqlite3 "$APP_DIR/openclaw.db" ".backup $BACKUP_DIR/openclaw-pre-update-$TIMESTAMP.db"
  ok "Database backed up to openclaw-pre-update-$TIMESTAMP.db"
else
  warn "No database file found — skipping backup"
fi

# Save current commit for rollback
CURRENT_COMMIT=$(su - openclaw -c "cd $APP_DIR && git rev-parse HEAD")
ok "Current commit: ${CURRENT_COMMIT:0:8}"

# --- Pull latest ---
info "Pulling latest changes..."
su - openclaw -c "cd $APP_DIR && git pull --ff-only" || fail "Git pull failed — resolve conflicts manually"
NEW_COMMIT=$(su - openclaw -c "cd $APP_DIR && git rev-parse HEAD")
if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
  ok "Already up to date"
  exit 0
fi
ok "Updated to commit ${NEW_COMMIT:0:8}"

# --- Rebuild ---
info "Installing dependencies..."
su - openclaw -c "cd $APP_DIR && npm ci" > /dev/null 2>&1 || {
  warn "npm ci failed — rolling back"
  su - openclaw -c "cd $APP_DIR && git checkout $CURRENT_COMMIT"
  fail "Update rolled back due to install failure"
}

info "Building..."
su - openclaw -c "cd $APP_DIR && npm run build" > /dev/null 2>&1 || {
  warn "Build failed — rolling back"
  su - openclaw -c "cd $APP_DIR && git checkout $CURRENT_COMMIT && npm ci && npm run build" > /dev/null 2>&1
  fail "Update rolled back due to build failure"
}
su - openclaw -c "cd $APP_DIR && cp public/aigovops-wizard.html dist/public/"
su - openclaw -c "cd $APP_DIR && cp -r scripts dist/"
ok "Build complete"

# --- Restart ---
info "Restarting service..."
systemctl restart openclaw

# --- Health check ---
info "Checking health..."
sleep 3
for i in $(seq 1 10); do
  if curl -sf --max-time 3 "http://127.0.0.1:5000/health" > /dev/null 2>&1; then
    ok "Health check passed"
    echo ""
    echo -e "${GREEN}Update complete: ${CURRENT_COMMIT:0:8} → ${NEW_COMMIT:0:8}${NC}"
    exit 0
  fi
  sleep 2
done

# --- Rollback on health failure ---
warn "Health check failed — rolling back to ${CURRENT_COMMIT:0:8}"
su - openclaw -c "cd $APP_DIR && git checkout $CURRENT_COMMIT"
su - openclaw -c "cd $APP_DIR && npm ci && npm run build" > /dev/null 2>&1
su - openclaw -c "cd $APP_DIR && cp public/aigovops-wizard.html dist/public/ && cp -r scripts dist/"
if [ -f "$BACKUP_DIR/openclaw-pre-update-$TIMESTAMP.db" ]; then
  cp "$BACKUP_DIR/openclaw-pre-update-$TIMESTAMP.db" "$APP_DIR/openclaw.db"
  chown openclaw:openclaw "$APP_DIR/openclaw.db"
fi
systemctl restart openclaw
fail "Update rolled back — service restored to previous version"
