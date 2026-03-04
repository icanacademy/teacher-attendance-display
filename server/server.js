import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5556;

// Attendance checker API URLs
const TEACHER_ATTENDANCE_API = 'http://localhost:3001/api';
const STUDENT_ATTENDANCE_API = 'http://localhost:3002/api';

// Path to the attendance databases
const TEACHER_ATTENDANCE_DB_PATH = '/Users/icanacademy/attendance-checker/attendance.db';
const STUDENT_ATTENDANCE_DB_PATH = '/Users/icanacademy/student-attendance-checker/student-attendance.db';

// Middleware
app.use(cors());
app.use(express.json());

// Serve client files
app.use(express.static(path.join(__dirname, '..', 'client')));

// Initialize SQLite connections for both teacher and student databases
const teacherDb = new sqlite3.Database(TEACHER_ATTENDANCE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error connecting to teacher attendance database:', err);
  } else {
    console.log('✅ Connected to teacher attendance database:', TEACHER_ATTENDANCE_DB_PATH);
  }
});

const studentDb = new sqlite3.Database(STUDENT_ATTENDANCE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Error connecting to student attendance database:', err);
  } else {
    console.log('✅ Connected to student attendance database:', STUDENT_ATTENDANCE_DB_PATH);
  }
});

// Helper function to promisify database queries
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Get today's date in YYYY-MM-DD format (timezone-safe)
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Map attendance status to display status
function mapStatus(attendanceStatus) {
  switch (attendanceStatus) {
    case 'present':
    case 'late':
      return 'checked_in';
    case 'absent':
      return 'absent';
    default:
      return 'absent';
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Teacher & Student Attendance Display',
    databases: {
      teachers: {
        type: 'SQLite',
        path: TEACHER_ATTENDANCE_DB_PATH
      },
      students: {
        type: 'SQLite',
        path: STUDENT_ATTENDANCE_DB_PATH
      }
    }
  });
});

// Get teacher attendance records for a specific date
app.get('/api/attendance', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    const rows = await dbAll(
      teacherDb,
      `SELECT
        teacher_name,
        status as original_status,
        start_time,
        end_time,
        timestamp,
        late_reason,
        absent_reason
       FROM attendance
       WHERE date = ?
       ORDER BY teacher_name`,
      [date]
    );

    // Map to display format
    const attendance = rows.map(row => ({
      teacher_name: row.teacher_name,
      status: mapStatus(row.original_status),
      original_status: row.original_status,
      check_in_time: row.start_time ? row.timestamp : null,
      start_time: row.start_time,
      end_time: row.end_time,
      notes: row.late_reason || row.absent_reason || null,
      date: date
    }));

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance grouped by time slots (with ALL teachers from Notion)
app.get('/api/attendance/by-timeslot', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    // Step 1: Fetch ALL active teachers from attendance-checker's Notion API
    let allTeachers = [];
    try {
      const teachersResponse = await fetch(`${TEACHER_ATTENDANCE_API}/teachers`);
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        allTeachers = teachersData.teachers || [];
        console.log(`✅ Fetched ${allTeachers.length} teachers from Notion`);
      } else {
        console.error('❌ Failed to fetch teachers from attendance-checker');
      }
    } catch (fetchError) {
      console.error('❌ Error fetching teachers from attendance-checker:', fetchError.message);
      // Continue with database-only data if fetch fails
    }

    // Step 2: Fetch marked attendance from database
    const rows = await dbAll(
      teacherDb,
      `SELECT
        teacher_id,
        teacher_name,
        status,
        start_time,
        timestamp,
        is_active,
        late_reason,
        absent_reason
       FROM attendance
       WHERE date = ?`,
      [date]
    );

    // Create a map of marked attendance by teacher_id
    const attendanceMap = {};
    rows.forEach(row => {
      attendanceMap[row.teacher_id] = {
        name: row.teacher_name,
        status: row.status,
        timestamp: row.timestamp,
        start_time: row.start_time,
        is_active: row.is_active,
        late_reason: row.late_reason,
        absent_reason: row.absent_reason
      };
    });

    // Step 3: Group ALL teachers by time slot (8am to 8pm - all hours for future-proofing)
    const timeSlots = {};
    const timeSlotOrder = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm'];

    // Initialize all time slots
    timeSlotOrder.forEach(slot => {
      timeSlots[slot] = [];
    });

    // Group teachers by their scheduled start_time
    allTeachers.forEach(teacher => {
      const startTime = teacher.startTime ? teacher.startTime.toLowerCase() : ''; // Normalize to lowercase e.g., '8am', '10am'

      if (startTime && timeSlots[startTime] !== undefined) {
        // Check if teacher has been marked in attendance
        const attendance = attendanceMap[teacher.id];

        // Skip teachers that are marked as inactive (not applicable for today)
        if (attendance && attendance.is_active === 0) {
          return; // Skip this teacher - don't show in display
        }

        timeSlots[startTime].push({
          id: teacher.id,
          name: teacher.name,
          status: attendance ? attendance.status : 'unmarked',
          timestamp: attendance ? attendance.timestamp : null,
          late_reason: attendance ? attendance.late_reason : null,
          absent_reason: attendance ? attendance.absent_reason : null
        });
      }
    });

    res.json({
      date: date,
      timeSlots: timeSlots,
      order: timeSlotOrder,
      totalTeachers: allTeachers.length,
      markedTeachers: rows.length
    });
  } catch (error) {
    console.error('Error fetching attendance by timeslot:', error);
    res.status(500).json({ error: 'Failed to fetch attendance by timeslot' });
  }
});

