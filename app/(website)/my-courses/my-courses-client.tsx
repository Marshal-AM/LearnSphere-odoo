'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Trophy, ChevronRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Avatar } from '@/components/ui/avatar';
import { formatDuration } from '@/lib/utils';
import { BADGE_LABELS, BADGE_COLORS, BADGE_THRESHOLDS, BadgeLevel, CourseEnrollment, Course, Tag } from '@/lib/types';

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

export default function MyCoursesClient({
  user,
  enrolledCourses,
  tags: allTags,
}: {
  user: UserInfo;
  enrolledCourses: (CourseEnrollment & { course: Course })[];
  tags: Tag[];
}) {
  const [search, setSearch] = useState('');

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search courses by name..."
              className="w-full sm:w-72"
            />
          </div>

          {/* Course cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {filtered.map(({ course, ...enrollment }) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
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
                    <div className="absolute inset-0 bg-green-900/30 flex items-center justify-center">
                      <Badge variant="success" className="text-sm px-3 py-1">✓ Completed</Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.short_description}</p>

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {course.tags.slice(0, 3).map(tag => {
                        const tagObj = allTags.find(t => t.name === tag);
                        return <Badge key={tag} color={tagObj?.color} className="text-xs">{tag}</Badge>;
                      })}
                    </div>
                  )}

                  {/* Progress */}
                  {enrollment.status !== 'yet_to_start' && (
                    <div className="mt-3">
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
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No courses found</h3>
              <p className="text-sm text-gray-400 mt-1">
                <Link href="/courses" className="text-primary hover:underline">Browse courses</Link> to get started
              </p>
            </div>
          )}
        </div>

        {/* Profile panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
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
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {/* Total points */}
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl mb-6">
              <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{user.total_points}</p>
              <p className="text-sm text-gray-600">Total Points</p>
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
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-primary-50 border border-primary/20'
                          : isAchieved
                          ? 'bg-gray-50'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          isAchieved ? '' : 'opacity-30'
                        }`}
                        style={{ backgroundColor: `${BADGE_COLORS[badge]}20`, color: BADGE_COLORS[badge] }}
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
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
