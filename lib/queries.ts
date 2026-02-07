import { query, queryOne } from '@/lib/db';
import {
  User, Course, Lesson, LessonAttachment, Quiz, QuizQuestion,
  CourseEnrollment, LessonProgress, QuizAttempt, CourseReview,
  Tag, ReportingDashboardRow,
} from './types';

// =====================================================
// USER QUERIES
// =====================================================
export async function getUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, email, password_hash, first_name, last_name, avatar_url, roles,
            total_points, current_badge, is_active, email_verified,
            email_verified_at::text, last_login_at::text,
            created_at::text, updated_at::text, deleted_at::text
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    `SELECT id, email, password_hash, first_name, last_name, avatar_url, roles,
            total_points, current_badge, is_active, email_verified,
            email_verified_at::text, last_login_at::text,
            created_at::text, updated_at::text, deleted_at::text
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
}

export async function getInstructors(): Promise<Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'roles'>[]> {
  return query(
    `SELECT id, first_name, last_name, email, roles
     FROM users
     WHERE (roles @> ARRAY['instructor']::user_role[] OR roles @> ARRAY['admin']::user_role[])
     AND deleted_at IS NULL AND is_active = true
     ORDER BY first_name, last_name`,
  );
}

// =====================================================
// TAG QUERIES
// =====================================================
export async function getAllTags(): Promise<Tag[]> {
  return query<Tag>(
    `SELECT id, name, slug, description, color, usage_count,
            created_at::text, updated_at::text
     FROM tags ORDER BY name`
  );
}

// =====================================================
// COURSE QUERIES
// =====================================================
export async function getAllCourses(): Promise<Course[]> {
  return query<Course>(
    `SELECT id, title, slug, short_description, full_description, cover_image_url,
            visibility, access_rule, price::float, currency, status,
            published_at::text, created_by, course_admin_id, tags, website_url,
            views_count, total_lessons_count, total_duration_minutes,
            average_rating::float, total_reviews_count,
            created_at::text, updated_at::text, deleted_at::text
     FROM courses WHERE deleted_at IS NULL
     ORDER BY created_at DESC`
  );
}

export async function getPublishedCourses(): Promise<Course[]> {
  return query<Course>(
    `SELECT id, title, slug, short_description, full_description, cover_image_url,
            visibility, access_rule, price::float, currency, status,
            published_at::text, created_by, course_admin_id, tags, website_url,
            views_count, total_lessons_count, total_duration_minutes,
            average_rating::float, total_reviews_count,
            created_at::text, updated_at::text, deleted_at::text
     FROM courses WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY published_at DESC`
  );
}

export async function getCourseById(id: string): Promise<Course | null> {
  return queryOne<Course>(
    `SELECT id, title, slug, short_description, full_description, cover_image_url,
            visibility, access_rule, price::float, currency, status,
            published_at::text, created_by, course_admin_id, tags, website_url,
            views_count, total_lessons_count, total_duration_minutes,
            average_rating::float, total_reviews_count,
            created_at::text, updated_at::text, deleted_at::text
     FROM courses WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return queryOne<Course>(
    `SELECT id, title, slug, short_description, full_description, cover_image_url,
            visibility, access_rule, price::float, currency, status,
            published_at::text, created_by, course_admin_id, tags, website_url,
            views_count, total_lessons_count, total_duration_minutes,
            average_rating::float, total_reviews_count,
            created_at::text, updated_at::text, deleted_at::text
     FROM courses WHERE slug = $1 AND deleted_at IS NULL`,
    [slug]
  );
}

