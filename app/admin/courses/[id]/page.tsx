import { getCurrentUser } from '@/lib/auth';
import { getCourseById, getCourseLessons, getCourseQuizzes, getInstructors, getAllTags } from '@/lib/queries';
import { notFound, redirect } from 'next/navigation';
import CourseFormClient from './course-form-client';

export default async function CourseFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const roles = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

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

  // Instructors can only view courses they are admin of
  if (!isAdmin && course.course_admin_id !== user.id) {
    redirect('/admin/courses');
  }

  return (
    <CourseFormClient
      course={course}
      lessons={lessons}
      quizzes={quizzes}
      instructors={instructors}
      tags={tags}
      isAdmin={isAdmin}
    />
  );
}
