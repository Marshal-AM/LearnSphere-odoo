'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Clock, CheckCircle2, Circle, PlayCircle, Search,
  Star, ChevronRight, Lock, ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SearchInput } from '@/components/ui/search-input';
import { StarRating } from '@/components/ui/star-rating';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDuration, formatDate } from '@/lib/utils';
import { enrollInCourse, purchaseCourse, submitReview } from '@/lib/actions';
import { motion } from 'framer-motion';
import type { Course, Lesson, LessonProgress, CourseEnrollment, CourseReview, Tag, User } from '@/lib/types';

interface Props {
  course: Course;
  lessons: Lesson[];
  reviews: (CourseReview & { user: Pick<User, 'first_name' | 'last_name'> })[];
  tags: Tag[];
  enrollment: CourseEnrollment | null;
  userProgress: LessonProgress[];
  isLoggedIn: boolean;
}

export default function CourseDetailClient({
  course, lessons, reviews, tags: allTags,
  enrollment, userProgress, isLoggedIn,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lessonSearch, setLessonSearch] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const filteredLessons = lessons.filter(l =>
    l.title.toLowerCase().includes(lessonSearch.toLowerCase())
  );

  const completedCount = enrollment?.completed_lessons || 0;
  const totalCount = lessons.length;
  const incompleteCount = totalCount - completedCount;

  const getLessonStatus = (lessonId: string) => {
    const progress = userProgress.find(lp => lp.lesson_id === lessonId);
    if (!progress) return 'not_started';
    if (progress.is_completed) return 'completed';
    return 'in_progress';
  };

  const getFirstLessonLink = () => {
    if (lessons.length === 0) return '#';
    const nextLesson = lessons.find(l => {
      const status = getLessonStatus(l.id);
      return status !== 'completed';
    }) || lessons[0];
    return `/learn/${course.slug}/${nextLesson.id}`;
  };

  const handleEnroll = () => {
    startTransition(async () => {
      await enrollInCourse(course.id);
      router.refresh();
    });
  };

  const handlePurchase = () => {
    startTransition(async () => {
      await purchaseCourse(course.id);
      router.refresh();
    });
  };

  const handleSubmitReview = () => {
    if (!enrollment) return;
    startTransition(async () => {
      await submitReview(course.id, enrollment.id, reviewRating, reviewText);
      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewText('');
      router.refresh();
    });
  };

  // Course Overview Tab
  const OverviewTab = (
    <div>
      {/* Progress section */}
      {enrollment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-6 mb-6 border border-primary/10"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Your Progress</h3>
            <span className="text-sm font-bold text-primary tabular-nums">
              {Math.round(enrollment.completion_percentage)}% complete
            </span>
          </div>
          <ProgressBar value={enrollment.completion_percentage} size="md" />
          <div className="flex gap-6 mt-4 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <BookOpen className="w-4 h-4" />
              {totalCount} Total
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              {completedCount} Completed
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <Circle className="w-4 h-4" />
              {incompleteCount} Incomplete
            </span>
          </div>
        </motion.div>
      )}

      {/* Lesson search */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
        <SearchInput
          value={lessonSearch}
          onChange={setLessonSearch}
          placeholder="Search lessons..."
          className="w-64"
        />
      </div>

      {/* Lessons list */}
      <div className="space-y-1.5">
        {filteredLessons.map((lesson, idx) => {
          const status = getLessonStatus(lesson.id);
          const canAccess = enrollment || course.access_rule === 'open';
          return (
            <div key={lesson.id}>
              {canAccess ? (
                <Link
                  href={`/learn/${course.slug}/${lesson.id}`}
                  className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-gray-50 transition-all duration-200 group"
                >
                  <span className="text-sm text-gray-400 w-6 tabular-nums">{idx + 1}</span>
                  <div className="flex-shrink-0">
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : status === 'in_progress' ? (
                      <PlayCircle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${status === 'completed' ? 'text-gray-500' : 'text-gray-900'}`}>
                      {lesson.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lesson.lesson_type.charAt(0).toUpperCase() + lesson.lesson_type.slice(1)}
                      {lesson.video_duration_minutes && ` • ${formatDuration(lesson.video_duration_minutes)}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl opacity-50">
                  <span className="text-sm text-gray-400 w-6">{idx + 1}</span>
                  <Lock className="w-5 h-5 text-gray-300" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{lesson.title}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Ratings & Reviews Tab
  const ReviewsTab = (
    <div>
      {/* Average rating */}
      <div className="flex items-center gap-6 mb-6 p-6 bg-gray-50 rounded-2xl">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{(course.average_rating || 0).toFixed(1)}</p>
          <StarRating rating={course.average_rating || 0} size="md" className="mt-1" />
          <p className="text-sm text-gray-500 mt-1">{course.total_reviews_count} reviews</p>
        </div>
      </div>

      {/* Add review button */}
      {enrollment && (
        <div className="mb-6">
          <Button onClick={() => setReviewModalOpen(true)}>
            <Star className="w-4 h-4" />
            Add Review
          </Button>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map(review => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <Avatar firstName={review.user.first_name} lastName={review.user.last_name} size="md" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {review.user.first_name} {review.user.last_name}
                  </p>
                  <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                </div>
                <StarRating rating={review.rating} size="sm" className="mt-1" />
                {review.review_text && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
                )}
                {review.helpful_count > 0 && (
                  <p className="mt-2 text-xs text-gray-400">{review.helpful_count} people found this helpful</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Star className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Course header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-8 mb-8"
      >
        {/* Cover image */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="rounded-3xl overflow-hidden bg-primary/10 aspect-video lg:aspect-[4/3] shadow-sm">
            {course.cover_image_url && (
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Course info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>

          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {course.tags.map(tag => {
                const tagObj = allTags.find(t => t.name === tag);
                return <Badge key={tag} color={tagObj?.color}>{tag}</Badge>;
              })}
            </div>
          )}

          <p className="mt-4 text-gray-500 leading-relaxed">{course.short_description}</p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {course.total_lessons_count} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDuration(course.total_duration_minutes)}
            </span>
            <span className="flex items-center gap-1.5">
              <StarRating rating={course.average_rating || 0} size="sm" showValue />
              <span>({course.total_reviews_count})</span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!enrollment && isLoggedIn && course.access_rule === 'open' && (
              <Button size="lg" onClick={handleEnroll} disabled={isPending}>
                <PlayCircle className="w-5 h-5" />
                {isPending ? 'Enrolling...' : 'Start Course'}
              </Button>
            )}
            {!enrollment && !isLoggedIn && (
              <Link href="/login">
                <Button size="lg">
                  <PlayCircle className="w-5 h-5" />
                  Sign In to Start
                </Button>
              </Link>
            )}
            {!enrollment && isLoggedIn && course.access_rule === 'on_payment' && (
              <Button size="lg" onClick={handlePurchase} disabled={isPending}>
                <ShoppingCart className="w-5 h-5" />
                {isPending ? 'Processing...' : `Buy Course — $${course.price}`}
              </Button>
            )}
            {!enrollment && course.access_rule === 'on_invitation' && (
              <Button size="lg" disabled>
                <Lock className="w-5 h-5" />
                Invitation Only
              </Button>
            )}
            {enrollment && enrollment.status === 'yet_to_start' && (
              <Link href={getFirstLessonLink()}>
                <Button size="lg">
                  <PlayCircle className="w-5 h-5" />
                  Start Learning
                </Button>
              </Link>
            )}
            {enrollment && enrollment.status === 'in_progress' && (
              <Link href={getFirstLessonLink()}>
                <Button size="lg">
                  <PlayCircle className="w-5 h-5" />
                  Continue Learning
                </Button>
              </Link>
            )}
            {enrollment && enrollment.status === 'completed' && (
              <Link href={getFirstLessonLink()}>
                <Button size="lg" variant="outline">
                  <BookOpen className="w-5 h-5" />
                  Review Course
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
      >
        <Tabs
          tabs={[
            { id: 'overview', label: 'Course Overview', content: OverviewTab },
            { id: 'reviews', label: `Ratings & Reviews (${course.total_reviews_count})`, content: ReviewsTab },
          ]}
        />
      </motion.div>

      {/* Add Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Add Review"
        size="md"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <StarRating
              rating={reviewRating}
              interactive
              onChange={setReviewRating}
              size="lg"
            />
          </div>
          <Textarea
            label="Review"
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Share your experience with this course..."
            className="min-h-[120px]"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewRating === 0 || isPending}
            >
              {isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
