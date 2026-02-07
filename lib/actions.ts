'use server';

import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { slugify } from '@/lib/utils';

// =====================================================
// COURSE ACTIONS
// =====================================================
export async function createCourse(title: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const slug = slugify(title);
  const course = await queryOne<{ id: string; slug: string }>(
    `INSERT INTO courses (title, slug, created_by, course_admin_id)
     VALUES ($1, $2, $3, $3)
     RETURNING id, slug`,
    [title, slug, session.user.id]
  );
  return course;
}

export async function updateCourse(courseId: string, data: {
  title?: string;
  short_description?: string;
  full_description?: string;
  cover_image_url?: string;
  visibility?: string;
  access_rule?: string;
  price?: number | null;
  status?: string;
  website_url?: string;
  tags?: string[];
  course_admin_id?: string | null;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === 'status' && value === 'published') {
        sets.push(`status = $${idx}`, `published_at = COALESCE(published_at, NOW())`);
      } else {
        sets.push(`${key} = $${idx}`);
      }
      params.push(value);
      idx++;
    }
  }

  if (sets.length === 0) return;

  params.push(courseId);
  await query(
    `UPDATE courses SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  );
}

export async function deleteCourse(courseId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await query(
    `UPDATE courses SET deleted_at = NOW() WHERE id = $1`,
    [courseId]
  );
}

// =====================================================
// LESSON ACTIONS
// =====================================================
export async function createLesson(courseId: string, data: {
  title: string;
  lesson_type: string;
  description?: string;
  responsible_user_id?: string;
  video_url?: string;
  video_duration_minutes?: number;
  document_url?: string;
  document_filename?: string;
  document_size_bytes?: number;
  document_allow_download?: boolean;
  image_url?: string;
  image_filename?: string;
  image_allow_download?: boolean;
  quiz_id?: string;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  // Get next sequence order
  const maxSeq = await queryOne<{ max_seq: number }>(
    `SELECT COALESCE(MAX(sequence_order), 0) as max_seq FROM lessons WHERE course_id = $1 AND deleted_at IS NULL`,
    [courseId]
  );

  const lesson = await queryOne<{ id: string }>(
    `INSERT INTO lessons (course_id, title, lesson_type, sequence_order, description,
     responsible_user_id, video_url, video_duration_minutes,
     document_url, document_filename, document_size_bytes, document_allow_download,
     image_url, image_filename, image_allow_download, quiz_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING id`,
    [
      courseId, data.title, data.lesson_type, (maxSeq?.max_seq || 0) + 1,
      data.description || null, data.responsible_user_id || null,
      data.video_url || null, data.video_duration_minutes || null,
      data.document_url || null, data.document_filename || null,
      data.document_size_bytes || null, data.document_allow_download ?? true,
      data.image_url || null, data.image_filename || null,
      data.image_allow_download ?? true, data.quiz_id || null,
    ]
  );
  return lesson;
}

export async function updateLesson(lessonId: string, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sets.push(`${key} = $${idx}`);
      params.push(value);
      idx++;
    }
  }

  if (sets.length === 0) return;

  params.push(lessonId);
  await query(`UPDATE lessons SET ${sets.join(', ')} WHERE id = $${idx}`, params);
}

export async function deleteLesson(lessonId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await query(`UPDATE lessons SET deleted_at = NOW() WHERE id = $1`, [lessonId]);
}

// =====================================================
// QUIZ ACTIONS
// =====================================================
export async function createQuiz(courseId: string, data: {
  title: string;
  description?: string;
  points_first_attempt?: number;
  points_second_attempt?: number;
  points_third_attempt?: number;
  points_fourth_plus_attempt?: number;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const quiz = await queryOne<{ id: string }>(
    `INSERT INTO quizzes (course_id, title, description, points_first_attempt, points_second_attempt, points_third_attempt, points_fourth_plus_attempt)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      courseId, data.title, data.description || null,
      data.points_first_attempt || 10, data.points_second_attempt || 7,
      data.points_third_attempt || 5, data.points_fourth_plus_attempt || 2,
    ]
  );
  return quiz;
}

