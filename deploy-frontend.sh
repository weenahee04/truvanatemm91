#!/bin/bash
# Script to deploy frontend to server

echo "🚀 Deploying frontend to server..."

# Server details
SERVER_IP="159.223.68.19"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/truvamate_do"
SERVER_PATH="/var/www/truvamate"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Uploading files to server...${NC}"
scp -i $SSH_KEY -r dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Files uploaded successfully!${NC}"
else
    echo -e "${RED}❌ Upload failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Setting permissions on server...${NC}"
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'
chown -R www-data:www-data /var/www/truvamate
chmod -R 755 /var/www/truvamate
echo "✅ Permissions set successfully!"
ls -la /var/www/truvamate/ | head -10
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo -e "${GREEN}🌐 Frontend is now live at: https://www.truvamate.com${NC}"
else
    echo -e "${RED}❌ Permission setup failed!${NC}"
    exit 1
fi
