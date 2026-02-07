// =====================================================
// TypeScript types matching PostgreSQL schema
// =====================================================

// Enums
export type UserRole = 'admin' | 'instructor' | 'learner';
export type CourseVisibility = 'everyone' | 'signed_in';
export type CourseAccessRule = 'open' | 'on_invitation' | 'on_payment';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'document' | 'image' | 'quiz';
export type AttachmentType = 'file' | 'link';
export type LearnerCourseStatus = 'yet_to_start' | 'in_progress' | 'completed';
export type BadgeLevel = 'newbie' | 'explorer' | 'achiever' | 'specialist' | 'expert' | 'master';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Users
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  roles: UserRole[];
  total_points: number;
  current_badge: BadgeLevel;
  is_active: boolean;
  email_verified: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Courses
export interface Course {
  id: string;
  title: string;
  slug: string;
  short_description?: string;
  full_description?: string;
  cover_image_url?: string;
  visibility: CourseVisibility;
  access_rule: CourseAccessRule;
  price?: number;
  currency: string;
  status: CourseStatus;
  published_at?: string;
  created_by: string;
  course_admin_id?: string;
  tags: string[];
  website_url?: string;
  views_count: number;
  total_lessons_count: number;
  total_duration_minutes: number;
  average_rating: number;
  total_reviews_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Lessons
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  lesson_type: LessonType;
  sequence_order: number;
  responsible_user_id?: string;
  video_url?: string;
  video_duration_minutes?: number;
  document_url?: string;
  document_filename?: string;
  document_size_bytes?: number;
  document_allow_download: boolean;
  image_url?: string;
  image_filename?: string;
  image_allow_download: boolean;
  quiz_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Lesson Attachments
export interface LessonAttachment {
  id: string;
  lesson_id: string;
  title: string;
  attachment_type: AttachmentType;
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  external_url?: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

// Quizzes
export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  points_first_attempt: number;
  points_second_attempt: number;
  points_third_attempt: number;
  points_fourth_plus_attempt: number;
  allow_multiple_attempts: boolean;
  passing_percentage: number;
  time_limit_minutes?: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Quiz Questions
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  sequence_order: number;
  options: QuizOption[];
  correct_answer_ids: string[];
  explanation?: string;
  points: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

// Course Enrollments
export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: LearnerCourseStatus;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  total_time_spent_minutes: number;
  last_accessed_at?: string;
  last_lesson_id?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_transaction_id?: string;
  payment_date?: string;
  invited_by?: string;
  invitation_sent_at?: string;
  created_at: string;
  updated_at: string;
}

// Lesson Progress
export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  enrollment_id: string;
  is_completed: boolean;
  completed_at?: string;
  time_spent_minutes: number;
  first_accessed_at: string;
  last_accessed_at: string;
  video_progress_percentage: number;
  created_at: string;
  updated_at: string;
}

// Quiz Attempts
export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  enrollment_id: string;
  attempt_number: number;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  points_earned: number;
  started_at: string;
  completed_at?: string;
  time_taken_minutes?: number;
  is_completed: boolean;
  passed?: boolean;
  created_at: string;
  updated_at: string;
}

// Quiz Answers
export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer_ids: string[];
  is_correct: boolean;
  answered_at: string;
  time_taken_seconds?: number;
  created_at: string;
}

// Course Reviews
export interface CourseReview {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  rating: number;
  review_text?: string;
  is_approved: boolean;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Course Invitations
export interface CourseInvitation {
  id: string;
  course_id: string;
  invited_user_id?: string;
  invited_email: string;
  invited_by: string;
  status: InvitationStatus;
  invitation_message?: string;
  invitation_token: string;
  expires_at: string;
  sent_at: string;
  accepted_at?: string;
  declined_at?: string;
  created_at: string;
  updated_at: string;
}

// User Points History
export interface UserPointsHistory {
  id: string;
  user_id: string;
  points_change: number;
  running_total: number;
  source_type: string;
  source_id?: string;
  description?: string;
  course_id?: string;
  quiz_id?: string;
  created_at: string;
}

// User Badges
export interface UserBadge {
  id: string;
  user_id: string;
  badge_level: BadgeLevel;
  achieved_at: string;
  total_points_at_achievement: number;
  created_at: string;
}

// Tags
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

// View Types (for dashboard data)
export interface ReportingDashboardRow {
  enrollment_id: string;
  course_id: string;
  course_name: string;
  course_slug: string;
  user_id: string;
  participant_name: string;
  participant_email: string;
  status: LearnerCourseStatus;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  total_time_spent_minutes: number;
  status_display: string;
}

// Badge thresholds
export const BADGE_THRESHOLDS: Record<BadgeLevel, number> = {
  newbie: 0,
  explorer: 40,
  achiever: 60,
  specialist: 80,
  expert: 100,
  master: 120,
};

export const BADGE_LABELS: Record<BadgeLevel, string> = {
  newbie: 'Newbie',
  explorer: 'Explorer',
  achiever: 'Achiever',
  specialist: 'Specialist',
  expert: 'Expert',
  master: 'Master',
};

export const BADGE_COLORS: Record<BadgeLevel, string> = {
  newbie: '#94a3b8',
  explorer: '#22c55e',
  achiever: '#3b82f6',
  specialist: '#a855f7',
  expert: '#f59e0b',
  master: '#ef4444',
};
