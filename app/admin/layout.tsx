import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './layout-client';

export default async function BackofficeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (!user) {
    redirect('/login');
  }
  if (!roles.some(r => r === 'admin' || r === 'instructor')) {
    redirect('/my-courses');
  }

  return (
    <AdminLayoutClient
      user={{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: user.roles,
        avatar_url: user.avatar_url,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
