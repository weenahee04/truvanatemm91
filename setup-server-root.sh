#!/bin/bash

# ============================================
# Truvamate Server Setup Script (Root Version)
# ============================================
# 
# วิธีใช้:
# 1. อัพโหลดไฟล์นี้ไปยัง Server
# 2. chmod +x setup-server-root.sh
# 3. ./setup-server-root.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header "🚀 Truvamate Server Setup"
echo "This script will install and configure:"
echo "  - Node.js 18.x"
echo "  - PM2 (Process Manager)"
echo "  - Nginx (Web Server)"
echo "  - Firewall Configuration"
echo "  - Required Directories"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    print_error "Cannot detect OS. This script supports Ubuntu/Debian and CentOS/RHEL."
    exit 1
fi

print_success "Detected OS: $OS $VER"

# ============================================
# Step 1: Update System
# ============================================
print_header "Step 1: Updating System"
print_step "Updating package lists..."

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt update
    apt upgrade -y
    apt install -y curl wget git build-essential
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y
    yum install -y curl wget git gcc-c++ make
else
    print_error "Unsupported OS: $OS"
    exit 1
fi

print_success "System updated"

# ============================================
# Step 2: Install Node.js 18
# ============================================
print_header "Step 2: Installing Node.js 18"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_step "Node.js is already installed: $NODE_VERSION"
    
    # Check if version is 18 or higher
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        print_success "Node.js version is sufficient"
    else
        print_step "Node.js version is too old. Upgrading..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        else
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            yum install -y nodejs
        fi
    fi
else
    print_step "Installing Node.js 18..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    fi
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_success "Node.js $NODE_VERSION installed"
print_success "NPM $NPM_VERSION installed"

# ============================================
# Step 3: Install PM2
# ============================================
print_header "Step 3: Installing PM2"

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 is already installed: $PM2_VERSION"
else
    print_step "Installing PM2..."
    npm install -g pm2
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 $PM2_VERSION installed"
fi

# ============================================
# Step 4: Install Nginx
# ============================================
print_header "Step 4: Installing Nginx"

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    print_success "Nginx is already installed: $NGINX_VERSION"
else
    print_step "Installing Nginx..."
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        apt install -y nginx
    else
        yum install -y nginx
    fi
    print_success "Nginx installed"
fi

# Start and enable Nginx
print_step "Starting Nginx..."
systemctl start nginx
systemctl enable nginx
print_success "Nginx started and enabled"

# ============================================
# Step 5: Configure Firewall
# ============================================
print_header "Step 5: Configuring Firewall"

if command -v ufw &> /dev/null; then
    print_step "Configuring UFW firewall..."
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    print_success "Firewall configured"
elif command -v firewall-cmd &> /dev/null; then
    print_step "Configuring firewalld..."
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
    print_success "Firewall configured"
else
    print_error "No firewall detected. Please configure manually."
fi

# ============================================
# Step 6: Create Directories
# ============================================
print_header "Step 6: Creating Directories"

print_step "Creating application directories..."
mkdir -p ~/truvamate/backend/logs
mkdir -p /var/www/truvamate

print_step "Setting permissions..."
chown -R www-data:www-data /var/www/truvamate 2>/dev/null || chown -R nginx:nginx /var/www/truvamate 2>/dev/null || true

print_success "Directories created"

# ============================================
# Step 7: Verification
# ============================================
print_header "Step 7: Verification"

print_step "Checking installations..."
echo ""
echo "Node.js: $(node -v)"
echo "NPM: $(npm -v)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""

# Check services
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
fi

print_header "✅ Setup Complete!"
echo "Next steps:"
echo "1. Upload backend code to ~/truvamate/backend"
echo "2. Upload frontend build to /var/www/truvamate"
echo "3. Configure Nginx"
echo "4. Start backend with PM2"
echo ""