export async function getEnrollmentCount(courseId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM course_enrollments WHERE course_id = $1`,
    [courseId]
  );
  return parseInt(result?.count || '0');
}

export async function getCoursesWithEnrollmentCounts(): Promise<(Course & { enrollment_count: number })[]> {
  return query(
    `SELECT c.id, c.title, c.slug, c.short_description, c.full_description, c.cover_image_url,
            c.visibility, c.access_rule, c.price::float, c.currency, c.status,
            c.published_at::text, c.created_by, c.course_admin_id, c.tags, c.website_url,
            c.views_count, c.total_lessons_count, c.total_duration_minutes,
            c.average_rating::float, c.total_reviews_count,
            c.created_at::text, c.updated_at::text, c.deleted_at::text,
            COUNT(DISTINCT e.id)::int as enrollment_count
     FROM courses c
     LEFT JOIN course_enrollments e ON c.id = e.course_id
     WHERE c.status = 'published' AND c.deleted_at IS NULL
     GROUP BY c.id
     ORDER BY c.published_at DESC`
  );
}

// =====================================================
// LESSON QUERIES
// =====================================================
export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  return query<Lesson>(
    `SELECT id, course_id, title, description, lesson_type, sequence_order,
            responsible_user_id, video_url, video_duration_minutes,
            document_url, document_filename, document_size_bytes::int,
            document_allow_download, image_url, image_filename, image_allow_download,
            quiz_id, is_active,
            created_at::text, updated_at::text, deleted_at::text
     FROM lessons WHERE course_id = $1 AND deleted_at IS NULL
     ORDER BY sequence_order ASC`,
    [courseId]
  );
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  return queryOne<Lesson>(
    `SELECT id, course_id, title, description, lesson_type, sequence_order,
            responsible_user_id, video_url, video_duration_minutes,
            document_url, document_filename, document_size_bytes::int,
            document_allow_download, image_url, image_filename, image_allow_download,
            quiz_id, is_active,
            created_at::text, updated_at::text, deleted_at::text
     FROM lessons WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function getLessonAttachments(lessonId: string): Promise<LessonAttachment[]> {
  return query<LessonAttachment>(
    `SELECT id, lesson_id, title, attachment_type, file_url, file_name,
            file_size_bytes::int, external_url, sequence_order,
            created_at::text, updated_at::text
     FROM lesson_attachments WHERE lesson_id = $1
     ORDER BY sequence_order ASC`,
    [lessonId]
  );
}

// =====================================================
// QUIZ QUERIES
// =====================================================
export async function getCourseQuizzes(courseId: string): Promise<Quiz[]> {
  return query<Quiz>(
    `SELECT id, course_id, title, description,
            points_first_attempt, points_second_attempt, points_third_attempt, points_fourth_plus_attempt,
            allow_multiple_attempts, passing_percentage, time_limit_minutes,
            randomize_questions, randomize_options,
            created_at::text, updated_at::text, deleted_at::text
     FROM quizzes WHERE course_id = $1 AND deleted_at IS NULL`,
    [courseId]
  );
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  return queryOne<Quiz>(
    `SELECT id, course_id, title, description,
            points_first_attempt, points_second_attempt, points_third_attempt, points_fourth_plus_attempt,
            allow_multiple_attempts, passing_percentage, time_limit_minutes,
            randomize_questions, randomize_options,
            created_at::text, updated_at::text, deleted_at::text
     FROM quizzes WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
}

export async function getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  return query<QuizQuestion>(
    `SELECT id, quiz_id, question_text, sequence_order, options,
            correct_answer_ids, explanation, points,
            created_at::text, updated_at::text, deleted_at::text
     FROM quiz_questions WHERE quiz_id = $1 AND deleted_at IS NULL
     ORDER BY sequence_order ASC`,
    [quizId]
  );
}

// =====================================================
// ENROLLMENT QUERIES
// =====================================================
export async function getUserEnrollment(userId: string, courseId: string): Promise<CourseEnrollment | null> {
  return queryOne<CourseEnrollment>(
    `SELECT id, user_id, course_id, status,
            enrolled_at::text, started_at::text, completed_at::text,
            total_lessons, completed_lessons, completion_percentage::float,
            total_time_spent_minutes, last_accessed_at::text, last_lesson_id,
            payment_status, payment_amount::float, payment_currency, payment_transaction_id,
            payment_date::text, invited_by, invitation_sent_at::text,
            created_at::text, updated_at::text
     FROM course_enrollments WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId]
  );
}

export async function getUserEnrollments(userId: string): Promise<CourseEnrollment[]> {
  return query<CourseEnrollment>(
    `SELECT id, user_id, course_id, status,
            enrolled_at::text, started_at::text, completed_at::text,
            total_lessons, completed_lessons, completion_percentage::float,
            total_time_spent_minutes, last_accessed_at::text, last_lesson_id,
            payment_status, payment_amount::float, payment_currency, payment_transaction_id,
            payment_date::text, invited_by, invitation_sent_at::text,
            created_at::text, updated_at::text
     FROM course_enrollments WHERE user_id = $1
     ORDER BY enrolled_at DESC`,
    [userId]
  );
}

