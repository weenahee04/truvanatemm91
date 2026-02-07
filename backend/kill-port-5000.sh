#!/bin/bash

# Kill process on port 5000

echo "Finding process on port 5000..."
lsof -i :5000

echo ""
echo "Killing process on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null

sleep 1

echo "Checking if port 5000 is free now..."
if lsof -i :5000 >/dev/null 2>&1; then
  echo "⚠️  Port 5000 still in use"
else
  echo "✅ Port 5000 is now free"
fi





