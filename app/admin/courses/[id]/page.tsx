import { getCourseById, getCourseLessons, getCourseQuizzes, getInstructors, getAllTags } from '@/lib/queries';
import { notFound } from 'next/navigation';
import CourseFormClient from './course-form-client';

export default async function CourseFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [course, lessons, quizzes, instructors, tags] = await Promise.all([
    getCourseById(id),
    getCourseLessons(id),
    getCourseQuizzes(id),
    getInstructors(),
    getAllTags(),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <CourseFormClient
      course={course}
      lessons={lessons}
      quizzes={quizzes}
      instructors={instructors}
      tags={tags}
    />
  );
}
