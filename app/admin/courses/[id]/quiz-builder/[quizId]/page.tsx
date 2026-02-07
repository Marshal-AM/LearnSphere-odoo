import { getQuizById, getQuizQuestions } from '@/lib/queries';
import QuizBuilderClient from './quiz-builder-client';

export default async function QuizBuilderPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id: courseId, quizId } = await params;

  let quiz = null;
  let questions: Awaited<ReturnType<typeof getQuizQuestions>> = [];

  if (quizId !== 'new') {
    quiz = await getQuizById(quizId);
    if (quiz) {
      questions = await getQuizQuestions(quiz.id);
    }
  }

  return (
    <QuizBuilderClient
      courseId={courseId}
      quiz={quiz}
      questions={questions}
    />
  );
}
