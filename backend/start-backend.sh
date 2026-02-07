#!/bin/bash

# Start Backend Server Script
cd "$(dirname "$0")"

echo "🚀 Starting Truvamate Backend..."
echo "📍 Location: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found!"
  echo "   Please create .env file with required environment variables."
  echo "   See .env.example or START_BACKEND_LOCALHOST.md for reference."
  echo ""
fi

# Check if port 5000 is in use
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  Port 5000 is already in use!"
  echo "   Checking if backend is already running..."
  
  # Test if it's our backend
  if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    echo "   ✅ Backend is already running on port 5000"
    echo "   Access it at: http://localhost:5000"
    exit 0
  else
    echo "   Port 5000 is used by another service."
    echo "   Attempting to free the port..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 2
    echo ""
  fi
fi

echo "✅ Starting backend server on port 5000..."
echo "🌐 Server will be available at: http://localhost:5000"
echo "📡 API will be available at: http://localhost:5000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev





