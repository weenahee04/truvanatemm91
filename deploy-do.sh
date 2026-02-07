#!/bin/bash
# Build backend + frontend (admin) แล้ว deploy ลง DigitalOcean
# ใช้: ./deploy-do.sh
# หรือ: SERVER_IP=your-droplet-ip SSH_KEY=~/.ssh/your_key ./deploy-do.sh

set -e

SERVER_IP="${SERVER_IP:-159.223.68.19}"
SERVER_USER="${SERVER_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/truvamate_do}"
FRONTEND_PATH="/var/www/truvamate"
BACKEND_PATH="/root/truvamate/backend"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Build & Deploy to DigitalOcean${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Server: ${YELLOW}$SERVER_USER@$SERVER_IP${NC}"
echo -e "SSH Key: ${YELLOW}$SSH_KEY${NC}"
echo ""

# --- 1. Build Backend ---
echo -e "${YELLOW}[1/5] Building backend...${NC}"
cd "$PROJECT_DIR/backend"
npm run build
echo -e "${GREEN}✅ Backend built${NC}"
echo ""

# --- 2. Build Frontend (รวม Admin) ---
echo -e "${YELLOW}[2/5] Building frontend (admin)...${NC}"
cd "$PROJECT_DIR"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# --- 3. Upload Backend ---
echo -e "${YELLOW}[3/5] Uploading backend...${NC}"
ssh -i "$SSH_KEY" -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "mkdir -p /root/truvamate"
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.git' \
  --exclude 'logs' \
  --exclude '*.log' \
  "$PROJECT_DIR/backend/" \
  "$SERVER_USER@$SERVER_IP:/root/truvamate/backend/"
echo -e "${GREEN}✅ Backend uploaded${NC}"
echo ""

# --- 4. Upload Frontend ---
echo -e "${YELLOW}[4/5] Uploading frontend (admin)...${NC}"
ssh -i "$SSH_KEY" $SERVER_USER@$SERVER_IP "mkdir -p $FRONTEND_PATH"
scp -i "$SSH_KEY" -r "$PROJECT_DIR/dist/"* "$SERVER_USER@$SERVER_IP:$FRONTEND_PATH/"
echo -e "${GREEN}✅ Frontend uploaded${NC}"
echo ""

# --- 5. Server: install deps, PM2 restart, permissions ---
echo -e "${YELLOW}[5/5] Server setup (npm install, PM2, permissions)...${NC}"
ssh -i "$SSH_KEY" $SERVER_USER@$SERVER_IP bash -s << 'REMOTE'
set -e
mkdir -p /root/truvamate/backend/logs
cd /root/truvamate/backend
npm install --omit=dev
if pm2 describe truvamate-backend >/dev/null 2>&1; then
  pm2 restart truvamate-backend
else
  pm2 start ecosystem.config.js
fi
pm2 save
chown -R www-data:www-data /var/www/truvamate
chmod -R 755 /var/www/truvamate
echo "✅ PM2 & permissions done"
REMOTE
echo -e "${GREEN}✅ Server setup done${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy เสร็จแล้ว${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Frontend:  ${BLUE}https://www.truvamate.com${NC}"
echo -e "API:       ${BLUE}https://www.truvamate.com/api/health${NC}"
echo ""
