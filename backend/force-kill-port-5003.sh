#!/bin/bash

echo "Finding ALL processes on port 5003..."
lsof -i :5003

echo ""
echo "Killing ALL processes on port 5003..."
# Kill all processes more aggressively
for pid in $(lsof -ti:5003); do
  echo "Killing process $pid..."
  kill -9 $pid 2>/dev/null
done

sleep 2

echo ""
echo "Checking if port 5003 is free now..."
if lsof -i :5003 >/dev/null 2>&1; then
  echo "⚠️  Port 5003 still in use"
  echo "Processes still using port 5003:"
  lsof -i :5003
else
  echo "✅ Port 5003 is now free"
fi





