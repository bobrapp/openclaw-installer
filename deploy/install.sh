#!/usr/bin/env bash
# OpenClaw Installer — One-liner VPS Deploy Script
# Usage: curl -fsSL https://raw.githubusercontent.com/bobrapp/openclaw-installer/master/deploy/install.sh | bash
# Supports: Ubuntu 22.04+, Debian 12+
# Creates: openclaw user, systemd service, nginx reverse proxy

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[OpenClaw]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# --- Pre-flight ---
info "OpenClaw Installer — Automated VPS Deploy"
echo ""

[[ $EUID -ne 0 ]] && fail "Please run as root: sudo bash or curl ... | sudo bash"

# Check OS
if ! grep -qiE 'ubuntu|debian' /etc/os-release 2>/dev/null; then
  warn "This script is tested on Ubuntu 22.04+ / Debian 12+. Proceeding anyway..."
fi

# --- System packages ---
info "Updating packages..."
apt-get update -qq
apt-get install -y -qq git curl ufw nginx certbot python3-certbot-nginx > /dev/null 2>&1
ok "System packages installed"

# --- Node.js 20 LTS ---
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  info "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1
fi
ok "Node.js $(node -v) ready"

# --- Firewall ---
info "Configuring firewall..."
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
ok "Firewall configured (SSH, HTTP, HTTPS)"

# --- App user ---
if ! id openclaw &>/dev/null; then
  useradd -m -s /bin/bash openclaw
  ok "Created openclaw user"
else
  ok "openclaw user already exists"
fi

mkdir -p /opt/openclaw
chown openclaw:openclaw /opt/openclaw

# --- Clone & build ---
APP_DIR="/opt/openclaw/app"
if [[ -d "$APP_DIR/.git" ]]; then
  info "Updating existing installation..."
  su - openclaw -c "cd $APP_DIR && git pull --ff-only"
else
  info "Cloning OpenClaw..."
  su - openclaw -c "git clone https://github.com/bobrapp/openclaw-installer.git $APP_DIR"
fi

info "Installing dependencies & building..."
su - openclaw -c "cd $APP_DIR && npm install --production=false" > /dev/null 2>&1
su - openclaw -c "cd $APP_DIR && npm run build" > /dev/null 2>&1
su - openclaw -c "cd $APP_DIR && cp public/aigovops-wizard.html dist/public/"
su - openclaw -c "cd $APP_DIR && cp -r scripts dist/"
ok "Build complete"

# --- Systemd service ---
info "Creating systemd service..."
cat > /etc/systemd/system/openclaw.service << 'EOF'
[Unit]
Description=OpenClaw Installer
After=network.target

[Service]
Type=simple
User=openclaw
Group=openclaw
WorkingDirectory=/opt/openclaw/app
ExecStart=/usr/bin/node dist/index.cjs
Environment=NODE_ENV=production
Environment=PORT=5000
Restart=on-failure
RestartSec=5
ProtectSystem=strict
PrivateTmp=true
NoNewPrivileges=true
ReadWritePaths=/opt/openclaw

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now openclaw
ok "Systemd service running"

# --- SQLite Backup (daily) ---
info "Configuring daily database backup..."
mkdir -p /opt/openclaw/backups
chown openclaw:openclaw /opt/openclaw/backups
cat > /etc/cron.daily/openclaw-backup << 'CRON'
#!/bin/bash
# Daily backup of OpenClaw SQLite database (immutable audit chain)
BACKUP_DIR="/opt/openclaw/backups"
DB_PATH="/opt/openclaw/app/openclaw.db"
if [ -f "$DB_PATH" ]; then
  sqlite3 "$DB_PATH" ".backup $BACKUP_DIR/openclaw-$(date +%Y%m%d-%H%M).db"
  # Keep 30 days of backups
  find "$BACKUP_DIR" -name "openclaw-*.db" -mtime +30 -delete
fi
CRON
chmod +x /etc/cron.daily/openclaw-backup
ok "Daily SQLite backup configured (30-day retention)"

# --- Nginx ---
info "Configuring nginx reverse proxy..."
cat > /etc/nginx/sites-available/openclaw << 'NGINX'
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/openclaw
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configured"

# --- Done ---
echo ""
PUBLIC_IP=$(curl -sf https://ifconfig.me || echo "your-server-ip")
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  OpenClaw Installer deployed successfully!       ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Access: http://${PUBLIC_IP}$(printf '%*s' $((22 - ${#PUBLIC_IP})) '')║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Next steps:                                     ║${NC}"
echo -e "${GREEN}║  • Point a domain to this IP                     ║${NC}"
echo -e "${GREEN}║  • Run: certbot --nginx -d your.domain.com       ║${NC}"
echo -e "${GREEN}║  • Update: cd /opt/openclaw/app && git pull       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
