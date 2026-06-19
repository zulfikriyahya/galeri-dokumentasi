#!/bin/bash

set -e

GREEN="\e[32m"
BLUE="\e[34m"
YELLOW="\e[33m"
RED="\e[31m"
RESET="\e[0m"

info()    { echo -e "${BLUE}==>${RESET} $1"; }
success() { echo -e "${GREEN}==>${RESET} $1"; }
warn()    { echo -e "${YELLOW}==>${RESET} $1"; }
error()   { echo -e "${RED}==>${RESET} $1"; exit 1; }

ask() {
  local prompt="$1"
  local default="$2"
  local value
  if [ -n "$default" ]; then
    read -p "$(echo -e "${YELLOW}?${RESET} $prompt [$default]: ")" value
    echo "${value:-$default}"
  else
    read -p "$(echo -e "${YELLOW}?${RESET} $prompt: ")" value
    echo "$value"
  fi
}

ask_secret() {
  local prompt="$1"
  local value
  read -s -p "$(echo -e "${YELLOW}?${RESET} $prompt: ")" value
  echo ""
  echo "$value"
}

confirm() {
  local prompt="$1"
  local answer
  read -p "$(echo -e "${YELLOW}?${RESET} $prompt [y/N]: ")" answer
  [[ "$answer" =~ ^[Yy]$ ]]
}

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${RESET}"
echo -e "${BLUE}║     DEPLOY DOKUMENTASI - ZEDLABS     ║${RESET}"
echo -e "${BLUE}╚══════════════════════════════════════╝${RESET}"
echo ""

# ── Konfigurasi awal ────────────────────────────────────────────
info "Konfigurasi Aplikasi"
APP_NAME=$(ask "Nama aplikasi" "galeri-dokumentasi")
APP_DIR="/var/www/$APP_NAME"
REPO_URL=$(ask "URL repository Git" "https://github.com/zulfikriyahya/galeri-dokumentasi")
BRANCH=$(ask "Branch" "main")
PORT=$(ask "Port aplikasi" "4321")

echo ""
info "Konfigurasi .env"
IMMICH_BASE_URL=$(ask "IMMICH_BASE_URL" "https://")
IMMICH_API_KEY=$(ask_secret "IMMICH_API_KEY")
SITE_NAME=$(ask "SITE_NAME" "DOKUMENTASI ROHIS")
SITE_SHORT_NAME=$(ask "SITE_SHORT_NAME" "DOKUMENTASI ROHIS")
SITE_DESCRIPTION=$(ask "SITE_DESCRIPTION" "Dokumentasi kegiatan dalam satu tempat.")
ORG_NAME=$(ask "ORG_NAME" "ROHIS")
SCHOOL_NAME=$(ask "SCHOOL_NAME" "SMKN 1 PANDEGLANG")
POWERED_BY=$(ask "POWERED_BY" "ZEDLABS TEKNOLOGI INDONESIA")
POWERED_BY_URL=$(ask "POWERED_BY_URL" "https://zedlabs.id")
EXCLUDED_ALBUM_KEYWORDS=$(ask "EXCLUDED_ALBUM_KEYWORDS (pisah koma)" "UNGGAH DOKUMENTASI")

echo ""
info "Konfigurasi Nginx"
DOMAIN=$(ask "Domain" "galeri.zedlabs.id")
USE_SSL=$(confirm "Setup SSL dengan Certbot?" && echo "yes" || echo "no")

echo ""
echo -e "${BLUE}──────────────────────────────────────${RESET}"
echo -e "  Nama Aplikasi : ${GREEN}$APP_NAME${RESET}"
echo -e "  Direktori     : ${GREEN}$APP_DIR${RESET}"
echo -e "  Repository    : ${GREEN}$REPO_URL${RESET}"
echo -e "  Branch        : ${GREEN}$BRANCH${RESET}"
echo -e "  Port          : ${GREEN}$PORT${RESET}"
echo -e "  Domain        : ${GREEN}$DOMAIN${RESET}"
echo -e "  SSL           : ${GREEN}$USE_SSL${RESET}"
echo -e "${BLUE}──────────────────────────────────────${RESET}"
echo ""

confirm "Lanjutkan deploy?" || error "Deploy dibatalkan."

# ── Install dependencies sistem ──────────────────────────────────
echo ""
info "Update sistem..."
apt update -y

