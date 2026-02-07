'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { GraduationCap, Menu, X, User as UserIcon, LogOut, Settings, BookOpen, Sparkles } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { BADGE_LABELS, BadgeLevel } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
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
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'text-primary bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                  <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{user.total_points} pts</span>
                    <span className="text-xs text-amber-500 font-medium">{BADGE_LABELS[user.current_badge]}</span>
                  </div>

                  {/* User dropdown */}
                  <Dropdown
                    trigger={
                      <div className="flex items-center gap-2 p-1 rounded-2xl hover:bg-gray-50 transition-colors">
                        <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                      </div>
                    }
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                    <DropdownItem icon={<BookOpen className="w-4 h-4" />} onClick={() => window.location.href = '/my-courses'}>
                      My Courses
                    </DropdownItem>
                    {user.roles.some(r => r === 'admin' || r === 'instructor') && (
                      <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => window.location.href = '/admin/courses'}>
                        Admin Dashboard
                      </DropdownItem>
                    )}
                    <DropdownItem icon={<UserIcon className="w-4 h-4" />} onClick={() => window.location.href = '/profile'}>Profile</DropdownItem>
                    <div className="border-t border-gray-100 my-1" />
                    <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={() => signOut({ callbackUrl: '/login' })}>
                      Sign out
                    </DropdownItem>
                  </Dropdown>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-200">
                    Sign In
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl hover:from-primary-dark hover:to-indigo-700 transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="py-3 px-4 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      pathname === link.href ? 'text-primary bg-primary-50' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">LearnSphere</span>
            </div>
            <p className="text-sm text-gray-400">© 2026 LearnSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
