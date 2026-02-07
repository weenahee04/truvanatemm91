#!/bin/bash

echo "Killing processes on port 5003..."
lsof -ti:5003 | xargs kill -9 2>/dev/null

sleep 2

echo "Checking if port 5003 is free..."
if lsof -i :5003 >/dev/null 2>&1; then
  echo "⚠️  Port 5003 still in use. Try manually:"
  echo "   lsof -i :5003"
  echo "   kill -9 <PID>"
else
  echo "✅ Port 5003 is now free"
  echo ""
  echo "Starting backend..."
  cd /Users/ren/Downloads/truvamatenewversion-master/backend
  PORT=5003 npm run dev
fi





