#!/bin/bash

# ============================================
# Deploy Truvamate to DigitalOcean Droplet
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_IP="159.223.68.19"
SSH_KEY="~/.ssh/truvamate_do"
SSH_USER="root"
PROJECT_DIR="/Users/ren/Downloads/truvamatenewversion-master"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Deploy Truvamate to DigitalOcean${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Test SSH Connection
echo -e "${YELLOW}Step 1: Testing SSH connection...${NC}"
if ssh -i $SSH_KEY -o ConnectTimeout=5 -o BatchMode=yes $SSH_USER@$DROPLET_IP "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection test failed, but continuing...${NC}"
    echo -e "${YELLOW}   Make sure you can connect manually:${NC}"
    echo -e "${YELLOW}   ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP${NC}"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Upload Setup Script
echo ""
echo -e "${YELLOW}Step 2: Uploading setup-server.sh...${NC}"
cd "$PROJECT_DIR"
scp -i $SSH_KEY setup-server.sh $SSH_USER@$DROPLET_IP:~/
echo -e "${GREEN}✅ Setup script uploaded!${NC}"

# Step 3: Run Setup Script
echo ""
echo -e "${YELLOW}Step 3: Running setup script on server...${NC}"
echo -e "${YELLOW}   This will take 5-10 minutes...${NC}"
ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP "chmod +x setup-server.sh && ./setup-server.sh"
echo -e "${GREEN}✅ Server setup completed!${NC}"

# Step 4: Upload Backend
echo ""
echo -e "${YELLOW}Step 4: Uploading backend code...${NC}"
ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP "mkdir -p ~/truvamate"
scp -i $SSH_KEY -r backend $SSH_USER@$DROPLET_IP:~/truvamate/
echo -e "${GREEN}✅ Backend code uploaded!${NC}"

# Step 5: Build Frontend
echo ""
echo -e "${YELLOW}Step 5: Building frontend...${NC}"
cd "$PROJECT_DIR"
npm install
npm run build
echo -e "${GREEN}✅ Frontend built!${NC}"

# Step 6: Upload Frontend
echo ""
echo -e "${YELLOW}Step 6: Uploading frontend...${NC}"
ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP "mkdir -p /var/www/truvamate"
scp -i $SSH_KEY -r dist/* $SSH_USER@$DROPLET_IP:/var/www/truvamate/
ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP "sudo chown -R www-data:www-data /var/www/truvamate"
echo -e "${GREEN}✅ Frontend uploaded!${NC}"

# Step 7: Setup Backend
echo ""
echo -e "${YELLOW}Step 7: Setting up backend on server...${NC}"
echo -e "${YELLOW}   You need to:${NC}"
echo -e "${YELLOW}   1. SSH into server: ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP${NC}"
echo -e "${YELLOW}   2. Create .env file: cd ~/truvamate/backend && nano .env${NC}"
echo -e "${YELLOW}   3. Install dependencies: npm install --production${NC}"
echo -e "${YELLOW}   4. Build: npm run build${NC}"
echo -e "${YELLOW}   5. Start PM2: pm2 start ecosystem.config.js${NC}"

# Step 8: Setup Nginx
echo ""
echo -e "${YELLOW}Step 8: Setting up Nginx...${NC}"
echo -e "${YELLOW}   You need to:${NC}"
echo -e "${YELLOW}   1. SSH into server: ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP${NC}"
echo -e "${YELLOW}   2. Create config: sudo nano /etc/nginx/sites-available/truvamate${NC}"
echo -e "${YELLOW}   3. Enable site: sudo ln -s /etc/nginx/sites-available/truvamate /etc/nginx/sites-enabled/${NC}"
echo -e "${YELLOW}   4. Test: sudo nginx -t${NC}"
echo -e "${YELLOW}   5. Reload: sudo systemctl reload nginx${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment steps completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. SSH into server: ssh -i $SSH_KEY $SSH_USER@$DROPLET_IP${NC}"
echo -e "${BLUE}2. Setup backend .env and start PM2${NC}"
echo -e "${BLUE}3. Setup Nginx config${NC}"
echo -e "${BLUE}4. Test: http://$DROPLET_IP${NC}"
echo ""