'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Trophy, ChevronRight, Star, Sparkles, Video, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Avatar } from '@/components/ui/avatar';
import { formatDuration } from '@/lib/utils';
import { BADGE_LABELS, BADGE_COLORS, BADGE_THRESHOLDS, BadgeLevel, CourseEnrollment, Course, Tag } from '@/lib/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const badgeOrder: BadgeLevel[] = ['newbie', 'explorer', 'achiever', 'specialist', 'expert', 'master'];

interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  current_badge: BadgeLevel;
  avatar_url?: string;
}

interface InstructorInfo {
  id: string;
  first_name: string;
  last_name: string;
  is_online: boolean;
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

export default function MyCoursesClient({
  user,
  enrolledCourses,
  tags: allTags,
  instructorInfo,
}: {
  user: UserInfo;
  enrolledCourses: (CourseEnrollment & { course: Course })[];
  tags: Tag[];
  instructorInfo: Record<string, InstructorInfo>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [meetingLoading, setMeetingLoading] = useState<string | null>(null);

  const filtered = enrolledCourses.filter(ec =>
    ec.course.title.toLowerCase().includes(search.toLowerCase())
  );

  const getButtonLabel = (status: string) => {
    switch (status) {
      case 'yet_to_start': return 'Start';
      case 'in_progress': return 'Continue';
      case 'completed': return 'Review';
      default: return 'View';
    }
  };

  const handleStartMeeting = async (courseId: string, instructorId: string) => {
    setMeetingLoading(courseId);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, instructorId }),
      });
      const data = await res.json();
      if (res.ok && data.roomUrl) {
        router.push(`/meeting?roomUrl=${encodeURIComponent(data.roomUrl)}`);
      } else {
        alert(data.error || 'Failed to create meeting');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setMeetingLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          >
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search courses by name..."
              className="w-full sm:w-72"
            />
          </motion.div>

          {/* Course cards */}
          <motion.div
            className="grid sm:grid-cols-2 gap-6"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {filtered.map(({ course, ...enrollment }) => {
              const instructor = instructorInfo[enrollment.course_id];
              return (
                <motion.div
                  key={enrollment.id}
                  variants={fadeInUp}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden card-hover"
                >
                  {/* Cover image */}
                  <div className="relative h-36 bg-gradient-to-br from-primary/10 to-indigo-100 overflow-hidden">
                    {course.cover_image_url && (
                      <img
                        src={course.cover_image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {enrollment.status === 'completed' && (
                      <div className="absolute inset-0 bg-emerald-900/30 backdrop-blur-[1px] flex items-center justify-center">
                        <Badge variant="success" className="text-sm px-4 py-1.5 rounded-2xl">✓ Completed</Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.short_description}</p>

                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {course.tags.slice(0, 3).map(tag => {
                          const tagObj = allTags.find(t => t.name === tag);
                          return <Badge key={tag} color={tagObj?.color} className="text-xs">{tag}</Badge>;
                        })}
                      </div>
                    )}

                    {/* Instructor status */}
                    {instructor && (
                      <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                              {instructor.first_name[0]}{instructor.last_name[0]}
                            </div>
                            {/* Status dot */}
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                              {instructor.is_online && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              )}
                              <span className={cn(
                                'relative inline-flex rounded-full h-3 w-3 border-2 border-gray-50',
                                instructor.is_online ? 'bg-emerald-500' : 'bg-red-400'
                              )} />
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {instructor.first_name} {instructor.last_name}
                            </p>
                            <p className={cn(
                              'text-[10px] font-medium',
                              instructor.is_online ? 'text-emerald-600' : 'text-gray-400'
                            )}>
                              {instructor.is_online ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>

                        {instructor.is_online && (
                          <button
                            onClick={() => handleStartMeeting(enrollment.course_id, instructor.id)}
                            disabled={meetingLoading === enrollment.course_id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-lg hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-200 cursor-pointer disabled:opacity-60"
                          >
                            {meetingLoading === enrollment.course_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Video className="w-3.5 h-3.5" />
                            )}
                            {meetingLoading === enrollment.course_id ? 'Connecting...' : 'Start Meeting'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Progress */}
                    {enrollment.status !== 'yet_to_start' && (
                      <div className="mt-4">
                        <ProgressBar value={enrollment.completion_percentage} showLabel size="sm" />
                      </div>
                    )}

                    {/* Action */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {enrollment.completed_lessons}/{enrollment.total_lessons} lessons
                      </span>
                      <Link href={`/courses/${course.slug}`}>
                        <Button size="sm" variant={enrollment.status === 'completed' ? 'outline' : 'primary'}>
                          {getButtonLabel(enrollment.status)}
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-600">No courses found</h3>
              <p className="text-sm text-gray-400 mt-1">
                <Link href="/courses" className="text-primary hover:underline font-medium">Browse courses</Link> to get started
              </p>
            </motion.div>
          )}
        </div>

        {/* Profile panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full lg:w-80 flex-shrink-0"
        >
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-24">
            {/* User info */}
            <div className="text-center mb-6">
              <Avatar
                firstName={user.first_name}
                lastName={user.last_name}
                src={user.avatar_url}
                size="xl"
                className="mx-auto"
              />
              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>

            {/* Total points */}
            <div className="text-center p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl mb-6 border border-amber-100/50">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{user.total_points}</p>
              <p className="text-sm text-gray-500 mt-0.5">Total Points</p>
            </div>

            {/* Badge levels */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Badge Levels</h4>
              <div className="space-y-2">
                {badgeOrder.map(badge => {
                  const isAchieved = user.total_points >= BADGE_THRESHOLDS[badge];
                  const isCurrent = user.current_badge === badge;
                  return (
                    <div
                      key={badge}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 ${
                        isCurrent
                          ? 'bg-primary-50 border border-primary/15'
                          : isAchieved
                          ? 'bg-gray-50'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                          isAchieved ? '' : 'opacity-30'
                        }`}
                        style={{ backgroundColor: `${BADGE_COLORS[badge]}15`, color: BADGE_COLORS[badge] }}
                      >
                        <Star className="w-4 h-4" fill={isAchieved ? 'currentColor' : 'none'} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isAchieved ? 'text-gray-900' : 'text-gray-400'}`}>
                          {BADGE_LABELS[badge]}
                        </p>
                        <p className="text-xs text-gray-400">{BADGE_THRESHOLDS[badge]} points</p>
                      </div>
                      {isCurrent && (
                        <Badge variant="primary" className="text-xs">Current</Badge>
                      )}
                      {isAchieved && !isCurrent && (
                        <span className="text-emerald-500 text-xs font-medium">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