export async function saveQuizQuestions(quizId: string, questions: {
  id?: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer_ids: string[];
  sequence_order: number;
}[]) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  // Delete existing questions
  await query(`UPDATE quiz_questions SET deleted_at = NOW() WHERE quiz_id = $1`, [quizId]);

  // Insert new questions
  for (const q of questions) {
    await query(
      `INSERT INTO quiz_questions (quiz_id, question_text, options, correct_answer_ids, sequence_order, points)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [quizId, q.question_text, JSON.stringify(q.options), q.correct_answer_ids, q.sequence_order]
    );
  }
}

export async function deleteQuiz(quizId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await query(`UPDATE quizzes SET deleted_at = NOW() WHERE id = $1`, [quizId]);
}

// =====================================================
// ENROLLMENT ACTIONS
// =====================================================
export async function enrollInCourse(courseId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const result = await queryOne<{ id: string }>(
    `SELECT enroll_user_in_course($1, $2) as id`,
    [session.user.id, courseId]
  );
  return result;
}

// =====================================================
// LESSON PROGRESS ACTIONS
// =====================================================
export async function markLessonComplete(lessonId: string, courseId: string, enrollmentId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await query(
    `INSERT INTO lesson_progress (user_id, lesson_id, course_id, enrollment_id, is_completed, completed_at, time_spent_minutes)
     VALUES ($1, $2, $3, $4, true, NOW(), 0)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET is_completed = true, completed_at = NOW()`,
    [session.user.id, lessonId, courseId, enrollmentId]
  );
}

// =====================================================
// QUIZ ATTEMPT ACTIONS
// =====================================================
export async function submitQuizAttempt(quizId: string, enrollmentId: string, answers: Record<string, string[]>) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  // Get attempt number
  const existingCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2`,
    [session.user.id, quizId]
  );
  const attemptNumber = parseInt(existingCount?.count || '0') + 1;

  // Get questions to calculate score
  const questions = await query<{ id: string; correct_answer_ids: string[] }>(
    `SELECT id, correct_answer_ids FROM quiz_questions WHERE quiz_id = $1 AND deleted_at IS NULL`,
    [quizId]
  );

  let correctCount = 0;
  for (const q of questions) {
    const selected = answers[q.id] || [];
    const isCorrect = q.correct_answer_ids.length === selected.length &&
      q.correct_answer_ids.every((id: string) => selected.includes(id));
    if (isCorrect) correctCount++;
  }

  const scorePercentage = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

  // Get quiz passing percentage
  const quiz = await queryOne<{ passing_percentage: number }>(
    `SELECT passing_percentage FROM quizzes WHERE id = $1`,
    [quizId]
  );
  const passed = scorePercentage >= (quiz?.passing_percentage || 70);

  // Create attempt
  const attempt = await queryOne<{ id: string; points_earned: number }>(
    `INSERT INTO quiz_attempts (user_id, quiz_id, enrollment_id, attempt_number, total_questions, correct_answers, score_percentage, is_completed, passed, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW())
     RETURNING id, points_earned`,
    [session.user.id, quizId, enrollmentId, attemptNumber, questions.length, correctCount, scorePercentage, passed]
  );

  // Insert individual answers
  for (const q of questions) {
    const selected = answers[q.id] || [];
    const isCorrect = q.correct_answer_ids.length === selected.length &&
      q.correct_answer_ids.every((id: string) => selected.includes(id));
    await query(
      `INSERT INTO quiz_answers (attempt_id, question_id, selected_answer_ids, is_correct)
       VALUES ($1, $2, $3, $4)`,
      [attempt!.id, q.id, selected, isCorrect]
    );
  }

  return { attemptId: attempt!.id, correctCount, totalQuestions: questions.length, scorePercentage, passed, pointsEarned: attempt!.points_earned || 0 };
}

// =====================================================
// REVIEW ACTIONS
// =====================================================
export async function submitReview(courseId: string, enrollmentId: string, rating: number, reviewText: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await query(
    `INSERT INTO course_reviews (user_id, course_id, enrollment_id, rating, review_text)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, course_id) DO UPDATE SET rating = $4, review_text = $5`,
    [session.user.id, courseId, enrollmentId, rating, reviewText]
  );
}

// =====================================================
// INVITATION ACTIONS
// =====================================================
export async function sendInvitation(courseId: string, email: string, message?: string) {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const token = crypto.randomUUID();
  await query(
    `INSERT INTO course_invitations (course_id, invited_email, invited_by, invitation_message, invitation_token, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '14 days')`,
    [courseId, email, session.user.id, message || null, token]
  );
}

// =====================================================
// AUTH ACTIONS
// =====================================================
export async function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'learner' | 'instructor';
}) {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [data.email]
  );

  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await hash(data.password, 12);
  const roles = `{${data.role}}`;

  const user = await queryOne<{ id: string }>(
    `INSERT INTO users (email, password_hash, first_name, last_name, roles, email_verified)
     VALUES ($1, $2, $3, $4, $5::user_role[], true)
     RETURNING id`,
    [data.email, passwordHash, data.firstName, data.lastName, roles]
  );

  return user;
}

// =====================================================
// ROLE SELECTION (for Google OAuth onboarding)
// =====================================================
export async function updateUserRole(role: 'learner' | 'instructor') {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');

  await query(
    `UPDATE users SET roles = $1::user_role[] WHERE id = $2`,
    [`{${role}}`, session.user.id]
  );
}
