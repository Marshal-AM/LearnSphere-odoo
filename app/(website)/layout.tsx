import { getCurrentUser } from '@/lib/auth';
import WebsiteLayoutClient from './layout-client';

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <WebsiteLayoutClient
      user={user ? {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        total_points: user.total_points,
        current_badge: user.current_badge,
        avatar_url: user.avatar_url,
        roles: Array.isArray(user.roles) ? user.roles : [],
      } : null}
    >
      {children}
    </WebsiteLayoutClient>
  );
}
