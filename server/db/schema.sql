-- Teacher Attendance Tracking Table
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id SERIAL PRIMARY KEY,
  teacher_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('absent', 'checked_in', 'checked_out')),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_name, date)
);

-- Index for fast lookups by date
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(date);

-- Index for fast lookups by status
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_status ON teacher_attendance(status);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_teacher_attendance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at timestamp
DROP TRIGGER IF EXISTS update_teacher_attendance_timestamp_trigger ON teacher_attendance;
CREATE TRIGGER update_teacher_attendance_timestamp_trigger
BEFORE UPDATE ON teacher_attendance
FOR EACH ROW
EXECUTE FUNCTION update_teacher_attendance_timestamp();
