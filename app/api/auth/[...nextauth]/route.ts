import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { query, queryOne } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      async profile(profile) {
        const email = profile.email;
        const existingUser = await queryOne<{
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          roles: string[];
          total_points: number;
          current_badge: string;
          avatar_url: string;
        }>(
          'SELECT id, email, first_name, last_name, roles, total_points, current_badge, avatar_url FROM users WHERE email = $1 AND deleted_at IS NULL',
          [email]
        );

        if (existingUser) {
          // Existing user — link Google info and sign in
          // Note: We do NOT overwrite avatar_url with the Google profile picture.
          // Users should set their own profile picture via the profile page.
          await query(
            'UPDATE users SET google_id = $1, oauth_provider = $2, last_login_at = NOW() WHERE id = $3',
            [profile.sub, 'google', existingUser.id]
          );
          return {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.first_name,
            lastName: existingUser.last_name,
            roles: existingUser.roles as any,
            totalPoints: existingUser.total_points,
            currentBadge: existingUser.current_badge as any,
            avatarUrl: existingUser.avatar_url || undefined,
            isNewUser: false,
          };
        } else {
          // Brand-new Google user — create with default learner role.
          // They'll be redirected to /choose-role to pick instructor vs learner.
          // Note: We do NOT store the Google profile picture. Users set their own via profile page.
          const nameParts = (profile.name || '').split(' ');
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || '';

          const newUser = await queryOne<{
            id: string;
            email: string;
            first_name: string;
            last_name: string;
            roles: string[];
            total_points: number;
            current_badge: string;
          }>(
            `INSERT INTO users (email, first_name, last_name, google_id, oauth_provider, email_verified, email_verified_at, last_login_at)
             VALUES ($1, $2, $3, $4, 'google', true, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET google_id = $4, oauth_provider = 'google', last_login_at = NOW()
             RETURNING id, email, first_name, last_name, roles, total_points, current_badge`,
            [email, firstName, lastName, profile.sub]
          );

          // If ON CONFLICT fired, this is an existing user not a new one
          const isActuallyNew = newUser!.roles?.length === 1 && newUser!.roles[0] === 'learner';

          return {
            id: newUser!.id,
            email: newUser!.email,
            firstName: newUser!.first_name,
            lastName: newUser!.last_name,
            roles: newUser!.roles as any,
            totalPoints: newUser!.total_points,
            currentBadge: newUser!.current_badge as any,
            avatarUrl: undefined,
            isNewUser: isActuallyNew,
          };
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await queryOne<{
          id: string;
          email: string;
          password_hash: string | null;
          first_name: string;
          last_name: string;
          roles: string[];
          total_points: number;
          current_badge: string;
          avatar_url: string;
          is_active: boolean;
        }>(
          'SELECT id, email, password_hash, first_name, last_name, roles, total_points, current_badge, avatar_url, is_active FROM users WHERE email = $1 AND deleted_at IS NULL',
          [credentials.email]
        );

        if (!user || !user.is_active) return null;
        if (!user.password_hash) return null;

        const isValid = await compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.roles as any,
          totalPoints: user.total_points,
          currentBadge: user.current_badge as any,
          avatarUrl: user.avatar_url,
          isNewUser: false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.roles = (user as any).roles;
        token.totalPoints = (user as any).totalPoints;
        token.currentBadge = (user as any).currentBadge;
        token.avatarUrl = (user as any).avatarUrl;
        token.needsOnboarding = (user as any).isNewUser || false;
      }

      // When the client calls update() after role selection, re-fetch from DB
      if (trigger === 'update' && token.id) {
        const dbUser = await queryOne<{
          roles: string[];
          total_points: number;
          current_badge: string;
          avatar_url: string;
        }>(
          'SELECT roles, total_points, current_badge, avatar_url FROM users WHERE id = $1 AND deleted_at IS NULL',
          [token.id]
        );
        if (dbUser) {
          token.roles = dbUser.roles as any;
          token.totalPoints = dbUser.total_points;
          token.currentBadge = dbUser.current_badge as any;
          token.avatarUrl = dbUser.avatar_url;
          token.needsOnboarding = false;
        }
      }

      // Safety: ensure roles is always a proper JS array
      if (token.roles && !Array.isArray(token.roles)) {
        const raw = token.roles as unknown as string;
        if (typeof raw === 'string' && raw.startsWith('{') && raw.endsWith('}')) {
          token.roles = raw.slice(1, -1).split(',').filter(Boolean) as any;
        } else {
          token.roles = [raw] as any;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.name = `${token.firstName} ${token.lastName}`;
        session.user.roles = Array.isArray(token.roles) ? token.roles : [];
        session.user.totalPoints = token.totalPoints;
        session.user.currentBadge = token.currentBadge;
        session.user.image = token.avatarUrl || null;
        session.user.needsOnboarding = token.needsOnboarding || false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export const runtime = 'nodejs';

export { handler as GET, handler as POST };
