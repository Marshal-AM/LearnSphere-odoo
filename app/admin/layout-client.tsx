'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, BookOpen, BarChart3, LogOut, Bell,
  User as UserIcon, Settings, ChevronsUpDown, Globe,
  Video,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  avatar_url?: string;
}

export default function AdminLayoutClient({ children, user }: { children: ReactNode; user: AdminUser }) {
  const pathname = usePathname();
  const isInstructor = user.roles.includes('instructor') || user.roles.includes('admin');

  // Instructor online status
  const [isOnline, setIsOnline] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeMeetingCount, setActiveMeetingCount] = useState(0);

  // Fetch initial status
  useEffect(() => {
    if (!isInstructor) return;
    fetch('/api/instructor/status')
      .then(r => r.json())
      .then(data => setIsOnline(data.isActive ?? false))
      .catch(() => {});
  }, [isInstructor]);

  // Poll for active meetings when instructor is online
  useEffect(() => {
    if (!isInstructor || !isOnline) {
      setActiveMeetingCount(0);
      return;
    }
    const poll = () => {
      fetch('/api/meetings/instructor')
        .then(r => r.json())
        .then(data => setActiveMeetingCount(data.meetings?.length ?? 0))
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [isInstructor, isOnline]);

  const toggleStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/instructor/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isOnline }),
      });
      const data = await res.json();
      setIsOnline(data.isActive ?? false);
    } catch { }
    setStatusLoading(false);
  }, [isOnline]);

  const navigation = [
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Student Details', href: '/admin/reporting', icon: BarChart3 },
    ...(isInstructor
      ? [{ name: 'Meetings', href: '/admin/meetings', icon: Video }]
      : []),
  ];

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-none">
        {/* ─── Header: Logo ─── */}
        <SidebarHeader className="px-4 py-5">
          <Link href="/admin/courses" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-sidebar-bg" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-sidebar-accent-foreground tracking-tight">LearnSphere</span>
              <span className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-widest">Admin Panel</span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        {/* ─── Navigation ─── */}
        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase tracking-wider text-[10px] font-semibold px-3 mb-1">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map(item => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        size="lg"
                        className={cn(
                          'rounded-xl transition-all duration-200',
                          isActive && 'bg-primary/15 text-white font-semibold shadow-sm'
                        )}
                      >
                        <Link href={item.href}>
                          <div className={cn(
                            'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                            isActive
                              ? 'bg-primary text-white shadow-md shadow-primary/30'
                              : 'text-sidebar-foreground/60'
                          )}>
                            <item.icon className="w-[18px] h-[18px]" />
                            {/* Badge for meetings nav item */}
                            {item.name === 'Meetings' && activeMeetingCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-sidebar-bg">
                                {activeMeetingCount}
                              </span>
                            )}
                          </div>
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase tracking-wider text-[10px] font-semibold px-3 mb-1">
              Quick Links
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="View Website" className="rounded-xl">
                    <Link href="/courses">
                      <Globe className="w-[18px] h-[18px]" />
                      <span>View Website</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        {/* ─── Footer: User profile ─── */}
        <SidebarFooter className="px-3 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="w-full rounded-xl data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent/80 transition-all duration-200"
                  >
                    <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-sidebar-accent-foreground">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/50">
                        {user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/40" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-lg"
                  side="bottom"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <Avatar firstName={user.first_name} lastName={user.last_name} src={user.avatar_url} size="sm" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user.first_name} {user.last_name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="rounded-lg cursor-pointer">
                      <UserIcon className="mr-2 size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'} className="rounded-lg cursor-pointer">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* ─── Main Content Area ─── */}
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-background px-4 lg:px-6">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mx-1 h-4" />

          {/* Breadcrumb area */}
          <div className="flex-1" />

          {/* Instructor status toggle (replaces bell for instructors) */}
          {isInstructor ? (
            <button
              onClick={toggleStatus}
              disabled={statusLoading}
              className={cn(
                'relative flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 cursor-pointer',
                isOnline
                  ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              )}
            >
              {/* Glow dot */}
              <span className="relative flex h-3 w-3">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={cn(
                  'relative inline-flex rounded-full h-3 w-3',
                  isOnline ? 'bg-emerald-500' : 'bg-red-400'
                )} />
              </span>
              <span className={cn(
                'text-sm font-medium',
                isOnline ? 'text-emerald-700' : 'text-gray-500'
              )}>
                {statusLoading ? 'Updating...' : isOnline ? 'Active' : 'Inactive'}
              </span>
            </button>
          ) : (
            <button className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
            </button>
          )}

        </header>

        {/* Page content */}
        <div className="flex-1 min-h-0 p-4 lg:p-6 flex flex-col overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
