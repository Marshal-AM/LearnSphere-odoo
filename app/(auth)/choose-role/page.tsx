'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GraduationCap, BookOpen, Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateUserRole } from '@/lib/actions';
import { motion } from 'framer-motion';

type Role = 'learner' | 'instructor';

export default function ChooseRolePage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login');
      return;
    }
    if (!session.user.needsOnboarding) {
      const isInstructorOrAdmin = session.user.roles.some(r => r === 'admin' || r === 'instructor');
      router.replace(isInstructorOrAdmin ? '/admin/courses' : '/my-courses');
    }
  }, [status, session, router]);

  if (status === 'loading' || !session?.user || !session.user.needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await updateUserRole(selectedRole);
      await update();
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
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">LearnSphere</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {session.user.firstName}!</h1>
          <p className="mt-2 text-gray-500 text-lg">How would you like to use LearnSphere?</p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {roles.map(role => {
            const isSelected = selectedRole === role.value;
            return (
              <motion.button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex flex-col items-center text-center p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer',
                  isSelected
                    ? 'border-primary bg-white shadow-xl shadow-primary/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                )}
              >
                {/* Selection indicator */}
                <div
                  className={cn(
                    'absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                  )}
                </div>

                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
                    isSelected
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  <role.icon className="w-8 h-8" />
                </div>

                <h3 className={cn(
                  'text-lg font-semibold mb-2 transition-colors',
                  isSelected ? 'text-primary' : 'text-gray-900'
                )}>
                  {role.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {role.description}
                </p>
              </motion.button>
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
      </motion.div>
    </div>
  );
}
