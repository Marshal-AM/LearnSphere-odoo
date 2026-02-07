-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- CUSTOM TYPES (ENUMS)
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'learner');

CREATE TYPE course_visibility AS ENUM ('everyone', 'signed_in');

CREATE TYPE course_access_rule AS ENUM ('open', 'on_invitation', 'on_payment');

CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE lesson_type AS ENUM ('video', 'document', 'image', 'quiz');

CREATE TYPE attachment_type AS ENUM ('file', 'link');

CREATE TYPE learner_course_status AS ENUM ('yet_to_start', 'in_progress', 'completed');

CREATE TYPE badge_level AS ENUM ('newbie', 'explorer', 'achiever', 'specialist', 'expert', 'master');

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Reasoning: Central table for all user types (admin, instructor, learner)
-- Using role-based access instead of separate tables for simplicity
-- Supports multiple roles per user via array type

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Bcrypt/Argon2 hash
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT, -- Profile picture
    roles user_role[] NOT NULL DEFAULT ARRAY['learner']::user_role[], -- User can have multiple roles
    total_points INTEGER NOT NULL DEFAULT 0, -- Gamification: total points earned
    current_badge badge_level NOT NULL DEFAULT 'newbie', -- Auto-calculated based on points
    is_active BOOLEAN NOT NULL DEFAULT true, -- Account active/suspended
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP -- Soft delete
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_roles ON users USING GIN(roles); -- GIN index for array queries
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_badge ON users(current_badge);

-- =====================================================
-- COURSES TABLE
-- =====================================================
-- Reasoning: Core entity for the platform
-- Stores all course metadata and configuration

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly version of title
    short_description TEXT, -- For course cards
    full_description TEXT, -- For course detail page (Description tab)
    cover_image_url TEXT,
    
    -- Access Control
    visibility course_visibility NOT NULL DEFAULT 'everyone',
    access_rule course_access_rule NOT NULL DEFAULT 'open',
    price DECIMAL(10, 2), -- Only required when access_rule = 'on_payment'
    currency VARCHAR(3) DEFAULT 'USD', -- ISO currency code
    
    -- Publishing
    status course_status NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP, -- When course was published
    
    -- Ownership & Management
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_admin_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Course responsible person
    
    -- Metadata
    tags TEXT[], -- Array of tags for categorization
    website_url TEXT, -- Required when published
    views_count INTEGER NOT NULL DEFAULT 0, -- Track course views
    
    -- Calculated fields (denormalized for performance)
    total_lessons_count INTEGER NOT NULL DEFAULT 0,
    total_duration_minutes INTEGER NOT NULL DEFAULT 0, -- Sum of all video lesson durations
    average_rating DECIMAL(3, 2) DEFAULT 0.00, -- Cached from reviews
    total_reviews_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_price_when_payment CHECK (
        (access_rule = 'on_payment' AND price IS NOT NULL AND price > 0) OR
        (access_rule != 'on_payment')
    ),
    CONSTRAINT check_website_when_published CHECK (
        (status = 'published' AND website_url IS NOT NULL) OR
        (status != 'published')
    ),
    CONSTRAINT check_rating_range CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- Indexes for courses
