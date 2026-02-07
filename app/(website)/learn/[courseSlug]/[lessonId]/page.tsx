import { getCourseBySlug, getCourseLessons, getLessonById, getLessonAttachments, getUserEnrollment, getUserLessonProgress, getUserQuizAttempts, getQuizById, getQuizQuestions } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import LessonPlayerClient from './lesson-player-client';

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const { courseSlug, lessonId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const course = await getCourseBySlug(courseSlug);
  if (!course) {
    notFound();
  }

  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    notFound();
  }

  const [courseLessons, attachments, enrollment, userProgress] = await Promise.all([
    getCourseLessons(course.id),
    getLessonAttachments(lessonId),
    getUserEnrollment(user.id, course.id),
    getUserLessonProgress(user.id, course.id),
  ]);

  // Fetch quiz data if this is a quiz lesson
  let quiz = null;
  let quizQuestions: Awaited<ReturnType<typeof getQuizQuestions>> = [];
  let quizAttempts: Awaited<ReturnType<typeof getUserQuizAttempts>> = [];

  if (lesson.lesson_type === 'quiz' && lesson.quiz_id) {
    quiz = await getQuizById(lesson.quiz_id);
    if (quiz) {
      [quizQuestions, quizAttempts] = await Promise.all([
        getQuizQuestions(quiz.id),
        getUserQuizAttempts(user.id, quiz.id),
      ]);
    }
  }

  return (
    <LessonPlayerClient
      course={course}
      courseLessons={courseLessons}
      currentLesson={lesson}
      attachments={attachments}
      enrollment={enrollment}
      userProgress={userProgress}
      quiz={quiz}
      quizQuestions={quizQuestions}
      quizAttempts={quizAttempts}
      user={{
        id: user.id,
        total_points: user.total_points,
        current_badge: user.current_badge,
      }}
    />
  );
}
