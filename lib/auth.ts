import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/db';
import { User } from '@/lib/types';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    const user = await queryOne<User>(
      `SELECT id, email, password_hash, first_name, last_name, avatar_url, roles,
              total_points, current_badge, is_active, email_verified,
              email_verified_at::text, last_login_at::text,
              created_at::text, updated_at::text, deleted_at::text
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [session.user.id]
    );

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  const userRoles = Array.isArray(session.user.roles) ? session.user.roles : [];
  const hasRole = userRoles.some((r: string) => roles.includes(r));
  if (!hasRole) {
    throw new Error('Forbidden');
  }
  return session;
}
