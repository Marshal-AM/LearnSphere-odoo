import { getCurrentUser } from '@/lib/auth';
import { getAllCourses, getInstructorCourses, getAllTags } from '@/lib/queries';
import { redirect } from 'next/navigation';
import CoursesDashboardClient from './courses-client';

export default async function CoursesDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const roles = Array.isArray(user.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

  const [courses, tags] = await Promise.all([
    isAdmin ? getAllCourses() : getInstructorCourses(user.id),
    getAllTags(),
  ]);

  return <CoursesDashboardClient courses={courses} tags={tags} isAdmin={isAdmin} />;
}
