import { getCoursesWithEnrollmentCounts, getAllTags } from '@/lib/queries';
import CoursesClient from './courses-client';

export default async function CoursesPage() {
  const [courses, tags] = await Promise.all([
    getCoursesWithEnrollmentCounts(),
    getAllTags(),
  ]);

  return <CoursesClient courses={courses} tags={tags} />;
}