CREATE INDEX idx_courses_slug ON courses(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_status ON courses(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_visibility ON courses(visibility);
CREATE INDEX idx_courses_created_by ON courses(created_by);
CREATE INDEX idx_courses_admin ON courses(course_admin_id);
CREATE INDEX idx_courses_tags ON courses USING GIN(tags); -- GIN for array search
CREATE INDEX idx_courses_published_at ON courses(published_at) WHERE status = 'published';
-- Full-text search index for course titles
CREATE INDEX idx_courses_title_trgm ON courses USING GIN(title gin_trgm_ops);

-- =====================================================
-- LESSONS TABLE
-- =====================================================
-- Reasoning: Lessons are the content units within courses
-- Supports multiple content types with type-specific fields
-- Sequence order is crucial for learning flow

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT, -- Shown at top of player
    lesson_type lesson_type NOT NULL,
    sequence_order INTEGER NOT NULL, -- Order within course (1, 2, 3...)
    
    -- Ownership
    responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Type-specific fields (only relevant fields are populated based on lesson_type)
    
    -- For VIDEO type
    video_url TEXT, -- YouTube/Google Drive/Vimeo URL
    video_duration_minutes INTEGER, -- Duration in minutes
    
    -- For DOCUMENT type
    document_url TEXT, -- File storage URL
    document_filename VARCHAR(255),
    document_size_bytes BIGINT,
    document_allow_download BOOLEAN DEFAULT true,
    
    -- For IMAGE type
    image_url TEXT,
    image_filename VARCHAR(255),
    image_allow_download BOOLEAN DEFAULT true,
    
    -- For QUIZ type (reference to quiz)
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL, -- Forward reference, will create quizzes table next
    
    is_active BOOLEAN NOT NULL DEFAULT true, -- Can disable without deleting
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    -- Ensure unique sequence per course
    CONSTRAINT unique_lesson_sequence UNIQUE(course_id, sequence_order),
    
    -- Type-specific validation
    CONSTRAINT check_video_fields CHECK (
        (lesson_type = 'video' AND video_url IS NOT NULL AND video_duration_minutes IS NOT NULL) OR
        (lesson_type != 'video')
    ),
    CONSTRAINT check_document_fields CHECK (
        (lesson_type = 'document' AND document_url IS NOT NULL) OR
        (lesson_type != 'document')
    ),
    CONSTRAINT check_image_fields CHECK (
        (lesson_type = 'image' AND image_url IS NOT NULL) OR
        (lesson_type != 'image')
    ),
    CONSTRAINT check_quiz_fields CHECK (
        (lesson_type = 'quiz' AND quiz_id IS NOT NULL) OR
        (lesson_type != 'quiz')
    )
);

-- Indexes for lessons
CREATE INDEX idx_lessons_course ON lessons(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_type ON lessons(lesson_type);
CREATE INDEX idx_lessons_sequence ON lessons(course_id, sequence_order);
CREATE INDEX idx_lessons_quiz ON lessons(quiz_id) WHERE quiz_id IS NOT NULL;

-- =====================================================
-- LESSON ATTACHMENTS TABLE
-- =====================================================
-- Reasoning: Lessons can have multiple additional resources
-- Separate table for flexibility (one-to-many relationship)

CREATE TABLE lesson_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    attachment_type attachment_type NOT NULL,
    
    -- For FILE type
    file_url TEXT,
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    
    -- For LINK type
    external_url TEXT,
    
    sequence_order INTEGER NOT NULL DEFAULT 1, -- Order of attachments
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_file_attachment CHECK (
        (attachment_type = 'file' AND file_url IS NOT NULL) OR
        (attachment_type != 'file')
    ),
    CONSTRAINT check_link_attachment CHECK (
        (attachment_type = 'link' AND external_url IS NOT NULL) OR
        (attachment_type != 'link')
    )
);

CREATE INDEX idx_attachments_lesson ON lesson_attachments(lesson_id);
CREATE INDEX idx_attachments_order ON lesson_attachments(lesson_id, sequence_order);

-- =====================================================
-- QUIZZES TABLE
-- =====================================================
-- Reasoning: Quizzes are reusable entities linked to courses
-- Store reward configuration for attempt-based scoring

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Reward points based on attempt number
    points_first_attempt INTEGER NOT NULL DEFAULT 10,
    points_second_attempt INTEGER NOT NULL DEFAULT 7,
    points_third_attempt INTEGER NOT NULL DEFAULT 5,
    points_fourth_plus_attempt INTEGER NOT NULL DEFAULT 2,
    
    -- Quiz settings
    allow_multiple_attempts BOOLEAN NOT NULL DEFAULT true,
    passing_percentage INTEGER DEFAULT 70, -- Future: pass/fail logic
    time_limit_minutes INTEGER, -- Optional time limit
    
    -- Randomization (future feature)
    randomize_questions BOOLEAN NOT NULL DEFAULT false,
    randomize_options BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT check_passing_percentage CHECK (passing_percentage >= 0 AND passing_percentage <= 100)
);

