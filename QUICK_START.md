# Quick Start Guide

## Starting the Display

### Option 1: Double-click (easiest)
Just double-click: **`Start Attendance Display.command`**

### Option 2: Terminal
```bash
cd /Users/icanacademy/teacher-attendance-display
./start.sh
```

## How It Works

1. **Automatic Sync**: When the page loads, it automatically pulls today's teachers from the scheduling app
2. **Real-time Updates**: Display refreshes every 10 seconds
3. **Click to Toggle**: Click any teacher card to change their status:
   - Absent → Present → Left → Present (cycles)

## Display Sections

### 🟢 Present (Green)
Teachers who are currently in the building (checked in)

### 🔴 Not Yet Here (Red)
Teachers who haven't arrived yet (absent)

### 🟡 Already Left (Yellow)
Teachers who have checked out for the day

## Setting Up on TV

1. Start the display (see above)
2. Press **F11** for full screen (or Cmd+Ctrl+F on Mac)
3. Drag window to your TV/external monitor
4. Done!

## Troubleshooting

### "No teachers" showing?
- Make sure you have teachers scheduled for TODAY in the scheduling app
- The display only shows teachers for the current date

### Display not updating?
- Check that the backend server is running (port 5556)
- Make sure the scheduling app's database is accessible
- Refresh the browser page

### Server won't start?
- Make sure PostgreSQL is running (from scheduling app)
- Check if port 5556 is already in use

## Accessing from Another Computer

1. Edit `client/app.js` line 2:
   ```javascript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5556/api';
   ```
2. Replace `YOUR_COMPUTER_IP` with your computer's local IP
3. Make sure firewall allows port 5556

## Support

Check the full [README.md](README.md) for detailed documentation.
