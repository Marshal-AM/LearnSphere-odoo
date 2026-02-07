'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, LayoutGrid, List, Eye, Clock, BookOpen, Share2,
  Edit, MoreVertical, Globe, GripVertical, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { formatDuration } from '@/lib/utils';
import { createCourse, deleteCourse } from '@/lib/actions';
import { motion } from 'framer-motion';
import type { Course, CourseStatus, Tag } from '@/lib/types';

type ViewMode = 'kanban' | 'list';

const KANBAN_COLUMNS: { status: CourseStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'draft', label: 'Draft', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-100' },
  { status: 'published', label: 'Published', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-100' },
  { status: 'archived', label: 'Archived', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
];

export default function CoursesDashboardClient({
  courses,
  tags,
  isAdmin = false,
}: {
  courses: Course[];
  tags: Tag[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = (courseSlug: string, courseId: string) => {
    const url = `${window.location.origin}/courses/${courseSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(courseId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCourse = async () => {
    if (newCourseName.trim()) {
      startTransition(async () => {
        const result = await createCourse(newCourseName.trim());
        setNewCourseName('');
        setCreateModalOpen(false);
        if (result) {
          router.push(`/admin/courses/${result.id}`);
        }
        router.refresh();
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete.id);
      router.refresh();
    } catch (err) {
      console.error('Failed to delete course:', err);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const openDeleteModal = (course: { id: string; title: string }) => {
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={() => router.push(`/admin/courses/${course.id}`)}
    >
      {/* Cover image */}
      <div className="relative h-36 bg-primary/10">
        {course.cover_image_url && (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Actions */}
        <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
          <Dropdown
            trigger={
              <div className="p-1.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white shadow-sm border border-gray-100/50 transition-all">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </div>
            }
          >
            <DropdownItem
              icon={<Edit className="w-4 h-4" />}
              onClick={() => router.push(`/admin/courses/${course.id}`)}
            >
              Edit
            </DropdownItem>
            <DropdownItem
              icon={<Share2 className="w-4 h-4" />}
              onClick={() => handleShare(course.slug, course.id)}
            >
              {copiedId === course.id ? 'Link Copied!' : 'Share'}
            </DropdownItem>
            <DropdownItem
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={() => openDeleteModal({ id: course.id, title: course.title })}
              className="text-red-600 hover:!bg-red-50"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
          {course.title}
        </p>
        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {course.tags.slice(0, 2).map(tag => {
              const tagObj = tags.find(t => t.name === tag);
              return (
                <Badge key={tag} color={tagObj?.color} className="text-[10px]">
                  {tag}
                </Badge>
              );
            })}
            {course.tags.length > 2 && (
              <span className="text-[10px] text-gray-400">+{course.tags.length - 2}</span>
            )}
          </div>
        )}
        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {course.total_lessons_count}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(course.total_duration_minutes)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {course.views_count}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-400 mt-1">{filteredCourses.length} courses total</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        )}
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6"
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search courses by name..."
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1 ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
              viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Kanban view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
              viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {KANBAN_COLUMNS.map(col => {
            const columnCourses = filteredCourses.filter(c => c.status === col.status);
            return (
              <div key={col.status} className="flex flex-col min-h-[200px]">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border ${col.bgColor}`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${col.bgColor} ${col.color}`}>
                    {columnCourses.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex-1 bg-gray-50/50 border border-t-0 border-gray-100 rounded-b-2xl p-3 space-y-3">
                  {columnCourses.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                      No {col.label.toLowerCase()} courses
                    </div>
                  ) : (
                    columnCourses.map(course => (
                      <CourseCard key={course.id} course={course} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tags</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Views</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Lessons</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Duration</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCourses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/courses/${course.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(course.tags || []).map(tag => {
                        const tagObj = tags.find(t => t.name === tag);
                        return <Badge key={tag} color={tagObj?.color} className="text-xs">{tag}</Badge>;
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-gray-500 hidden sm:table-cell">{course.views_count}</td>
                  <td className="px-5 py-4 text-center text-sm text-gray-500 hidden sm:table-cell">{course.total_lessons_count}</td>
                  <td className="px-5 py-4 text-center text-sm text-gray-500 hidden lg:table-cell">{formatDuration(course.total_duration_minutes)}</td>
                  <td className="px-5 py-4 text-center">
                    {course.status === 'published' ? (
                      <Badge variant="success">Published</Badge>
                    ) : course.status === 'draft' ? (
                      <Badge variant="warning">Draft</Badge>
                    ) : (
                      <Badge>Archived</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleShare(course.slug, course.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal({ id: course.id, title: course.title })}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setNewCourseName(''); }}
        title="Create New Course"
        size="sm"
      >
        <div className="p-6">
          <Input
            label="Course Name"
            value={newCourseName}
            onChange={e => setNewCourseName(e.target.value)}
            placeholder="Enter course name"
            autoFocus
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); setNewCourseName(''); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateCourse} disabled={!newCourseName.trim() || isPending}>
              {isPending ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Course Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setCourseToDelete(null); }}
        title="Delete Course"
        size="sm"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{courseToDelete?.title}</span>?
              </p>
              <p className="text-xs text-gray-400 mt-1">This action can be undone by an administrator.</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDeleteModalOpen(false); setCourseToDelete(null); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
