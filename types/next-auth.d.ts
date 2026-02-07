import 'next-auth';
import 'next-auth/jwt';
import { UserRole, BadgeLevel } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      firstName: string;
      lastName: string;
      roles: UserRole[];
      totalPoints: number;
      currentBadge: BadgeLevel;
      needsOnboarding: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    totalPoints: number;
    currentBadge: BadgeLevel;
    avatarUrl?: string;
    isNewUser?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    totalPoints: number;
    currentBadge: BadgeLevel;
    avatarUrl?: string;
    needsOnboarding: boolean;
  }
}