CREATE INDEX idx_quizzes_course ON quizzes(course_id) WHERE deleted_at IS NULL;

-- =====================================================
-- QUIZ QUESTIONS TABLE
-- =====================================================
-- Reasoning: Questions belong to quizzes
-- Using JSONB for options provides flexibility for various question types
-- Supports single and multiple correct answers

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    sequence_order INTEGER NOT NULL, -- Question 1, 2, 3...
    
    -- Options stored as JSONB array
    -- Format: [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}, ...]
    options JSONB NOT NULL,
    
    -- Correct answers stored as array of option IDs
    -- Example: ["a", "c"] for multiple correct answers
    correct_answer_ids TEXT[] NOT NULL,
    
    -- Optional fields
    explanation TEXT, -- Explanation shown after answering (future feature)
    points INTEGER DEFAULT 1, -- Points for this specific question (future feature)
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_question_sequence UNIQUE(quiz_id, sequence_order),
    CONSTRAINT check_has_options CHECK (jsonb_array_length(options) >= 2),
    CONSTRAINT check_has_correct_answers CHECK (array_length(correct_answer_ids, 1) >= 1)
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_sequence ON quiz_questions(quiz_id, sequence_order);
CREATE INDEX idx_questions_options ON quiz_questions USING GIN(options); -- GIN for JSONB

-- =====================================================
-- COURSE ENROLLMENTS TABLE
-- =====================================================
-- Reasoning: Junction table between users and courses
-- Tracks enrollment status, dates, and overall progress
-- This is the master record for "user is taking this course"

CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    
    -- Enrollment tracking
    status learner_course_status NOT NULL DEFAULT 'yet_to_start',
    enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP, -- When user started first lesson
    completed_at TIMESTAMP, -- When user completed all lessons
    
    -- Progress tracking (denormalized for performance)
    total_lessons INTEGER NOT NULL DEFAULT 0, -- Total lessons in course (cached)
    completed_lessons INTEGER NOT NULL DEFAULT 0, -- Lessons completed by user
    completion_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 0.00 to 100.00
    
    -- Time tracking
    total_time_spent_minutes INTEGER NOT NULL DEFAULT 0, -- Total learning time
    last_accessed_at TIMESTAMP, -- Last time user accessed this course
    last_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL, -- Resume from here
    
    -- Payment (if access_rule = 'on_payment')
    payment_status VARCHAR(50), -- 'pending', 'completed', 'failed', 'refunded'
    payment_amount DECIMAL(10, 2),
    payment_currency VARCHAR(3),
    payment_transaction_id VARCHAR(255),
    payment_date TIMESTAMP,
    
    -- Invitation (if access_rule = 'on_invitation')
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invitation_sent_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- A user can only enroll once per course
    CONSTRAINT unique_enrollment UNIQUE(user_id, course_id),
    
    CONSTRAINT check_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    CONSTRAINT check_completed_lessons CHECK (completed_lessons <= total_lessons),
    CONSTRAINT check_status_dates CHECK (
        (status = 'yet_to_start' AND started_at IS NULL AND completed_at IS NULL) OR
        (status = 'in_progress' AND started_at IS NOT NULL AND completed_at IS NULL) OR
        (status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL)
    )
);

CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_enrollments_user_status ON course_enrollments(user_id, status);
CREATE INDEX idx_enrollments_invited_by ON course_enrollments(invited_by) WHERE invited_by IS NOT NULL;
CREATE INDEX idx_enrollments_payment_status ON course_enrollments(payment_status) WHERE payment_status IS NOT NULL;

