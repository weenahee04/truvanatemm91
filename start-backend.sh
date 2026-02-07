#!/bin/bash

# Script to start the backend server

echo "🚀 Starting Backend Server..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example if available..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please update it with your configuration."
    fi
    echo ""
fi

# Start the server
echo "📡 Starting backend server on port 5000..."
echo "   (Press Ctrl+C to stop)"
echo ""
npm run dev





