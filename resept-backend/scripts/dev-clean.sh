#!/bin/bash

# Clean development script for resept-backend
# Kills any existing processes on port 8787 and starts fresh

PORT=8787

echo "🧹 Cleaning up existing processes on port $PORT..."

# Kill any existing processes on the port
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  Found existing processes on port $PORT"
    PIDS=$(lsof -ti:$PORT)
    echo "🔫 Killing processes: $PIDS"
    echo $PIDS | xargs kill -9
    echo "✅ Processes killed"
    sleep 1
else
    echo "✅ No existing processes found on port $PORT"
fi

echo "🚀 Starting development server..."
npm run dev