#!/bin/bash

# Script สำหรับ Deploy Truvamate ไปยัง GoDaddy Server
# วิธีใช้: chmod +x deploy-to-godaddy.sh && ./deploy-to-godaddy.sh

set -e  # Exit on error

echo "🚀 Truvamate Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="${SERVER_USER:-your-username}"
SERVER_HOST="${SERVER_HOST:-your-server-ip}"
SERVER_PATH="${SERVER_PATH:-~/truvamate}"
FRONTEND_PATH="${FRONTEND_PATH:-/var/www/truvamate}"

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if running on local machine
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build Frontend
print_info "Step 1: Building Frontend..."
npm install
npm run build

if [ ! -d "dist" ]; then
    print_error "Frontend build failed! dist/ directory not found"
    exit 1
fi

print_success "Frontend built successfully"

# Step 2: Upload Frontend
print_info "Step 2: Uploading Frontend to Server..."
read -p "Upload frontend to server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_HOST}:${FRONTEND_PATH}/
    print_success "Frontend uploaded successfully"
else
    print_info "Skipping frontend upload"
fi

# Step 3: Upload Backend
print_info "Step 3: Uploading Backend to Server..."
read -p "Upload backend to server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rsync -avz --exclude 'node_modules' --exclude 'logs' --exclude '.env' backend/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/backend/
    print_success "Backend uploaded successfully"
else
    print_info "Skipping backend upload"
fi

# Step 4: Deploy on Server
print_info "Step 4: Deploying on Server..."
read -p "Run deployment commands on server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
        cd ~/truvamate/backend
        
        # Install dependencies
        echo "Installing dependencies..."
        npm install --production
        
        # Build TypeScript
        echo "Building TypeScript..."
        npm run build
        
        # Restart PM2
        echo "Restarting PM2..."
        pm2 restart truvamate-backend || pm2 start ecosystem.config.js
        
        echo "Deployment complete!"
ENDSSH
    print_success "Server deployment completed"
else
    print_info "Skipping server deployment"
fi

# Step 5: Reload Nginx
print_info "Step 5: Reloading Nginx..."
read -p "Reload Nginx on server? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh ${SERVER_USER}@${SERVER_HOST} "sudo nginx -t && sudo systemctl reload nginx"
    print_success "Nginx reloaded"
else
    print_info "Skipping Nginx reload"
fi

print_success "🎉 Deployment completed!"
print_info "Check your website at: https://truvamate.com"