-- =====================================================
-- LESSON PROGRESS TABLE
-- =====================================================
-- Reasoning: Granular tracking of each lesson's completion status
-- Allows tracking time spent per lesson
-- One record per user per lesson

CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE, -- Denormalized for faster queries
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    
    -- Progress tracking
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP,
    
    -- Time tracking
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    first_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Video-specific tracking (future feature)
    video_progress_percentage DECIMAL(5, 2) DEFAULT 0.00, -- How much of video watched
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- One progress record per user per lesson
    CONSTRAINT unique_lesson_progress UNIQUE(user_id, lesson_id),
    
    CONSTRAINT check_video_progress CHECK (video_progress_percentage >= 0 AND video_progress_percentage <= 100)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_completed ON lesson_progress(is_completed);
CREATE INDEX idx_lesson_progress_user_course ON lesson_progress(user_id, course_id);

-- =====================================================
-- QUIZ ATTEMPTS TABLE
-- =====================================================
-- Reasoning: Track each attempt a user makes on a quiz
-- Stores answers and calculates points based on attempt number
-- Allows multiple attempts per user per quiz

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    
    -- Attempt tracking
    attempt_number INTEGER NOT NULL, -- 1, 2, 3, 4...
    
    -- Results
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 0.00 to 100.00
    points_earned INTEGER NOT NULL DEFAULT 0, -- Based on attempt number and quiz reward config
    
    -- Timing
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    time_taken_minutes INTEGER, -- Calculated: completed_at - started_at
    
    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT false,
    passed BOOLEAN, -- Based on passing_percentage (future feature)
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_score_percentage CHECK (score_percentage >= 0 AND score_percentage <= 100),
    CONSTRAINT check_correct_answers CHECK (correct_answers <= total_questions),
    CONSTRAINT check_attempt_number CHECK (attempt_number > 0)
);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(is_completed);
CREATE INDEX idx_quiz_attempts_number ON quiz_attempts(user_id, quiz_id, attempt_number);

-- =====================================================
-- QUIZ ANSWERS TABLE
-- =====================================================
-- Reasoning: Store user's answer for each question in each attempt
-- Allows review of what user selected
-- Enables detailed analytics

CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    
    -- User's selected answer(s)
    selected_answer_ids TEXT[] NOT NULL, -- Array of option IDs user selected
    
    -- Correctness
    is_correct BOOLEAN NOT NULL DEFAULT false,
    
    -- Timing
    answered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    time_taken_seconds INTEGER, -- Time spent on this question
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- One answer per question per attempt
    CONSTRAINT unique_quiz_answer UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_correct ON quiz_answers(is_correct);

-- =====================================================
-- COURSE REVIEWS TABLE
-- =====================================================
-- Reasoning: Users can rate and review courses
-- One review per user per course
-- Updates course average rating (denormalized in courses table)

CREATE TABLE course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL, -- 1 to 5 stars
    review_text TEXT,
    
    -- Moderation (future feature)
    is_approved BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false, -- Highlight certain reviews
    
    -- Interaction tracking
    helpful_count INTEGER NOT NULL DEFAULT 0, -- Number of "helpful" votes
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP, -- Soft delete for moderation
    
    -- One review per user per course
    CONSTRAINT unique_course_review UNIQUE(user_id, course_id),
    
    CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_reviews_user ON course_reviews(user_id);
CREATE INDEX idx_reviews_course ON course_reviews(course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON course_reviews(rating);
CREATE INDEX idx_reviews_approved ON course_reviews(is_approved) WHERE is_approved = true;
CREATE INDEX idx_reviews_created ON course_reviews(created_at DESC);

-- =====================================================
-- COURSE INVITATIONS TABLE
-- =====================================================
-- Reasoning: When access_rule = 'on_invitation', track invitations
-- Allows instructor to invite specific users
-- Tracks invitation status (pending/accepted/declined)

CREATE TABLE course_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if user doesn't exist yet
    invited_email VARCHAR(255) NOT NULL, -- Email to invite (may not be registered yet)
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Instructor who sent invitation
    
    -- Invitation details
    status invitation_status NOT NULL DEFAULT 'pending',
    invitation_message TEXT, -- Optional personal message
    
    -- Token for email verification
    invitation_token VARCHAR(255) UNIQUE NOT NULL, -- Unique token for accepting invitation
    expires_at TIMESTAMP NOT NULL, -- Invitation expiry (e.g., 7 days)
    
    -- Tracking
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate active invitations
    CONSTRAINT unique_active_invitation UNIQUE(course_id, invited_email, status)
);

