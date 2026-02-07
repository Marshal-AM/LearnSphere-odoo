'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import {
  GraduationCap, Menu, User as UserIcon, LogOut,
  Settings, BookOpen, Sparkles, ChevronRight, Globe,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { BADGE_LABELS, BadgeLevel } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

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
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'My Courses', href: '/my-courses', icon: GraduationCap },
];

export default function WebsiteLayoutClient({ children, user }: { children: ReactNode; user: WebsiteUser | null }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">
                Learn<span className="text-primary">Sphere</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-xl p-1">
              {navLinks.map(link => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Points badge */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/60">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-700">{user.total_points}</span>
                    <Separator orientation="vertical" className="h-3.5 mx-0.5" />
                    <span className="text-xs text-amber-600 font-medium">{BADGE_LABELS[user.current_badge]}</span>
                  </div>

                  {/* User dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent transition-colors cursor-pointer focus:outline-none">
                        <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg p-1">
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-3 px-3 py-3">
                          <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{user.first_name} {user.last_name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Points display in dropdown for mobile */}
                      <div className="sm:hidden px-3 py-2 mb-1">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100/60">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-700">{user.total_points} pts</span>
                          <span className="text-xs text-amber-500 font-medium ml-auto">{BADGE_LABELS[user.current_badge]}</span>
                        </div>
                      </div>

                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => window.location.href = '/my-courses'} className="rounded-lg cursor-pointer py-2">
                          <BookOpen className="mr-2 size-4" />
                          My Courses
                          <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </DropdownMenuItem>
                        {user.roles.some(r => r === 'admin' || r === 'instructor') && (
                          <DropdownMenuItem onClick={() => window.location.href = '/admin/courses'} className="rounded-lg cursor-pointer py-2">
                            <Settings className="mr-2 size-4" />
                            Admin Dashboard
                            <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="rounded-lg cursor-pointer py-2">
                          <UserIcon className="mr-2 size-4" />
                          Profile
                          <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="rounded-lg cursor-pointer py-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 size-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <SheetHeader className="px-6 py-5 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold">LearnSphere</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col h-full">
                    {/* Mobile nav links */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                      {navLinks.map(link => {
                        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                          >
                            <link.icon className="w-5 h-5" />
                            {link.name}
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Mobile user section */}
                    {user ? (
                      <div className="border-t border-border/50 px-4 py-4 space-y-3">
                        <div className="flex items-center gap-3 px-2">
                          <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                          <div>
                            <p className="text-sm font-semibold">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/60">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-semibold text-amber-700">{user.total_points} pts</span>
                          <span className="text-xs text-amber-500 font-medium ml-auto">{BADGE_LABELS[user.current_badge]}</span>
                        </div>
                        <button
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-border/50 px-4 py-4 space-y-2">
                        <Link href="/login" className="block">
                          <Button variant="outline" className="w-full">Sign In</Button>
                        </Link>
                        <Link href="/register" className="block">
                          <Button className="w-full">Get Started</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">LearnSphere</span>
            </div>
            <p className="text-sm text-muted-foreground">&copy; 2026 LearnSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
