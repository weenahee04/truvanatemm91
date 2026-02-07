#!/bin/bash

# Start Frontend Server Script
cd "$(dirname "$0")"

echo "🚀 Starting Truvamate Frontend..."
echo "📍 Location: $(pwd)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Check if port 5001 is in use
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  Port 5001 is already in use!"
  echo "   Attempting to free the port..."
  lsof -ti:5001 | xargs kill -9 2>/dev/null
  sleep 2
  echo ""
fi

echo "✅ Starting Vite dev server on port 5001..."
echo "🌐 Server will be available at: http://localhost:5001/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev





