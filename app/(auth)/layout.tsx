import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // If user is logged in and does NOT need onboarding, redirect away from auth pages
  if (session?.user && !session.user.needsOnboarding) {
    const roles: string[] = Array.isArray(session.user.roles) ? session.user.roles : [];
    if (roles.some(r => r === 'admin' || r === 'instructor')) {
      redirect('/admin/courses');
    } else {
      redirect('/my-courses');
    }
  }

  return <>{children}</>;
}
