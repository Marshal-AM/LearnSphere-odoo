'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { GraduationCap, Menu, X, User as UserIcon, LogOut, Settings, BookOpen } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { BADGE_LABELS, BadgeLevel } from '@/lib/types';

interface WebsiteUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  current_badge: BadgeLevel;
  avatar_url?: string;
  roles: string[];
}

const navLinks = [
  { name: 'Courses', href: '/courses' },
  { name: 'My Courses', href: '/my-courses' },
];

export default function WebsiteLayoutClient({ children, user }: { children: ReactNode; user: WebsiteUser | null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LearnSphere</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'text-primary bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Points badge */}
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full">
                    <span className="text-sm">🏆</span>
                    <span className="text-sm font-semibold text-amber-700">{user.total_points} pts</span>
                    <span className="text-xs text-amber-600">• {BADGE_LABELS[user.current_badge]}</span>
                  </div>

                  {/* User dropdown */}
                  <Dropdown
                    trigger={
                      <div className="flex items-center gap-2">
                        <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                      </div>
                    }
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownItem icon={<BookOpen className="w-4 h-4" />} onClick={() => window.location.href = '/my-courses'}>
                      My Courses
                    </DropdownItem>
                    {user.roles.some(r => r === 'admin' || r === 'instructor') && (
                      <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => window.location.href = '/admin/courses'}>
                        Admin Dashboard
                      </DropdownItem>
                    )}
                    <DropdownItem icon={<UserIcon className="w-4 h-4" />}>Profile</DropdownItem>
                    <div className="border-t border-gray-100" />
                    <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={() => signOut({ callbackUrl: '/login' })}>
                      Sign out
                    </DropdownItem>
                  </Dropdown>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white py-2 px-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium',
                  pathname === link.href ? 'text-primary bg-primary-50' : 'text-gray-600'
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">LearnSphere</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 LearnSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