CREATE INDEX idx_invitations_course ON course_invitations(course_id);
CREATE INDEX idx_invitations_user ON course_invitations(invited_user_id) WHERE invited_user_id IS NOT NULL;
CREATE INDEX idx_invitations_email ON course_invitations(invited_email);
CREATE INDEX idx_invitations_token ON course_invitations(invitation_token);
CREATE INDEX idx_invitations_status ON course_invitations(status);
CREATE INDEX idx_invitations_invited_by ON course_invitations(invited_by);

-- =====================================================
-- USER POINTS HISTORY TABLE
-- =====================================================
-- Reasoning: Audit trail for all point transactions
-- Helps debug point calculations and provides transparency
-- Enables leaderboards and analytics

CREATE TABLE user_points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Points transaction
    points_change INTEGER NOT NULL, -- Can be positive or negative
    running_total INTEGER NOT NULL, -- Total points after this transaction
    
    -- Source of points
    source_type VARCHAR(50) NOT NULL, -- 'quiz_completion', 'course_completion', 'bonus', 'penalty'
    source_id UUID, -- ID of quiz_attempt, course_enrollment, etc.
    description TEXT, -- Human-readable description
    
    -- Related entities
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_points_change CHECK (points_change != 0)
);

CREATE INDEX idx_points_history_user ON user_points_history(user_id);
CREATE INDEX idx_points_history_user_created ON user_points_history(user_id, created_at DESC);
CREATE INDEX idx_points_history_source ON user_points_history(source_type, source_id);
CREATE INDEX idx_points_history_course ON user_points_history(course_id) WHERE course_id IS NOT NULL;

-- =====================================================
-- USER BADGES TABLE
-- =====================================================
-- Reasoning: Track when users achieve each badge level
-- Allows showing badge achievement history
-- Can trigger notifications/emails

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_level badge_level NOT NULL,
    
    -- Achievement tracking
    achieved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    total_points_at_achievement INTEGER NOT NULL, -- Points user had when achieving this badge
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- One record per user per badge level
    CONSTRAINT unique_user_badge UNIQUE(user_id, badge_level)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_level ON user_badges(badge_level);
CREATE INDEX idx_user_badges_achieved ON user_badges(achieved_at DESC);

-- =====================================================
-- COURSE TAGS TABLE (Optional - for tag management)
-- =====================================================
-- Reasoning: If you want to manage tags separately with descriptions
-- Alternative: just use TEXT[] in courses table (simpler)
-- Including this for completeness, but it's optional

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI (#FF5733)
    usage_count INTEGER NOT NULL DEFAULT 0, -- How many courses use this tag
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);

-- Junction table if using separate tags table
CREATE TABLE course_tags (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (course_id, tag_id)
);

CREATE INDEX idx_course_tags_course ON course_tags(course_id);
CREATE INDEX idx_course_tags_tag ON course_tags(tag_id);

-- =====================================================
-- NOTIFICATIONS TABLE (Future feature)
-- =====================================================
-- Reasoning: Track notifications for users
-- Course published, quiz graded, new invitation, etc.

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'course_published', 'quiz_graded', 'invitation', 'badge_earned'
    
    -- Related entity
    related_entity_type VARCHAR(50), -- 'course', 'quiz', 'enrollment'
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    
    -- Action URL (where to navigate when clicked)
    action_url TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- =====================================================
