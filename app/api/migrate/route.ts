import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/migrate
 * Runs database migrations for the meetings feature.
 * Call this once to set up the required tables.
 */
export async function POST() {
  try {
    await pool.query(`
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
    `);

    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error?.message || 'Migration failed' }, { status: 500 });
  }
}