if ! command -v nginx &>/dev/null; then
  info "Install Nginx..."
  apt install -y nginx
  systemctl enable nginx
  success "Nginx terinstall."
else
  warn "Nginx sudah terinstall, dilewati."
fi

if ! command -v node &>/dev/null; then
  info "Install Node.js 26..."
  apt install -y curl
  curl -fsSL https://deb.nodesource.com/setup_26.x | bash -
  apt install -y nodejs
  success "Node.js terinstall: $(node -v)"
else
  warn "Node.js sudah terinstall: $(node -v)"
fi

if ! command -v pnpm &>/dev/null; then
  info "Install pnpm..."
  npm install -g pnpm
  success "pnpm terinstall: $(pnpm -v)"
else
  warn "pnpm sudah terinstall: $(pnpm -v)"
fi

if ! command -v pm2 &>/dev/null; then
  info "Install pm2..."
  npm install -g pm2
  success "pm2 terinstall."
else
  warn "pm2 sudah terinstall."
fi

if [ "$USE_SSL" = "yes" ] && ! command -v certbot &>/dev/null; then
  info "Install Certbot..."
  apt install -y certbot python3-certbot-nginx
  success "Certbot terinstall."
fi

# ── Clone / Pull repository ──────────────────────────────────────
echo ""
if [ ! -d "$APP_DIR" ]; then
  info "Clone repository ke $APP_DIR..."
  git clone -b $BRANCH $REPO_URL $APP_DIR
else
  info "Pull update terbaru..."
  cd $APP_DIR && git pull origin $BRANCH
fi

# ── Buat file .env ───────────────────────────────────────────────
echo ""
info "Membuat file .env..."
cat > "$APP_DIR/.env" <<EOF
IMMICH_BASE_URL=$IMMICH_BASE_URL
IMMICH_API_KEY=$IMMICH_API_KEY

SITE_NAME=$SITE_NAME
SITE_SHORT_NAME=$SITE_SHORT_NAME
SITE_DESCRIPTION=$SITE_DESCRIPTION
ORG_NAME=$ORG_NAME
SCHOOL_NAME=$SCHOOL_NAME
POWERED_BY=$POWERED_BY
POWERED_BY_URL=$POWERED_BY_URL
EXCLUDED_ALBUM_KEYWORDS=$EXCLUDED_ALBUM_KEYWORDS
EOF
success ".env berhasil dibuat."

# ── Buat ecosystem.config.cjs ────────────────────────────────────
echo ""
info "Membuat ecosystem.config.cjs..."
cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [
    {
      name: "$APP_NAME",
      script: "./dist/server/entry.mjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: $PORT,
      },
    },
  ],
};
EOF
success "ecosystem.config.cjs berhasil dibuat."

# ── Konfigurasi Nginx ────────────────────────────────────────────
echo ""
info "Membuat konfigurasi Nginx..."
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }

    location ~* \.(ico|svg|png|jpg|jpeg|webp|woff2|woff|ttf)$ {
        proxy_pass http://127.0.0.1:$PORT;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    location ~* \.(css|js)$ {
        proxy_pass http://127.0.0.1:$PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"
nginx -t && systemctl reload nginx
success "Nginx berhasil dikonfigurasi."

# ── SSL ──────────────────────────────────────────────────────────
if [ "$USE_SSL" = "yes" ]; then
  echo ""
  info "Setup SSL untuk $DOMAIN..."
  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
  success "SSL berhasil dipasang."
fi

# ── Build aplikasi ───────────────────────────────────────────────
echo ""
cd "$APP_DIR"

info "Install dependencies..."
pnpm install --frozen-lockfile

info "Generate icons..."
node scripts/gen-icon.mjs

info "Build aplikasi..."
pnpm build

# ── Jalankan dengan pm2 ──────────────────────────────────────────
echo ""
info "Menjalankan aplikasi dengan pm2..."
if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart $APP_NAME
else
  pm2 start ecosystem.config.cjs
fi

pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║         DEPLOY BERHASIL!             ║${RESET}"
echo -e "${GREEN}╚══════════════════════════════════════╝${RESET}"
echo ""
echo -e "  URL     : ${GREEN}http${USE_SSL:+s}://$DOMAIN${RESET}"
echo -e "  PM2     : ${GREEN}pm2 status${RESET}"
echo -e "  Log     : ${GREEN}pm2 logs $APP_NAME${RESET}"
echo ""