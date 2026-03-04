#!/bin/bash

# Teacher Attendance Display - Startup Script
# This script starts the backend server and opens the display in a browser

echo "🚀 Starting Teacher Attendance Display..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to server directory
cd "$SCRIPT_DIR/server"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server in the background
echo "🖥️  Starting backend server on port 5556..."
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to be ready..."
sleep 3

# Check if server is running
if curl -s http://localhost:5556/api/health > /dev/null 2>&1; then
    echo "✅ Server is running!"

    # Open the display in default browser
    echo "🌐 Opening attendance display..."
    open "$SCRIPT_DIR/client/index.html"

    echo ""
    echo "════════════════════════════════════════════════"
    echo "  Teacher Attendance Display is now running!"
    echo "════════════════════════════════════════════════"
    echo ""
    # Start Cloudflare tunnel if not already running
    if ! pgrep -f "cloudflared tunnel run cosmodrive" > /dev/null 2>&1; then
        echo "🌐 Starting Cloudflare Tunnel..."
        cloudflared tunnel run cosmodrive &
        sleep 2
        echo "✅ Cloudflare Tunnel started"
    else
        echo "🌐 Cloudflare Tunnel already running"
    fi

    echo "  📊 Display: Opened in your browser"
    echo "  🔗 API: http://localhost:5556/api"
    echo "  🌍 Public: https://display.icanacademy.work"
    echo "  🔄 Auto-refresh: Every 10 seconds"
    echo ""
    echo "  Press Ctrl+C to stop the server"
    echo "════════════════════════════════════════════════"
    echo ""

    # Wait for Ctrl+C
    wait $SERVER_PID
else
    echo "❌ Failed to start server. Check for errors above."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