-- ACTIVITY LOGS TABLE (Audit trail)
-- =====================================================
-- Reasoning: Track all important actions in the system
-- Useful for debugging, security, and compliance

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for system actions
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- 'course_created', 'lesson_completed', 'quiz_attempted'
    entity_type VARCHAR(50) NOT NULL, -- 'course', 'lesson', 'quiz', 'enrollment'
    entity_id UUID NOT NULL,
    
    -- Additional context
    description TEXT,
    metadata JSONB, -- Flexible data for action-specific details
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_metadata ON activity_logs USING GIN(metadata);

-- =====================================================
-- EMAIL QUEUE TABLE (For async email sending)
-- =====================================================
-- Reasoning: Queue emails for sending (invitations, notifications, etc.)
-- Allows retry logic and tracking

CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    
    -- Email content
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT, -- Plain text version
    
    -- Email type
    email_type VARCHAR(50) NOT NULL, -- 'invitation', 'notification', 'welcome', 'password_reset'
    
    -- Related entity
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Timestamps
    scheduled_for TIMESTAMP NOT NULL DEFAULT NOW(), -- When to send
    sent_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_to_email ON email_queue(to_email);
CREATE INDEX idx_email_queue_type ON email_queue(email_type);

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
-- Reasoning: Store platform-wide configuration
-- Points thresholds, email templates, etc.

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON system_settings(setting_key);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('badge_thresholds', '{"newbie": 0, "explorer": 40, "achiever": 60, "specialist": 80, "expert": 100, "master": 120}', 'Points required for each badge level'),
('platform_name', '"LearnSphere"', 'Platform display name'),
('support_email', '"support@learnsphere.com"', 'Support email address'),
('max_upload_size_mb', '100', 'Maximum file upload size in MB'),
('session_timeout_minutes', '60', 'User session timeout');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON quiz_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON course_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON course_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate user badge based on total points
CREATE OR REPLACE FUNCTION calculate_user_badge(p_total_points INTEGER)
RETURNS badge_level AS $$
BEGIN
    IF p_total_points >= 120 THEN RETURN 'master';
    ELSIF p_total_points >= 100 THEN RETURN 'expert';
    ELSIF p_total_points >= 80 THEN RETURN 'specialist';
    ELSIF p_total_points >= 60 THEN RETURN 'achiever';
    ELSIF p_total_points >= 40 THEN RETURN 'explorer';
    ELSE RETURN 'newbie';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update user badge when points change
CREATE OR REPLACE FUNCTION update_user_badge()
RETURNS TRIGGER AS $$
DECLARE
    new_badge badge_level;
BEGIN
    -- Calculate new badge level
    new_badge := calculate_user_badge(NEW.total_points);
    
    -- Update user's current badge if it changed
    IF new_badge != NEW.current_badge THEN
        NEW.current_badge := new_badge;
        
        -- Insert badge achievement record
        INSERT INTO user_badges (user_id, badge_level, total_points_at_achievement)
        VALUES (NEW.id, new_badge, NEW.total_points)
        ON CONFLICT (user_id, badge_level) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_badge_on_points_change 
BEFORE UPDATE OF total_points ON users 
FOR EACH ROW 
WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
EXECUTE FUNCTION update_user_badge();

-- Function: Update course denormalized fields when lessons change
CREATE OR REPLACE FUNCTION update_course_lesson_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate total lessons count and duration
    UPDATE courses
    SET 
        total_lessons_count = (
            SELECT COUNT(*) FROM lessons 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) 
            AND deleted_at IS NULL
        ),
        total_duration_minutes = (
            SELECT COALESCE(SUM(video_duration_minutes), 0) 
            FROM lessons 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id) 
            AND lesson_type = 'video' 
            AND deleted_at IS NULL
        )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_counts_on_lesson_change
AFTER INSERT OR UPDATE OR DELETE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_course_lesson_counts();

