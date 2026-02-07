#!/bin/bash

# Truvamate Localhost Setup Script
# This script helps you run the project on localhost

echo "🚀 Truvamate Localhost Setup"
echo "=============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Checking dependencies..."
echo ""

# Check frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "⚠️  Frontend dependencies not found. Installing..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Check backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Backend dependencies not found. Installing..."
    cd backend
    npm install
    cd ..
else
    echo "✅ Backend dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 To start the project, run these commands in separate terminals:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:5173 in your browser"
echo ""






