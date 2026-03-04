# Teacher Attendance Display

A **real-time, landscape TV display** showing live teacher attendance status from the ICAN Teacher Attendance app.

## Features

- **🖥️ Single-Page Landscape Layout** - Everything visible at once, optimized for TV displays
- **🔄 Auto-Refresh** - Updates every 10 seconds from the attendance database
- **📊 Live Statistics** - Real-time counts of present, late, and absent teachers
- **🎨 Color-Coded Status**:
  - 🟢 **Green**: Teacher is present
  - 🟡 **Yellow**: Teacher arrived late
  - 🔴 **Red**: Teacher is absent
- **📝 Notes Display** - Shows reasons (sick, medical, etc.)
- **📖 Read-Only** - Displays data from attendance-checker app without modification

## Quick Start

### Start the Display

```bash
cd /Users/icanacademy/teacher-attendance-display/server
npm start
```

Then open in browser:
```bash
open /Users/icanacademy/teacher-attendance-display/client/index.html
```

Or use the startup script:
```bash
./start.sh
```

### For TV Display

1. Open the page in any browser
2. Press **F11** for full screen (Cmd+Ctrl+F on Mac)
3. Drag to your TV/external monitor
4. That's it! It auto-updates every 10 seconds

## How It Works

```
┌─────────────────────────────────┐
│  ICAN Teacher Attendance App    │
│  (attendance-checker)           │
│  • Teachers check in/out        │
│  • Tracks attendance daily      │
│  • SQLite database              │
└─────────────────────────────────┘
                │
                │ Reads from
                ▼
┌─────────────────────────────────┐
│  Attendance Display (Port 5556) │
│  • Auto-refreshes every 10s     │
│  • Landscape TV layout          │
│  • Read-only display            │
└─────────────────────────────────┘
```

The display reads from `/Users/icanacademy/attendance-checker/attendance.db` and shows:
- **Present**: Teachers marked as "present"
- **Late Arrivals**: Teachers marked as "late"
- **Not Yet Here**: Teachers marked as "absent"

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ ICAN Teacher Attendance              Thursday, Oct 24    │
│                                            11:45:30 AM    │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ │   22   │ │   0    │ │   3    │ │   25   │            │
│ │Present │ │  Left  │ │Not Here│ │ Total  │            │
│ └────────┘ └────────┘ └────────┘ └────────┘            │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────────┐  ┌──────────────┐       │
│ │ Present  │  │ Late Arrivals│  │ Not Yet Here │       │
│ ├──────────┤  ├──────────────┤  ├──────────────┤       │
│ │ Ashley   │  │ Cha          │  │ Ada          │       │
│ │ Chester  │  │ Start: 8am   │  │ Start: 8am   │       │
│ │ ...      │  │              │  │ Sick/Medical │       │
│ │ (21 more)│  │              │  │ ...          │       │
│ └──────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────┘
```

## API Endpoints

All endpoints are read-only:

- `GET /api/health` - Server status
- `GET /api/attendance?date=YYYY-MM-DD` - Get attendance records
- `GET /api/attendance/stats?date=YYYY-MM-DD` - Get statistics
- `GET /api/attendance/dates` - List available dates

## Configuration

### Change Refresh Interval

Edit `client/app.js`:
```javascript
const REFRESH_INTERVAL = 10000; // milliseconds
```

### Change Server Port

Edit `server/.env`:
```env
PORT=5556
```

### Change Database Path

Edit `server/server.js`:
```javascript
const ATTENDANCE_DB_PATH = '/Users/icanacademy/attendance-checker/attendance.db';
```

## Troubleshooting

### Display shows old data
- Check that attendance-checker app is running and updating the database
- The display refreshes every 10 seconds automatically

### Server won't start
- **Error**: `EADDRINUSE: address already in use`
  - Solution: Change PORT in `server/.env`
- **Error**: `Cannot open database`
  - Solution: Verify attendance-checker database exists at path

### Nothing appears on screen
- Check browser console (F12) for errors
- Verify server is running: `curl http://localhost:5556/api/health`
- Ensure attendance-checker has data for today

## Technical Details

### Database Schema (SQLite)

Reads from the `attendance` table:
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_name TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'present', 'late', 'absent'
  start_time TEXT,
  end_time TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  late_reason TEXT,
  absent_reason TEXT,
  UNIQUE(teacher_id, date)
);
```

### Technology Stack

**Backend:**
- Node.js + Express 5
- SQLite3 (read-only connection)
- CORS enabled

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- CSS Grid layout
- Fetch API for data loading
- Auto-refresh with setInterval

## File Structure

```
teacher-attendance-display/
├── server/
│   ├── server.js           # Express API server
│   ├── package.json        # Dependencies
│   └── .env                # Configuration
├── client/
│   ├── index.html          # Main display page
│   ├── style.css           # Landscape layout styles
│   └── app.js              # Auto-refresh logic
├── start.sh                # Startup script
└── README.md               # This file
```

## Future Enhancements

- [ ] Network IP access for multiple displays
- [ ] Dark mode for nighttime viewing
- [ ] Sound alerts for late arrivals
- [ ] Weekly attendance history view
- [ ] Customizable refresh interval via UI
- [ ] Support for multiple locations/campuses

## License

Proprietary - ICAN Academy

## Support

For issues or questions, contact the IT department.

---

**Last Updated**: October 24, 2025
