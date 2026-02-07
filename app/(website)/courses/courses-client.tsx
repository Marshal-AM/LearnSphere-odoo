'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { StarRating } from '@/components/ui/star-rating';
import { formatDuration } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { Course, Tag } from '@/lib/types';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function CoursesClient({
  courses,
  tags: allTags,
}: {
  courses: (Course & { enrollment_count: number })[];
  tags: Tag[];
}) {
  const [search, setSearch] = useState('');

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 mt-1">Browse all published courses</p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search courses by name..."
          className="w-full sm:w-80"
        />
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {filteredCourses.map(course => (
          <motion.div key={course.id} variants={fadeInUp}>
            <Link
              href={`/courses/${course.slug}`}
              className="block bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group card-hover"
            >
              {/* Cover image */}
              <div className="relative h-44 bg-gradient-to-br from-primary/10 to-indigo-100 overflow-hidden">
                {course.cover_image_url && (
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {course.access_rule === 'on_payment' && course.price && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-sm font-bold text-gray-900">${course.price}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {course.short_description}
                </p>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {course.tags.map(tag => {
                      const tagObj = allTags.find(t => t.name === tag);
                      return <Badge key={tag} color={tagObj?.color}>{tag}</Badge>;
                    })}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.total_lessons_count} lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(course.total_duration_minutes)}
                  </span>
                </div>

                {/* Rating & enrollments */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={course.average_rating || 0} size="sm" />
                    <span className="text-xs text-gray-400 ml-0.5">
                      ({course.total_reviews_count})
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {course.enrollment_count} enrolled
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredCourses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600">No courses found</h3>
          <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
        </motion.div>
      )}
    </div>
  );
}
