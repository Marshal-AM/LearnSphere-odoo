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

      -- Drop views that depend on these columns so we can alter them
      DROP VIEW IF EXISTS vw_courses_with_stats CASCADE;
      DROP VIEW IF EXISTS vw_user_dashboard CASCADE;
      DROP VIEW IF EXISTS vw_reporting_dashboard CASCADE;
      DROP VIEW IF EXISTS vw_quiz_results CASCADE;

      -- Allow float values for video duration
      ALTER TABLE lessons ALTER COLUMN video_duration_minutes TYPE NUMERIC USING video_duration_minutes::NUMERIC;
      ALTER TABLE courses ALTER COLUMN total_duration_minutes TYPE NUMERIC USING total_duration_minutes::NUMERIC;

      -- Recreate the views
      CREATE OR REPLACE VIEW vw_reporting_dashboard AS
      SELECT
          e.id as enrollment_id,
          c.id as course_id,
          c.title as course_name,
          c.slug as course_slug,
          u.id as user_id,
          u.first_name || ' ' || u.last_name as participant_name,
          u.email as participant_email,
          e.status,
          e.enrolled_at,
          e.started_at,
          e.completed_at,
          e.total_lessons,
          e.completed_lessons,
          e.completion_percentage,
          e.total_time_spent_minutes,
          CASE
              WHEN e.status = 'yet_to_start' THEN 'Yet to Start'
              WHEN e.status = 'in_progress' THEN 'In Progress'
              WHEN e.status = 'completed' THEN 'Completed'
          END as status_display
      FROM course_enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON e.user_id = u.id
      WHERE c.deleted_at IS NULL;

      CREATE OR REPLACE VIEW vw_courses_with_stats AS
      SELECT
          c.*,
          COUNT(DISTINCT e.id) as total_enrollments,
          COUNT(DISTINCT CASE WHEN e.status = 'yet_to_start' THEN e.id END) as enrollments_yet_to_start,
          COUNT(DISTINCT CASE WHEN e.status = 'in_progress' THEN e.id END) as enrollments_in_progress,
          COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as enrollments_completed,
          COUNT(DISTINCT l.id) as actual_lesson_count,
          COUNT(DISTINCT q.id) as quiz_count
      FROM courses c
      LEFT JOIN course_enrollments e ON c.id = e.course_id
      LEFT JOIN lessons l ON c.id = l.course_id AND l.deleted_at IS NULL
      LEFT JOIN quizzes q ON c.id = q.course_id AND q.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id;

      CREATE OR REPLACE VIEW vw_user_dashboard AS
      SELECT
          u.id as user_id,
          u.first_name || ' ' || u.last_name as user_name,
          u.total_points,
          u.current_badge,
          c.id as course_id,
          c.title as course_title,
          c.slug as course_slug,
          c.cover_image_url,
          c.short_description,
          c.tags,
          c.average_rating,
          e.status as enrollment_status,
          e.completion_percentage,
          e.last_accessed_at,
          e.last_lesson_id
      FROM users u
      LEFT JOIN course_enrollments e ON u.id = e.user_id
      LEFT JOIN courses c ON e.course_id = c.id AND c.deleted_at IS NULL
      WHERE u.deleted_at IS NULL;

      CREATE OR REPLACE VIEW vw_quiz_results AS
      SELECT
          qa.id as attempt_id,
          qa.user_id,
          u.first_name || ' ' || u.last_name as user_name,
          q.id as quiz_id,
          q.title as quiz_title,
          q.course_id,
          c.title as course_title,
          qa.attempt_number,
          qa.total_questions,
          qa.correct_answers,
          qa.score_percentage,
          qa.points_earned,
          qa.started_at,
          qa.completed_at,
          qa.time_taken_minutes,
          qa.is_completed,
          qa.passed
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE u.deleted_at IS NULL
      AND q.deleted_at IS NULL
      AND c.deleted_at IS NULL;
    `);

    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error?.message || 'Migration failed' }, { status: 500 });
  }
}
