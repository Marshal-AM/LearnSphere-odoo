import { getCourseBySlug, getCourseLessons, getCourseReviews, getAllTags, getUserEnrollment, getUserLessonProgress } from '@/lib/queries';
import { getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import CourseDetailClient from './course-detail-client';

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const course = await getCourseBySlug(slug);
  if (!course) {
    notFound();
  }

  const user = await getCurrentUser();

  const [lessons, reviews, tags] = await Promise.all([
    getCourseLessons(course.id),
    getCourseReviews(course.id),
    getAllTags(),
  ]);

  let enrollment = null;
  let userProgress: Awaited<ReturnType<typeof getUserLessonProgress>> = [];

  if (user) {
    enrollment = await getUserEnrollment(user.id, course.id);
    if (enrollment) {
      userProgress = await getUserLessonProgress(user.id, course.id);
    }
  }

  return (
    <CourseDetailClient
      course={course}
      lessons={lessons}
      reviews={reviews}
      tags={tags}
      enrollment={enrollment}
      userProgress={userProgress}
      isLoggedIn={!!user}
    />
  );
}
