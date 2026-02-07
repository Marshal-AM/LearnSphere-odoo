'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, LayoutGrid, List, Eye, Clock, BookOpen, Share2,
  Edit, MoreVertical, Globe, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { formatDuration } from '@/lib/utils';
import { createCourse } from '@/lib/actions';
import type { Course, CourseStatus, Tag } from '@/lib/types';

type ViewMode = 'kanban' | 'list';

const KANBAN_COLUMNS: { status: CourseStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'draft', label: 'Draft', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { status: 'published', label: 'Published', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  { status: 'archived', label: 'Archived', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-300' },
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

  const CourseCard = ({ course }: { course: Course }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Cover image */}
      <div className="relative h-36 bg-gradient-to-br from-primary/20 to-indigo-100">
        {course.cover_image_url && (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Actions */}
        <div className="absolute top-2 right-2">
          <Dropdown
            trigger={
              <div className="p-1.5 bg-white/90 rounded-lg hover:bg-white shadow-sm">
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
          </Dropdown>
        </div>
      </div>
      {/* Content */}
      <div className="p-3">
        <Link
          href={`/admin/courses/${course.id}`}
          className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-2"
        >
          {course.title}
        </Link>
        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
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
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-0.5">
            <BookOpen className="w-3 h-3" />
            {course.total_lessons_count}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatDuration(course.total_duration_minutes)}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-3 h-3" />
            {course.views_count}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredCourses.length} courses total</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search courses by name..."
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-md transition-colors cursor-pointer ${
              viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
            title="Kanban view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors cursor-pointer ${
              viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View — columns grouped by status */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {KANBAN_COLUMNS.map(col => {
            const columnCourses = filteredCourses.filter(c => c.status === col.status);
            return (
              <div key={col.status} className="flex flex-col min-h-[200px]">
                {/* Column header */}
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl border ${col.bgColor}`}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.bgColor} ${col.color}`}>
                    {columnCourses.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex-1 bg-gray-50/60 border border-t-0 border-gray-200 rounded-b-xl p-3 space-y-3">
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tags</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Views</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Lessons</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Duration</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${course.id}`} className="font-medium text-gray-900 hover:text-primary">
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(course.tags || []).map(tag => {
                        const tagObj = tags.find(t => t.name === tag);
                        return <Badge key={tag} color={tagObj?.color} className="text-xs">{tag}</Badge>;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden sm:table-cell">{course.views_count}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden sm:table-cell">{course.total_lessons_count}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden lg:table-cell">{formatDuration(course.total_duration_minutes)}</td>
                  <td className="px-4 py-3 text-center">
                    {course.status === 'published' ? (
                      <Badge variant="success">Published</Badge>
                    ) : course.status === 'draft' ? (
                      <Badge variant="warning">Draft</Badge>
                    ) : (
                      <Badge>Archived</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleShare(course.slug, course.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
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
    </div>
  );
}