-- Function: Update course average rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_course_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    course_id_to_update UUID;
BEGIN
    course_id_to_update := COALESCE(NEW.course_id, OLD.course_id);
    
    UPDATE courses
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM course_reviews
            WHERE course_id = course_id_to_update
            AND deleted_at IS NULL
            AND is_approved = true
        ),
        total_reviews_count = (
            SELECT COUNT(*)
            FROM course_reviews
            WHERE course_id = course_id_to_update
            AND deleted_at IS NULL
            AND is_approved = true
        )
    WHERE id = course_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review_change
AFTER INSERT OR UPDATE OR DELETE ON course_reviews
FOR EACH ROW
EXECUTE FUNCTION update_course_average_rating();

-- Function: Update enrollment progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_total_lessons INTEGER;
    v_completed_lessons INTEGER;
    v_completion_percentage DECIMAL(5,2);
    v_total_time INTEGER;
    v_new_status learner_course_status;
BEGIN
    -- Get total lessons in course
    SELECT total_lessons_count INTO v_total_lessons
    FROM courses
    WHERE id = NEW.course_id;
    
    -- Count completed lessons for this enrollment
    SELECT COUNT(*) INTO v_completed_lessons
    FROM lesson_progress
    WHERE enrollment_id = NEW.enrollment_id
    AND is_completed = true;
    
    -- Calculate percentage
    v_completion_percentage := CASE 
        WHEN v_total_lessons > 0 THEN (v_completed_lessons::DECIMAL / v_total_lessons) * 100
        ELSE 0
    END;
    
    -- Sum total time spent
    SELECT COALESCE(SUM(time_spent_minutes), 0) INTO v_total_time
    FROM lesson_progress
    WHERE enrollment_id = NEW.enrollment_id;
    
    -- Determine status
    IF v_completed_lessons = 0 THEN
        v_new_status := 'yet_to_start';
    ELSIF v_completed_lessons = v_total_lessons AND v_total_lessons > 0 THEN
        v_new_status := 'completed';
    ELSE
        v_new_status := 'in_progress';
    END IF;
    
    -- Update enrollment
    UPDATE course_enrollments
    SET
        total_lessons = v_total_lessons,
        completed_lessons = v_completed_lessons,
        completion_percentage = v_completion_percentage,
        total_time_spent_minutes = v_total_time,
        status = v_new_status,
        started_at = CASE 
            WHEN started_at IS NULL AND v_new_status != 'yet_to_start' THEN NOW()
            ELSE started_at
        END,
        completed_at = CASE
            WHEN v_new_status = 'completed' AND completed_at IS NULL THEN NOW()
            WHEN v_new_status != 'completed' THEN NULL
            ELSE completed_at
        END,
        last_lesson_id = NEW.lesson_id,
        last_accessed_at = NOW()
    WHERE id = NEW.enrollment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_on_lesson_progress
AFTER INSERT OR UPDATE OF is_completed, time_spent_minutes ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_progress();

-- Function: Award points when quiz is completed
CREATE OR REPLACE FUNCTION award_quiz_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points_to_award INTEGER;
    v_quiz_rewards RECORD;
BEGIN
    -- Only process when quiz is newly completed
    IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
        
        -- Get quiz reward configuration
        SELECT 
            points_first_attempt,
            points_second_attempt,
            points_third_attempt,
            points_fourth_plus_attempt
        INTO v_quiz_rewards
        FROM quizzes
        WHERE id = NEW.quiz_id;
        
        -- Calculate points based on attempt number
        v_points_to_award := CASE
            WHEN NEW.attempt_number = 1 THEN v_quiz_rewards.points_first_attempt
            WHEN NEW.attempt_number = 2 THEN v_quiz_rewards.points_second_attempt
            WHEN NEW.attempt_number = 3 THEN v_quiz_rewards.points_third_attempt
            ELSE v_quiz_rewards.points_fourth_plus_attempt
        END;
        
        -- Update attempt record with points
        NEW.points_earned := v_points_to_award;
        
        -- Add points to user's total
        UPDATE users
        SET total_points = total_points + v_points_to_award
        WHERE id = NEW.user_id;
        
        -- Log points transaction
        INSERT INTO user_points_history (
            user_id,
            points_change,
            running_total,
            source_type,
            source_id,
            description,
            quiz_id
        )
        SELECT
            NEW.user_id,
            v_points_to_award,
            u.total_points,
            'quiz_completion',
            NEW.id,
            'Earned ' || v_points_to_award || ' points for completing quiz (attempt ' || NEW.attempt_number || ')',
            NEW.quiz_id
        FROM users u
        WHERE u.id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_points_on_quiz_completion
