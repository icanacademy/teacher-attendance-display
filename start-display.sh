#!/bin/bash

# Teacher Attendance Display - Daily Startup Script
# Run this script to start the server and open the display

echo "🚀 Starting Teacher Attendance Display..."

# Navigate to server directory
cd /Users/icanacademy/teacher-attendance-display/server

# Check if server is already running
if lsof -Pi :5556 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server is already running on port 5556"
else
    echo "🔧 Starting server..."
    npm start > /dev/null 2>&1 &
    sleep 2
    echo "✅ Server started on port 5556"
fi

# Open the display in default browser
echo "🌐 Opening attendance display..."
open /Users/icanacademy/teacher-attendance-display/client/index.html

echo "✅ All done! Display should be open in your browser."
echo "💡 Tip: Press F11 (or Cmd+Ctrl+F) for fullscreen mode"
