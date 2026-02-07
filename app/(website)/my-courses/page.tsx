import { getCurrentUser } from '@/lib/auth';
import { getEnrolledCourses, getAllTags } from '@/lib/queries';
import { redirect } from 'next/navigation';
import MyCoursesClient from './my-courses-client';

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [enrolledCourses, tags] = await Promise.all([
    getEnrolledCourses(user.id),
    getAllTags(),
  ]);

  return (
    <MyCoursesClient
      user={{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        total_points: user.total_points,
        current_badge: user.current_badge,
        avatar_url: user.avatar_url,
      }}
      enrolledCourses={enrolledCourses}
      tags={tags}
    />
  );
}
