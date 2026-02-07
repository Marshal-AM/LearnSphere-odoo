'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import {
  GraduationCap, BookOpen, BarChart3, Settings, Menu, X,
  LogOut, ChevronDown, Bell, User as UserIcon, PanelLeft,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  avatar_url?: string;
}

const navigation = [
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Reporting', href: '/admin/reporting', icon: BarChart3 },
];

export default function AdminLayoutClient({ children, user }: { children: ReactNode; user: AdminUser }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar-bg transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5">
            <Link href="/admin/courses" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">LearnSphere</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map(item => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom - user info */}
          <div className="p-4 mx-3 mb-3 rounded-2xl bg-white/8">
            <div className="flex items-center gap-3">
              <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-white/40 truncate capitalize">
                  {user.roles.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="relative p-2.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Website link */}
          <Link
            href="/courses"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all duration-200"
          >
            View Website
          </Link>

          {/* User dropdown */}
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 p-1 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
                <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            }
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            </div>
            <DropdownItem icon={<UserIcon className="w-4 h-4" />} onClick={() => window.location.href = '/profile'}>Profile</DropdownItem>
            <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => window.location.href = '/profile'}>Settings</DropdownItem>
            <div className="border-t border-gray-100 my-1" />
            <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={() => signOut({ callbackUrl: '/login' })}>
              Sign out
            </DropdownItem>
          </Dropdown>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