BEFORE UPDATE OF is_completed ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION award_quiz_points();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Reporting dashboard data
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

-- View: Course with aggregated stats
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

-- View: User dashboard (learner's courses)
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

-- View: Quiz results summary
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

-- =====================================================
-- HELPER FUNCTIONS FOR APPLICATION LOGIC
-- =====================================================

-- Function: Check if user can access a course
CREATE OR REPLACE FUNCTION can_user_access_course(
    p_user_id UUID,
    p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_course RECORD;
    v_enrollment RECORD;
    v_invitation RECORD;
BEGIN
    -- Get course details
    SELECT * INTO v_course FROM courses WHERE id = p_course_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check access rule
    CASE v_course.access_rule
        WHEN 'open' THEN
            RETURN true;
        WHEN 'on_invitation' THEN
            -- Check if user has accepted invitation or is enrolled
            SELECT * INTO v_enrollment FROM course_enrollments 
            WHERE user_id = p_user_id AND course_id = p_course_id;
            
            IF FOUND THEN
                RETURN true;
            END IF;
            
            SELECT * INTO v_invitation FROM course_invitations
            WHERE course_id = p_course_id 
            AND invited_user_id = p_user_id
            AND status = 'accepted';
            
            RETURN FOUND;
        WHEN 'on_payment' THEN
            -- Check if user has paid
            SELECT * INTO v_enrollment FROM course_enrollments
            WHERE user_id = p_user_id 
            AND course_id = p_course_id
            AND payment_status = 'completed';
            
            RETURN FOUND;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get next lesson for user in a course
CREATE OR REPLACE FUNCTION get_next_lesson(
    p_user_id UUID,
    p_course_id UUID
) RETURNS UUID AS $$
DECLARE
    v_next_lesson_id UUID;
BEGIN
    -- Find first incomplete lesson in sequence order
    SELECT l.id INTO v_next_lesson_id
    FROM lessons l
    LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = p_user_id
    WHERE l.course_id = p_course_id
    AND l.deleted_at IS NULL
    AND l.is_active = true
    AND (lp.is_completed IS NULL OR lp.is_completed = false)
    ORDER BY l.sequence_order ASC
    LIMIT 1;
    
    RETURN v_next_lesson_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Enroll user in course
CREATE OR REPLACE FUNCTION enroll_user_in_course(
    p_user_id UUID,
    p_course_id UUID,
    p_invited_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_enrollment_id UUID;
    v_total_lessons INTEGER;
BEGIN
    -- Get total lessons count
    SELECT total_lessons_count INTO v_total_lessons
    FROM courses WHERE id = p_course_id;
    
    -- Create enrollment
    INSERT INTO course_enrollments (
        user_id,
        course_id,
        total_lessons,
        invited_by
    ) VALUES (
        p_user_id,
        p_course_id,
        v_total_lessons,
        p_invited_by
    )
    ON CONFLICT (user_id, course_id) DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample admin user
INSERT INTO users (email, password_hash, first_name, last_name, roles, is_active, email_verified)
VALUES 
('admin@learnsphere.com', '$2a$10$example_hash', 'Admin', 'User', ARRAY['admin', 'instructor']::user_role[], true, true);

-- =====================================================
-- GRANTS (Adjust based on your application user)
-- =====================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO learnsphere_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO learnsphere_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO learnsphere_app;