// Get attendance statistics for a specific date
app.get('/api/attendance/stats', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    // Fetch total active teachers from Notion
    let totalActiveTeachers = 0;
    try {
      const teachersResponse = await fetch(`${TEACHER_ATTENDANCE_API}/teachers`);
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        totalActiveTeachers = teachersData.teachers?.length || 0;
      }
    } catch (fetchError) {
      console.error('Error fetching teachers count:', fetchError.message);
    }

    const rows = await dbAll(
      teacherDb,
      `SELECT status, COUNT(*) as count
       FROM attendance
       WHERE date = ?
       GROUP BY status`,
      [date]
    );

    // Map statuses and calculate totals
    let checked_in = 0;
    let absent = 0;
    let marked = 0;

    rows.forEach(row => {
      marked += row.count;
      if (row.status === 'present' || row.status === 'late') {
        checked_in += row.count;
      } else if (row.status === 'absent') {
        absent += row.count;
      }
    });

    // Calculate late (unmarked teachers)
    const late = totalActiveTeachers - marked;

    res.json({
      checked_in: checked_in.toString(),
      checked_out: late.toString(), // Renamed to show unmarked/late teachers
      absent: absent.toString(),
      total: totalActiveTeachers.toString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get available dates with teacher attendance records
app.get('/api/attendance/dates', async (req, res) => {
  try {
    const rows = await dbAll(
      teacherDb,
      `SELECT DISTINCT date, COUNT(*) as count
       FROM attendance
       GROUP BY date
       ORDER BY date DESC
       LIMIT 30`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching dates:', error);
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

// Sync endpoint (just returns current data, no actual sync needed)
app.post('/api/attendance/sync', async (req, res) => {
  try {
    const date = req.body.date || getTodayDate();

    const count = await dbGet(
      teacherDb,
      `SELECT COUNT(*) as count FROM attendance WHERE date = ?`,
      [date]
    );

    res.json({
      message: 'Attendance data loaded from attendance-checker',
      count: count.count,
      date: date,
      note: 'This is read-only data from the attendance tracking system'
    });
  } catch (error) {
    console.error('Error syncing attendance:', error);
    res.status(500).json({ error: 'Failed to sync attendance' });
  }
});

// Get detailed view with class assignments
app.get('/api/attendance/detailed', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    const rows = await dbAll(
      teacherDb,
      `SELECT
        a.teacher_name,
        a.status,
        a.start_time,
        a.end_time,
        a.late_reason,
        a.absent_reason,
        GROUP_CONCAT(c.class_slot) as class_slots,
        GROUP_CONCAT(c.substitute_teacher_name) as substitutes
       FROM attendance a
       LEFT JOIN class_assignments c ON a.id = c.attendance_id
       WHERE a.date = ?
       GROUP BY a.id
       ORDER BY a.teacher_name`,
      [date]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching detailed attendance:', error);
    res.status(500).json({ error: 'Failed to fetch detailed attendance' });
  }
});

// ============================================
// STUDENT ATTENDANCE ENDPOINTS
// ============================================

// Get student attendance by timeslot
app.get('/api/students/attendance/by-timeslot', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    // Step 1: Fetch ALL active students from student-attendance-checker's Notion API
    let allStudents = [];
    try {
      const studentsResponse = await fetch(`${STUDENT_ATTENDANCE_API}/students`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        allStudents = studentsData.students || [];
        console.log(`✅ Fetched ${allStudents.length} students from Notion`);
      } else {
        console.error('❌ Failed to fetch students from student-attendance-checker');
      }
    } catch (fetchError) {
      console.error('❌ Error fetching students from student-attendance-checker:', fetchError.message);
      // Continue with database-only data if fetch fails
    }

    // Step 2: Fetch marked attendance from database
    const rows = await dbAll(
      studentDb,
      `SELECT
        student_id,
        student_name,
        status,
        start_time,
        timestamp,
        is_active,
        late_reason,
        absent_reason
       FROM attendance
       WHERE date = ?`,
      [date]
    );

    // Create a map of marked attendance by student_id
    const attendanceMap = {};
    rows.forEach(row => {
      attendanceMap[row.student_id] = {
        name: row.student_name,
        status: row.status,
        timestamp: row.timestamp,
        start_time: row.start_time,
        is_active: row.is_active,
        late_reason: row.late_reason,
        absent_reason: row.absent_reason
      };
    });

    // Step 3: Group ALL students by time slot (8am to 8pm - all hours for future-proofing)
    const timeSlots = {};
    const timeSlotOrder = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm'];

    // Initialize all time slots
    timeSlotOrder.forEach(slot => {
      timeSlots[slot] = [];
    });

    // Group students by their scheduled start_time
    allStudents.forEach(student => {
      const startTime = student.startTime ? student.startTime.toLowerCase() : ''; // Normalize to lowercase e.g., '8am', '10am'

      if (startTime && timeSlots[startTime] !== undefined) {
        // Check if student has been marked in attendance
        const attendance = attendanceMap[student.id];

        // Skip students that are marked as inactive (not applicable for today)
        if (attendance && attendance.is_active === 0) {
          return; // Skip this student - don't show in display
        }

        timeSlots[startTime].push({
          id: student.id,
          name: student.name,
          status: attendance ? attendance.status : 'unmarked',
          timestamp: attendance ? attendance.timestamp : null,
          late_reason: attendance ? attendance.late_reason : null,
          absent_reason: attendance ? attendance.absent_reason : null
        });
      }
    });

    res.json({
      date: date,
      timeSlots: timeSlots,
      order: timeSlotOrder,
      totalStudents: allStudents.length,
      markedStudents: rows.length
    });
  } catch (error) {
    console.error('Error fetching student attendance by timeslot:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance by timeslot' });
  }
});

// Get student attendance statistics
app.get('/api/students/attendance/stats', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    // Fetch total active students from Notion
    let totalActiveStudents = 0;
    try {
      const studentsResponse = await fetch(`${STUDENT_ATTENDANCE_API}/students`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        totalActiveStudents = studentsData.students?.length || 0;
      }
    } catch (fetchError) {
      console.error('Error fetching students count:', fetchError.message);
    }

    const rows = await dbAll(
      studentDb,
      `SELECT status, COUNT(*) as count
       FROM attendance
       WHERE date = ?
       GROUP BY status`,
      [date]
    );

    // Map statuses and calculate totals
    let checked_in = 0;
    let absent = 0;
    let marked = 0;

    rows.forEach(row => {
      marked += row.count;
      if (row.status === 'present' || row.status === 'late') {
        checked_in += row.count;
      } else if (row.status === 'absent') {
        absent += row.count;
      }
    });

    // Calculate late (unmarked students)
    const late = totalActiveStudents - marked;

    res.json({
      checked_in: checked_in.toString(),
      checked_out: late.toString(), // Renamed to show unmarked/late students
      absent: absent.toString(),
      total: totalActiveStudents.toString()
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  teacherDb.close((err) => {
    if (err) {
      console.error('Error closing teacher database:', err.message);
    } else {
      console.log('Closed teacher database connection.');
    }
  });

  studentDb.close((err) => {
    if (err) {
      console.error('Error closing student database:', err.message);
    } else {
      console.log('Closed student database connection.');
    }
  });

  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Teacher & Student Attendance Display Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`👨‍🏫 Teacher Database: ${TEACHER_ATTENDANCE_DB_PATH}`);
  console.log(`👨‍🎓 Student Database: ${STUDENT_ATTENDANCE_DB_PATH}`);
  console.log(`📖 Read-only mode: Displaying data from attendance-checker apps`);
});
