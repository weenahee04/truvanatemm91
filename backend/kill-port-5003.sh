#!/bin/bash

# Kill process on port 5003

echo "Finding process on port 5003..."
lsof -i :5003

echo ""
echo "Killing process on port 5003..."
lsof -ti:5003 | xargs kill -9 2>/dev/null

sleep 1

echo "Checking if port 5003 is free now..."
if lsof -i :5003 >/dev/null 2>&1; then
  echo "⚠️  Port 5003 still in use"
else
  echo "✅ Port 5003 is now free"
fi





