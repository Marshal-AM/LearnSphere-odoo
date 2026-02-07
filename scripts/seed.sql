-- =====================================================
-- LearnSphere Seed Data
-- Matches mock-data.ts exactly
-- =====================================================

-- Disable triggers for clean seeding (so status constraints don't interfere)
SET session_replication_role = 'replica';

-- =====================================================
-- USERS
-- =====================================================
-- Admin password: Admin123!
INSERT INTO users (id, email, password_hash, first_name, last_name, avatar_url, roles, total_points, current_badge, is_active, email_verified, email_verified_at, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@learnsphere.com', '$2b$12$UwqXH8OuV4GgcFR.zF2LNu3uR7Q3z5/Tmyla3lvvSR7HwaMmUgcF.', 'Admin', 'User', '', ARRAY['admin','instructor']::user_role[], 0, 'newbie', true, true, '2025-01-01', '2025-01-01', '2025-01-01'),
('00000000-0000-0000-0000-000000000002', 'jane.instructor@learnsphere.com', '$2b$12$UwqXH8OuV4GgcFR.zF2LNu3uR7Q3z5/Tmyla3lvvSR7HwaMmUgcF.', 'Jane', 'Smith', '', ARRAY['instructor']::user_role[], 0, 'newbie', true, true, '2025-01-05', '2025-01-05', '2025-01-05'),
('00000000-0000-0000-0000-000000000003', 'alice@learner.com', '$2b$12$UwqXH8OuV4GgcFR.zF2LNu3uR7Q3z5/Tmyla3lvvSR7HwaMmUgcF.', 'Alice', 'Johnson', '', ARRAY['learner']::user_role[], 75, 'achiever', true, true, '2025-02-01', '2025-02-01', '2025-06-15'),
('00000000-0000-0000-0000-000000000004', 'bob@learner.com', '$2b$12$UwqXH8OuV4GgcFR.zF2LNu3uR7Q3z5/Tmyla3lvvSR7HwaMmUgcF.', 'Bob', 'Williams', '', ARRAY['learner']::user_role[], 45, 'explorer', true, true, '2025-02-10', '2025-02-10', '2025-06-10'),
('00000000-0000-0000-0000-000000000005', 'charlie@learner.com', '$2b$12$UwqXH8OuV4GgcFR.zF2LNu3uR7Q3z5/Tmyla3lvvSR7HwaMmUgcF.', 'Charlie', 'Brown', '', ARRAY['learner']::user_role[], 110, 'expert', true, true, '2025-01-20', '2025-01-20', '2025-06-20'),
('00000000-0000-0000-0000-000000000006', 'diana@learner.com', '$2b$12$UwqXH8OuV4GgcFR.zF2LNu3uR7Q3z5/Tmyla3lvvSR7HwaMmUgcF.', 'Diana', 'Prince', '', ARRAY['learner']::user_role[], 20, 'newbie', true, true, '2025-03-01', '2025-03-01', '2025-05-15');

-- =====================================================
-- TAGS
-- =====================================================
INSERT INTO tags (id, name, slug, color, usage_count, created_at, updated_at) VALUES
('10000000-0000-0000-0000-000000000001', 'JavaScript', 'javascript', '#f7df1e', 3, '2025-01-01', '2025-01-01'),
('10000000-0000-0000-0000-000000000002', 'Python', 'python', '#3776ab', 2, '2025-01-01', '2025-01-01'),
('10000000-0000-0000-0000-000000000003', 'React', 'react', '#61dafb', 2, '2025-01-01', '2025-01-01'),
('10000000-0000-0000-0000-000000000004', 'Web Development', 'web-development', '#e44d26', 3, '2025-01-01', '2025-01-01'),
('10000000-0000-0000-0000-000000000005', 'Data Science', 'data-science', '#00b4d8', 1, '2025-01-01', '2025-01-01'),
('10000000-0000-0000-0000-000000000006', 'Design', 'design', '#ff6b6b', 1, '2025-01-01', '2025-01-01'),
('10000000-0000-0000-0000-000000000007', 'TypeScript', 'typescript', '#3178c6', 1, '2025-01-01', '2025-01-01');

-- =====================================================
-- COURSES
-- =====================================================
INSERT INTO courses (id, title, slug, short_description, full_description, cover_image_url, visibility, access_rule, price, currency, status, published_at, created_by, course_admin_id, tags, website_url, views_count, total_lessons_count, total_duration_minutes, average_rating, total_reviews_count, created_at, updated_at) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  'JavaScript Fundamentals',
  'javascript-fundamentals',
  'Learn the core concepts of JavaScript from scratch. Perfect for beginners who want to start their web development journey.',
  '<p>This comprehensive course covers everything you need to know about JavaScript fundamentals. From variables and data types to functions, objects, and DOM manipulation.</p><p>By the end of this course, you will be able to write clean JavaScript code and build interactive web pages.</p>',
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
  'everyone', 'open', NULL, 'USD', 'published', '2025-03-01',
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  ARRAY['JavaScript', 'Web Development'],
  'https://learnsphere.com/courses/javascript-fundamentals',
  1250, 5, 180, 4.50, 12,
  '2025-02-15', '2025-06-01'
),
(
  '20000000-0000-0000-0000-000000000002',
  'React Masterclass',
  'react-masterclass',
  'Master React.js with hooks, context, and advanced patterns. Build production-ready applications.',
  '<p>Dive deep into React.js and learn how to build modern web applications. This course covers hooks, context API, performance optimization, and testing.</p>',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
  'signed_in', 'on_payment', 49.99, 'USD', 'published', '2025-04-01',
  '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
  ARRAY['React', 'JavaScript', 'Web Development'],
  'https://learnsphere.com/courses/react-masterclass',
  890, 4, 240, 4.80, 8,
  '2025-03-10', '2025-06-10'
),
(
  '20000000-0000-0000-0000-000000000003',
  'Python for Data Science',
  'python-for-data-science',
  'Learn Python programming with a focus on data analysis, visualization, and machine learning basics.',
  '<p>A comprehensive Python course designed for aspiring data scientists. Learn pandas, numpy, matplotlib, and scikit-learn.</p>',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=400&fit=crop',
  'everyone', 'on_invitation', NULL, 'USD', 'published', '2025-05-01',
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  ARRAY['Python', 'Data Science'],
  'https://learnsphere.com/courses/python-data-science',
  650, 3, 150, 4.20, 5,
  '2025-04-15', '2025-06-15'
),
(
  '20000000-0000-0000-0000-000000000004',
  'UI/UX Design Principles',
  'ui-ux-design-principles',
  'Understand the principles of great user interface and user experience design.',
  '<p>Learn the fundamentals of UI/UX design including color theory, typography, layout, and user research methods.</p>',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
  'everyone', 'open', NULL, 'USD', 'draft', NULL,
  '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
  ARRAY['Design'], NULL,
  0, 0, 0, 0, 0,
  '2025-06-01', '2025-06-20'
),
(
  '20000000-0000-0000-0000-000000000005',
  'TypeScript Deep Dive',
  'typescript-deep-dive',
  'Go beyond the basics of TypeScript. Learn advanced types, generics, decorators, and best practices.',
  '<p>This advanced course takes your TypeScript skills to the next level with generics, conditional types, mapped types, and more.</p>',
  'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
  'signed_in', 'open', NULL, 'USD', 'published', '2025-05-15',
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  ARRAY['TypeScript', 'JavaScript', 'Web Development'],
  'https://learnsphere.com/courses/typescript-deep-dive',
  420, 3, 120, 4.60, 3,
  '2025-05-01', '2025-06-18'
);

-- =====================================================
-- QUIZZES
-- =====================================================
INSERT INTO quizzes (id, course_id, title, description, points_first_attempt, points_second_attempt, points_third_attempt, points_fourth_plus_attempt, allow_multiple_attempts, passing_percentage, randomize_questions, randomize_options, created_at, updated_at) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'JavaScript Basics Quiz', 'Test your understanding of JavaScript fundamentals.', 10, 7, 5, 2, true, 70, false, false, '2025-02-19', '2025-02-19'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'React Knowledge Check', 'Assess your React skills.', 15, 10, 7, 3, true, 70, false, false, '2025-03-16', '2025-03-16'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Python Fundamentals Quiz', 'Test your Python knowledge.', 10, 7, 5, 2, true, 60, false, false, '2025-04-19', '2025-04-19');

-- =====================================================
-- LESSONS
-- =====================================================
-- Course 1: JavaScript Fundamentals
INSERT INTO lessons (id, course_id, title, description, lesson_type, sequence_order, responsible_user_id, video_url, video_duration_minutes, document_url, document_filename, document_size_bytes, image_url, image_filename, quiz_id, is_active, created_at, updated_at) VALUES
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Introduction to JavaScript', 'Welcome to JavaScript! In this lesson, we will cover the history, setup, and your first Hello World program.', 'video', 1, '00000000-0000-0000-0000-000000000001', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 30, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-02-15', '2025-02-15'),
('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Variables and Data Types', 'Learn about var, let, const and the different data types in JavaScript.', 'video', 2, '00000000-0000-0000-0000-000000000001', 'https://www.youtube.com/watch?v=edlFjlzxkSI', 45, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-02-16', '2025-02-16'),
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Functions and Scope', 'Deep dive into functions, arrow functions, closures and scope.', 'document', 3, '00000000-0000-0000-0000-000000000001', NULL, NULL, '/docs/functions-guide.pdf', 'functions-guide.pdf', 2500000, NULL, NULL, NULL, true, '2025-02-17', '2025-02-17'),
('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'JavaScript Cheat Sheet', 'A visual reference guide for all major JavaScript concepts.', 'image', 4, NULL, NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200', 'js-cheatsheet.png', NULL, true, '2025-02-18', '2025-02-18'),
('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'JavaScript Basics Quiz', 'Test your knowledge of JavaScript fundamentals.', 'quiz', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '30000000-0000-0000-0000-000000000001', true, '2025-02-19', '2025-02-19'),

-- Course 2: React Masterclass
('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'React Fundamentals & JSX', 'Learn the basics of React components and JSX syntax.', 'video', 1, '00000000-0000-0000-0000-000000000002', 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', 60, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-03-10', '2025-03-10'),
('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'Hooks in Depth', 'Master useState, useEffect, useContext, useReducer, and custom hooks.', 'video', 2, '00000000-0000-0000-0000-000000000002', 'https://www.youtube.com/watch?v=TNhaISOUy6Q', 75, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-03-12', '2025-03-12'),
('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002', 'State Management Patterns', 'Learn about context, Redux, and Zustand for managing application state.', 'document', 3, NULL, NULL, NULL, '/docs/state-management.pdf', 'state-management.pdf', 3200000, NULL, NULL, NULL, true, '2025-03-14', '2025-03-14'),
('40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'React Knowledge Check', 'Test your React knowledge.', 'quiz', 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '30000000-0000-0000-0000-000000000002', true, '2025-03-16', '2025-03-16'),

-- Course 3: Python
('40000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', 'Python Basics', 'Introduction to Python syntax, data structures, and control flow.', 'video', 1, NULL, 'https://www.youtube.com/watch?v=kqtD5dpn9C8', 50, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-04-15', '2025-04-15'),
('40000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000003', 'Data Analysis with Pandas', 'Learn to manipulate and analyze data using the Pandas library.', 'video', 2, NULL, 'https://www.youtube.com/watch?v=vmEHCJofslg', 60, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-04-17', '2025-04-17'),
('40000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000003', 'Python Quiz', 'Test your Python skills.', 'quiz', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '30000000-0000-0000-0000-000000000003', true, '2025-04-19', '2025-04-19'),

-- Course 5: TypeScript
('40000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', 'Advanced Types', 'Learn about union types, intersection types, and conditional types.', 'video', 1, NULL, 'https://www.youtube.com/watch?v=ahCwqrYpIuM', 40, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-05-01', '2025-05-01'),
('40000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', 'Generics Masterclass', 'Master TypeScript generics with practical examples.', 'video', 2, NULL, 'https://www.youtube.com/watch?v=nViEqpgwxHE', 50, NULL, NULL, NULL, NULL, NULL, NULL, true, '2025-05-03', '2025-05-03'),
('40000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000005', 'TypeScript Best Practices', 'A comprehensive guide to writing clean TypeScript code.', 'document', 3, NULL, NULL, NULL, '/docs/ts-best-practices.pdf', 'ts-best-practices.pdf', 1800000, NULL, NULL, NULL, true, '2025-05-05', '2025-05-05');

-- =====================================================
-- LESSON ATTACHMENTS
-- =====================================================
INSERT INTO lesson_attachments (id, lesson_id, title, attachment_type, file_url, file_name, file_size_bytes, external_url, sequence_order, created_at, updated_at) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Starter Code', 'file', '/files/starter-code.zip', 'starter-code.zip', 15000, NULL, 1, '2025-02-15', '2025-02-15'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'MDN JavaScript Guide', 'link', NULL, NULL, NULL, 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 2, '2025-02-15', '2025-02-15'),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Exercise Files', 'file', '/files/variables-exercises.zip', 'variables-exercises.zip', 8500, NULL, 1, '2025-02-16', '2025-02-16'),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000006', 'React Documentation', 'link', NULL, NULL, NULL, 'https://react.dev', 1, '2025-03-10', '2025-03-10'),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000007', 'Hooks Cheat Sheet', 'file', '/files/hooks-cheatsheet.pdf', 'hooks-cheatsheet.pdf', 45000, NULL, 1, '2025-03-12', '2025-03-12');

-- =====================================================
-- QUIZ QUESTIONS
-- =====================================================
-- Quiz 1: JavaScript Basics
INSERT INTO quiz_questions (id, quiz_id, question_text, sequence_order, options, correct_answer_ids, explanation, points, created_at, updated_at) VALUES
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Which keyword is used to declare a constant variable in JavaScript?', 1, '[{"id":"a","text":"var"},{"id":"b","text":"let"},{"id":"c","text":"const"},{"id":"d","text":"define"}]'::jsonb, ARRAY['c'], 'The `const` keyword is used to declare constants that cannot be reassigned.', 1, '2025-02-19', '2025-02-19'),
('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'What is the output of typeof null?', 2, '[{"id":"a","text":"\"null\""},{"id":"b","text":"\"undefined\""},{"id":"c","text":"\"object\""},{"id":"d","text":"\"number\""}]'::jsonb, ARRAY['c'], 'This is a well-known JavaScript quirk. typeof null returns "object".', 1, '2025-02-19', '2025-02-19'),
('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'Which of the following is NOT a primitive data type in JavaScript?', 3, '[{"id":"a","text":"String"},{"id":"b","text":"Boolean"},{"id":"c","text":"Array"},{"id":"d","text":"Symbol"}]'::jsonb, ARRAY['c'], 'Array is an object, not a primitive data type.', 1, '2025-02-19', '2025-02-19'),
('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'What does the === operator check?', 4, '[{"id":"a","text":"Value only"},{"id":"b","text":"Type only"},{"id":"c","text":"Value and type"},{"id":"d","text":"Reference"}]'::jsonb, ARRAY['c'], NULL, 1, '2025-02-19', '2025-02-19'),

-- Quiz 2: React
('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'What hook is used for side effects in React?', 1, '[{"id":"a","text":"useState"},{"id":"b","text":"useEffect"},{"id":"c","text":"useContext"},{"id":"d","text":"useReducer"}]'::jsonb, ARRAY['b'], NULL, 1, '2025-03-16', '2025-03-16'),
('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', 'What is the virtual DOM?', 2, '[{"id":"a","text":"A copy of the real DOM in memory"},{"id":"b","text":"A CSS framework"},{"id":"c","text":"A database"},{"id":"d","text":"A testing tool"}]'::jsonb, ARRAY['a'], NULL, 1, '2025-03-16', '2025-03-16'),
('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', 'Which of the following are React hooks? (Select all that apply)', 3, '[{"id":"a","text":"useState"},{"id":"b","text":"useQuery"},{"id":"c","text":"useMemo"},{"id":"d","text":"useCallback"}]'::jsonb, ARRAY['a','c','d'], NULL, 1, '2025-03-16', '2025-03-16'),

-- Quiz 3: Python
('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', 'What is the correct way to create a list in Python?', 1, '[{"id":"a","text":"list = {}"},{"id":"b","text":"list = []"},{"id":"c","text":"list = ()"},{"id":"d","text":"list = <>"}]'::jsonb, ARRAY['b'], NULL, 1, '2025-04-19', '2025-04-19'),
('60000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 'Which library is commonly used for data manipulation in Python?', 2, '[{"id":"a","text":"NumPy"},{"id":"b","text":"Pandas"},{"id":"c","text":"Matplotlib"},{"id":"d","text":"Flask"}]'::jsonb, ARRAY['b'], NULL, 1, '2025-04-19', '2025-04-19');

-- =====================================================
-- ENROLLMENTS
-- =====================================================
INSERT INTO course_enrollments (id, user_id, course_id, status, enrolled_at, started_at, completed_at, total_lessons, completed_lessons, completion_percentage, total_time_spent_minutes, last_accessed_at, last_lesson_id, payment_status, payment_amount, payment_currency, created_at, updated_at) VALUES
-- Alice - JS Fundamentals (completed)
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'completed', '2025-03-05', '2025-03-06', '2025-04-15', 5, 5, 100.00, 195, '2025-04-15', '40000000-0000-0000-0000-000000000005', NULL, NULL, NULL, '2025-03-05', '2025-04-15'),
-- Alice - React Masterclass (in progress)
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'in_progress', '2025-04-20', '2025-04-21', NULL, 4, 2, 50.00, 130, '2025-06-15', '40000000-0000-0000-0000-000000000007', 'completed', 49.99, 'USD', '2025-04-20', '2025-06-15'),
-- Alice - TypeScript (in progress)
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'in_progress', '2025-05-20', '2025-05-21', NULL, 3, 1, 33.33, 45, '2025-06-10', '40000000-0000-0000-0000-000000000013', NULL, NULL, NULL, '2025-05-20', '2025-06-10'),
-- Bob - JS Fundamentals (in progress)
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'in_progress', '2025-03-15', '2025-03-16', NULL, 5, 3, 60.00, 120, '2025-06-10', '40000000-0000-0000-0000-000000000003', NULL, NULL, NULL, '2025-03-15', '2025-06-10'),
-- Charlie - JS Fundamentals (completed)
('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'completed', '2025-03-10', '2025-03-11', '2025-04-01', 5, 5, 100.00, 200, '2025-04-01', '40000000-0000-0000-0000-000000000005', NULL, NULL, NULL, '2025-03-10', '2025-04-01'),
-- Charlie - React (completed)
('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'completed', '2025-04-10', '2025-04-11', '2025-05-20', 4, 4, 100.00, 260, '2025-05-20', '40000000-0000-0000-0000-000000000009', 'completed', 49.99, 'USD', '2025-04-10', '2025-05-20'),
-- Diana - JS Fundamentals (yet to start)
('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'yet_to_start', '2025-06-01', NULL, NULL, 5, 0, 0.00, 0, NULL, NULL, NULL, NULL, NULL, '2025-06-01', '2025-06-01'),
-- Bob - React (yet to start)
('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'yet_to_start', '2025-05-20', NULL, NULL, 4, 0, 0.00, 0, NULL, NULL, 'completed', 49.99, 'USD', '2025-05-20', '2025-05-20');

-- =====================================================
-- LESSON PROGRESS
-- =====================================================
INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, enrollment_id, is_completed, completed_at, time_spent_minutes, first_accessed_at, last_accessed_at, video_progress_percentage, created_at, updated_at) VALUES
-- Alice - JS Fundamentals (all 5 completed)
('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', true, '2025-03-08', 35, '2025-03-06', '2025-03-08', 100.00, '2025-03-06', '2025-03-08'),
('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', true, '2025-03-12', 50, '2025-03-10', '2025-03-12', 100.00, '2025-03-10', '2025-03-12'),
('80000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', true, '2025-03-15', 40, '2025-03-13', '2025-03-15', 0.00, '2025-03-13', '2025-03-15'),
('80000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', true, '2025-03-16', 10, '2025-03-16', '2025-03-16', 0.00, '2025-03-16', '2025-03-16'),
('80000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', true, '2025-04-15', 60, '2025-04-01', '2025-04-15', 0.00, '2025-04-01', '2025-04-15'),
-- Alice - React (2 completed)
('80000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', true, '2025-05-01', 65, '2025-04-21', '2025-05-01', 100.00, '2025-04-21', '2025-05-01'),
('80000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', true, '2025-05-15', 65, '2025-05-05', '2025-05-15', 100.00, '2025-05-05', '2025-05-15'),
-- Alice - TypeScript (1 completed)
('80000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000003', true, '2025-06-01', 45, '2025-05-21', '2025-06-01', 100.00, '2025-05-21', '2025-06-01'),
-- Bob - JS (3 completed)
('80000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', true, '2025-03-20', 32, '2025-03-16', '2025-03-20', 100.00, '2025-03-16', '2025-03-20'),
('80000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', true, '2025-04-01', 48, '2025-03-25', '2025-04-01', 100.00, '2025-03-25', '2025-04-01'),
('80000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', true, '2025-04-10', 40, '2025-04-05', '2025-04-10', 0.00, '2025-04-05', '2025-04-10');

-- =====================================================
-- COURSE REVIEWS
-- =====================================================
INSERT INTO course_reviews (id, user_id, course_id, enrollment_id, rating, review_text, is_approved, is_featured, helpful_count, created_at, updated_at) VALUES
('90000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 5, 'Excellent course! The explanations are clear and the examples are practical. I learned a lot about JavaScript fundamentals.', true, true, 8, '2025-04-16', '2025-04-16'),
('90000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000005', 4, 'Great course overall. Could use more advanced examples but perfect for beginners.', true, false, 3, '2025-04-05', '2025-04-05'),
('90000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', 5, 'The best React course I have taken. The hooks section was incredibly detailed.', true, true, 12, '2025-05-22', '2025-05-22'),
('90000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', 4, 'Very informative. Good pace for beginners.', true, false, 1, '2025-05-01', '2025-05-01');

-- =====================================================
-- QUIZ ATTEMPTS
-- =====================================================
INSERT INTO quiz_attempts (id, user_id, quiz_id, enrollment_id, attempt_number, total_questions, correct_answers, score_percentage, points_earned, started_at, completed_at, time_taken_minutes, is_completed, passed, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 1, 4, 3, 75.00, 10, '2025-04-14', '2025-04-14 00:30:00', 30, true, true, '2025-04-14', '2025-04-14'),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000005', 1, 4, 4, 100.00, 10, '2025-03-30', '2025-03-30 00:20:00', 20, true, true, '2025-03-30', '2025-03-30'),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', 1, 3, 2, 66.67, 15, '2025-05-18', '2025-05-18 00:25:00', 25, true, false, '2025-05-18', '2025-05-18');

-- =====================================================
-- COURSE INVITATIONS
-- =====================================================
INSERT INTO course_invitations (id, course_id, invited_user_id, invited_email, invited_by, status, invitation_token, expires_at, sent_at, accepted_at, created_at, updated_at) VALUES
('b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'alice@learner.com', '00000000-0000-0000-0000-000000000001', 'accepted', 'tok_abc123', '2025-05-15', '2025-05-01', '2025-05-02', '2025-05-01', '2025-05-02'),
('b0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', NULL, 'newuser@example.com', '00000000-0000-0000-0000-000000000001', 'pending', 'tok_def456', '2025-07-01', '2025-06-20', NULL, '2025-06-20', '2025-06-20');

-- =====================================================
-- COURSE TAGS JUNCTION
-- =====================================================
INSERT INTO course_tags (course_id, tag_id, created_at) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2025-02-15'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '2025-02-15'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '2025-03-10'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '2025-03-10'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '2025-03-10'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '2025-04-15'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', '2025-04-15'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', '2025-06-01'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', '2025-05-01'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '2025-05-01'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', '2025-05-01');

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify data
SELECT 'users' as tbl, count(*) from users
UNION ALL SELECT 'tags', count(*) from tags
UNION ALL SELECT 'courses', count(*) from courses
UNION ALL SELECT 'quizzes', count(*) from quizzes
UNION ALL SELECT 'lessons', count(*) from lessons
UNION ALL SELECT 'lesson_attachments', count(*) from lesson_attachments
UNION ALL SELECT 'quiz_questions', count(*) from quiz_questions
UNION ALL SELECT 'enrollments', count(*) from course_enrollments
UNION ALL SELECT 'lesson_progress', count(*) from lesson_progress
UNION ALL SELECT 'reviews', count(*) from course_reviews
UNION ALL SELECT 'quiz_attempts', count(*) from quiz_attempts
UNION ALL SELECT 'invitations', count(*) from course_invitations
UNION ALL SELECT 'course_tags', count(*) from course_tags
UNION ALL SELECT 'system_settings', count(*) from system_settings;
