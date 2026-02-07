-- Migration: Instructor status + meeting rooms for Daily WebRTC integration

CREATE TABLE IF NOT EXISTS instructor_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_name VARCHAR(255) NOT NULL UNIQUE,
  room_url TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_meeting_rooms_instructor ON meeting_rooms(instructor_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_student ON meeting_rooms(student_id, status);
