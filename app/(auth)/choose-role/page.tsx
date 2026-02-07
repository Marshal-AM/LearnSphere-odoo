'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen, Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateUserRole } from '@/lib/actions';

type Role = 'learner' | 'instructor';

export default function ChooseRolePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // If still loading session, show spinner
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!session?.user) {
    router.replace('/login');
    return null;
  }

  // Already onboarded (existing user returning) → redirect based on role
  if (!session.user.needsOnboarding) {
    const isInstructorOrAdmin = session.user.roles.some(r => r === 'admin' || r === 'instructor');
    router.replace(isInstructorOrAdmin ? '/admin/courses' : '/my-courses');
    return null;
  }

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await updateUserRole(selectedRole);
      // Refresh the JWT token with the new role from the DB
      await update();
      // Redirect based on chosen role
      router.replace(selectedRole === 'instructor' ? '/admin/courses' : '/my-courses');
    } catch (err) {
      console.error('Failed to set role:', err);
      setLoading(false);
    }
  };

  const roles: { value: Role; icon: React.ElementType; title: string; description: string }[] = [
    {
      value: 'learner',
      icon: BookOpen,
      title: 'I want to learn',
      description: 'Browse courses, earn points and badges as you master new skills through interactive lessons and quizzes.',
    },
    {
      value: 'instructor',
      icon: Presentation,
      title: 'I want to teach',
      description: 'Create and manage courses, track learner progress, and build engaging educational content.',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">LearnSphere</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {session.user.firstName}!</h1>
          <p className="mt-2 text-gray-600 text-lg">How would you like to use LearnSphere?</p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {roles.map(role => {
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  'relative flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary bg-primary-50 shadow-lg shadow-primary/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                )}
              >
                {/* Selection indicator */}
                <div
                  className={cn(
                    'absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  <role.icon className="w-8 h-8" />
                </div>

                <h3 className={cn(
                  'text-lg font-semibold mb-2',
                  isSelected ? 'text-primary' : 'text-gray-900'
                )}>
                  {role.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {role.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-12"
            disabled={!selectedRole || loading}
            onClick={handleContinue}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          You can always change this later in your settings.
        </p>
      </div>
    </div>
  );
}
