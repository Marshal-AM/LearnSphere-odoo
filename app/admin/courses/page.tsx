import { getAllCourses, getAllTags } from '@/lib/queries';
import CoursesDashboardClient from './courses-client';

export default async function CoursesDashboard() {
  const [courses, tags] = await Promise.all([
    getAllCourses(),
    getAllTags(),
  ]);

  return <CoursesDashboardClient courses={courses} tags={tags} />;
}