export async function getEnrolledCourses(userId: string): Promise<(CourseEnrollment & { course: Course })[]> {
  const rows = await query<CourseEnrollment & {
    c_id: string; c_title: string; c_slug: string; c_short_description: string;
    c_cover_image_url: string; c_tags: string[]; c_total_lessons_count: number;
    c_total_duration_minutes: number; c_average_rating: number; c_status: string;
  }>(
    `SELECT e.id, e.user_id, e.course_id, e.status,
            e.enrolled_at::text, e.started_at::text, e.completed_at::text,
            e.total_lessons, e.completed_lessons, e.completion_percentage::float,
            e.total_time_spent_minutes, e.last_accessed_at::text, e.last_lesson_id,
            e.payment_status, e.payment_amount::float, e.payment_currency, e.payment_transaction_id,
            e.payment_date::text, e.invited_by, e.invitation_sent_at::text,
            e.created_at::text, e.updated_at::text,
            c.id as c_id, c.title as c_title, c.slug as c_slug,
            c.short_description as c_short_description,
            c.cover_image_url as c_cover_image_url, c.tags as c_tags,
            c.total_lessons_count as c_total_lessons_count,
            c.total_duration_minutes as c_total_duration_minutes,
            c.average_rating::float as c_average_rating,
            c.status as c_status
     FROM course_enrollments e
     JOIN courses c ON e.course_id = c.id
     WHERE e.user_id = $1 AND c.deleted_at IS NULL
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  return rows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id,
    status: row.status,
    enrolled_at: row.enrolled_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    total_lessons: row.total_lessons,
    completed_lessons: row.completed_lessons,
    completion_percentage: row.completion_percentage,
    total_time_spent_minutes: row.total_time_spent_minutes,
    last_accessed_at: row.last_accessed_at,
    last_lesson_id: row.last_lesson_id,
    payment_status: row.payment_status,
    payment_amount: row.payment_amount,
    payment_currency: row.payment_currency,
    payment_transaction_id: row.payment_transaction_id,
    payment_date: row.payment_date,
    invited_by: row.invited_by,
    invitation_sent_at: row.invitation_sent_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    course: {
      id: row.c_id,
      title: row.c_title,
      slug: row.c_slug,
      short_description: row.c_short_description,
      cover_image_url: row.c_cover_image_url,
      tags: row.c_tags || [],
      total_lessons_count: row.c_total_lessons_count,
      total_duration_minutes: row.c_total_duration_minutes,
      average_rating: row.c_average_rating,
      status: row.c_status,
    } as Course,
  }));
}

// =====================================================
// LESSON PROGRESS QUERIES
// =====================================================
export async function getUserLessonProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
  return query<LessonProgress>(
    `SELECT id, user_id, lesson_id, course_id, enrollment_id,
            is_completed, completed_at::text, time_spent_minutes,
            first_accessed_at::text, last_accessed_at::text,
            video_progress_percentage::float,
            created_at::text, updated_at::text
     FROM lesson_progress
     WHERE user_id = $1 AND course_id = $2`,
    [userId, courseId]
  );
}

// =====================================================
// QUIZ ATTEMPT QUERIES
// =====================================================
export async function getUserQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
  return query<QuizAttempt>(
    `SELECT id, user_id, quiz_id, enrollment_id, attempt_number,
            total_questions, correct_answers, score_percentage::float,
            points_earned, started_at::text, completed_at::text,
            time_taken_minutes, is_completed, passed,
            created_at::text, updated_at::text
     FROM quiz_attempts
     WHERE user_id = $1 AND quiz_id = $2
     ORDER BY attempt_number ASC`,
    [userId, quizId]
  );
}

// =====================================================
// REVIEW QUERIES
// =====================================================
export async function getCourseReviews(courseId: string): Promise<(CourseReview & { user: Pick<User, 'first_name' | 'last_name'> })[]> {
  const rows = await query<CourseReview & { user_first_name: string; user_last_name: string }>(
    `SELECT r.id, r.user_id, r.course_id, r.enrollment_id,
            r.rating, r.review_text, r.is_approved, r.is_featured,
            r.helpful_count, r.created_at::text, r.updated_at::text,
            r.deleted_at::text,
            u.first_name as user_first_name, u.last_name as user_last_name
     FROM course_reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.course_id = $1 AND r.is_approved = true AND r.deleted_at IS NULL
     ORDER BY r.created_at DESC`,
    [courseId]
  );

  return rows.map((row: any) => ({
    ...row,
    user: {
      first_name: row.user_first_name,
      last_name: row.user_last_name,
    },
  }));
}

// =====================================================
// REPORTING QUERIES
// =====================================================
export async function getReportingData(): Promise<ReportingDashboardRow[]> {
  return query<ReportingDashboardRow>(
    `SELECT enrollment_id, course_id, course_name, course_slug,
            user_id, participant_name, participant_email,
            status, enrolled_at::text, started_at::text, completed_at::text,
            total_lessons, completed_lessons, completion_percentage::float,
            total_time_spent_minutes, status_display
     FROM vw_reporting_dashboard
     ORDER BY enrolled_at DESC`
  );
}
