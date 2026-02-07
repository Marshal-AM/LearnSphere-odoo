'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Eye, UserPlus, Mail, Upload, Video, FileText,
  Image as ImageIcon, HelpCircle, MoreVertical, Edit, Trash2, Plus,
  GripVertical, ExternalLink, Link as LinkIcon, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea, Select } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { FileUpload } from '@/components/ui/file-upload';
import { formatDuration, formatFileSize } from '@/lib/utils';
import {
  updateCourse, createLesson, updateLesson, deleteLesson,
  deleteQuiz, sendInvitation,
} from '@/lib/actions';
import type { Course, Lesson, Quiz, Tag, LessonType, CourseVisibility, CourseAccessRule, User } from '@/lib/types';

const lessonTypeIcons: Record<LessonType, React.ElementType> = {
  video: Video,
  document: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
};

const lessonTypeLabels: Record<LessonType, string> = {
  video: 'Video',
  document: 'Document',
  image: 'Image',
  quiz: 'Quiz',
};

interface Props {
  course: Course;
  lessons: Lesson[];
  quizzes: Quiz[];
  instructors: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'roles'>[];
  tags: Tag[];
  isAdmin?: boolean;
}

export default function CourseFormClient({ course, lessons: initialLessons, quizzes: initialQuizzes, instructors, tags: allTags, isAdmin = false }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isPublished, setIsPublished] = useState(course.status === 'published');
  const [title, setTitle] = useState(course.title);
  const [courseTagsState, setCourseTags] = useState<string[]>(course.tags || []);
  const [websiteUrl, setWebsiteUrl] = useState(course.website_url || '');
  const [adminId, setAdminId] = useState(course.course_admin_id || '');
  const [description, setDescription] = useState(course.full_description || '');
  const [visibility, setVisibility] = useState<CourseVisibility>(course.visibility);
  const [accessRule, setAccessRule] = useState<CourseAccessRule>(course.access_rule);
  const [price, setPrice] = useState(course.price?.toString() || '');
  const [coverImageUrl, setCoverImageUrl] = useState(course.cover_image_url || '');

  // Lesson editor
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', type: 'video' as LessonType, responsible: '',
    videoUrl: '', videoDuration: '', documentUrl: '', documentFilename: '', documentSize: 0,
    allowDownload: true, imageUrl: '', imageFilename: '',
    description: '', attachments: [] as { title: string; type: 'file' | 'link'; url: string }[],
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: string; name: string }>({
    open: false, type: '', id: '', name: '',
  });

  // Attendee modal
  const [attendeeModalOpen, setAttendeeModalOpen] = useState(false);
  const [attendeeEmail, setAttendeeEmail] = useState('');

  // Contact attendees modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  // Cover image upload
  const [coverUploadOpen, setCoverUploadOpen] = useState(false);

  // Validation errors
  const [courseErrors, setCourseErrors] = useState<Record<string, string>>({});
  const [lessonErrors, setLessonErrors] = useState<Record<string, string>>({});

  /** Small inline error label */
  const FieldError = ({ field, errors }: { field: string; errors: Record<string, string> }) => {
    if (!errors[field]) return null;
    return (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        {errors[field]}
      </p>
    );
  };

  // --- Course-level validation ---
  const validateCourse = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Course title is required.';
    if (isPublished && !websiteUrl.trim()) errs.websiteUrl = 'Website URL is required when the course is published.';
    if (accessRule === 'on_payment' && (!price || parseFloat(price) <= 0)) errs.price = 'A price greater than 0 is required for paid courses.';
    return errs;
  };

  const handleSave = () => {
    const errs = validateCourse();
    setCourseErrors(errs);
    if (Object.keys(errs).length > 0) return;

    startTransition(async () => {
      try {
        const data: Record<string, any> = {
          title,
          full_description: description,
          visibility,
          access_rule: accessRule,
          price: accessRule === 'on_payment' ? parseFloat(price) || null : null,
          website_url: websiteUrl || undefined,
          tags: courseTagsState,
          status: isPublished ? 'published' : 'draft',
          cover_image_url: coverImageUrl || undefined,
        };
        // Only admin can change the course admin
        if (isAdmin) {
          data.course_admin_id = adminId || null;
        }
        await updateCourse(course.id, data);
        router.push('/admin/courses');
      } catch (err: any) {
        // Fallback: surface unexpected DB errors as a generic alert
        setCourseErrors({ _global: err?.message || 'Failed to save course.' });
      }
    });
  };

  const openLessonEditor = (lessonId?: string) => {
    if (lessonId) {
      const lesson = initialLessons.find(l => l.id === lessonId);
      if (lesson) {
        setEditingLesson(lessonId);
        setLessonForm({
          title: lesson.title,
          type: lesson.lesson_type,
          responsible: lesson.responsible_user_id || '',
          videoUrl: lesson.video_url || '',
          videoDuration: lesson.video_duration_minutes?.toString() || '',
          documentUrl: lesson.document_url || '',
          documentFilename: lesson.document_filename || '',
          documentSize: lesson.document_size_bytes || 0,
          allowDownload: lesson.document_allow_download,
          imageUrl: lesson.image_url || '',
          imageFilename: lesson.image_filename || '',
          description: lesson.description || '',
          attachments: [],
        });
      }
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '', type: 'video', responsible: '',
        videoUrl: '', videoDuration: '', documentUrl: '', documentFilename: '', documentSize: 0,
        allowDownload: true, imageUrl: '', imageFilename: '',
        description: '', attachments: [],
      });
    }
    setLessonErrors({});
    setLessonModalOpen(true);
  };

  // --- Lesson-level validation ---
  const validateLesson = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!lessonForm.title.trim()) errs.lessonTitle = 'Lesson title is required.';
    if (lessonForm.type === 'video') {
      if (!lessonForm.videoUrl.trim()) errs.videoUrl = 'A video URL or uploaded video is required for video lessons.';
      if (!lessonForm.videoDuration || parseFloat(lessonForm.videoDuration) <= 0) errs.videoDuration = 'Duration is required for video lessons. Upload a video to auto-detect or enter manually.';
    }
    if (lessonForm.type === 'document') {
      if (!lessonForm.documentUrl.trim()) errs.documentUrl = 'A document file is required for document lessons.';
    }
    if (lessonForm.type === 'image') {
      if (!lessonForm.imageUrl.trim()) errs.imageUrl = 'An image file is required for image lessons.';
    }
    return errs;
  };

  const handleSaveLesson = () => {
    const errs = validateLesson();
    setLessonErrors(errs);
    if (Object.keys(errs).length > 0) return;

    startTransition(async () => {
      try {
        if (editingLesson) {
          await updateLesson(editingLesson, {
            title: lessonForm.title,
            lesson_type: lessonForm.type,
            responsible_user_id: lessonForm.responsible || null,
            video_url: lessonForm.videoUrl || null,
            video_duration_minutes: lessonForm.videoDuration ? parseFloat(lessonForm.videoDuration) : null,
            document_url: lessonForm.documentUrl || null,
            document_filename: lessonForm.documentFilename || null,
            document_size_bytes: lessonForm.documentSize || null,
            image_url: lessonForm.imageUrl || null,
            image_filename: lessonForm.imageFilename || null,
            description: lessonForm.description || null,
            document_allow_download: lessonForm.allowDownload,
            image_allow_download: lessonForm.allowDownload,
          });
        } else {
          await createLesson(course.id, {
            title: lessonForm.title,
            lesson_type: lessonForm.type,
            responsible_user_id: lessonForm.responsible || undefined,
            video_url: lessonForm.videoUrl || undefined,
            video_duration_minutes: lessonForm.videoDuration ? parseFloat(lessonForm.videoDuration) : undefined,
            document_url: lessonForm.documentUrl || undefined,
            document_filename: lessonForm.documentFilename || undefined,
            document_size_bytes: lessonForm.documentSize || undefined,
            image_url: lessonForm.imageUrl || undefined,
            image_filename: lessonForm.imageFilename || undefined,
            description: lessonForm.description || undefined,
            document_allow_download: lessonForm.allowDownload,
            image_allow_download: lessonForm.allowDownload,
          });
        }
        setLessonErrors({});
        setLessonModalOpen(false);
        router.refresh();
      } catch (err: any) {
        setLessonErrors({ _global: err?.message || 'Failed to save lesson.' });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      if (deleteConfirm.type === 'lesson') {
        await deleteLesson(deleteConfirm.id);
      } else if (deleteConfirm.type === 'quiz') {
        await deleteQuiz(deleteConfirm.id);
      }
      setDeleteConfirm({ ...deleteConfirm, open: false });
      router.refresh();
    });
  };

  const handleSendInvitation = () => {
    startTransition(async () => {
      await sendInvitation(course.id, attendeeEmail);
      setAttendeeModalOpen(false);
      setAttendeeEmail('');
    });
  };

  // Content Tab
  const ContentTab = (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Lessons ({initialLessons.length})</h3>
        <Button size="sm" onClick={() => openLessonEditor()}>
          <Plus className="w-4 h-4" />
          Add Content
        </Button>
      </div>
      <div className="space-y-2">
        {initialLessons.map((lesson, idx) => {
          const Icon = lessonTypeIcons[lesson.lesson_type];
          return (
            <div
              key={lesson.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
              <span className="text-sm font-medium text-gray-400 w-6">{idx + 1}</span>
              <div className="p-1.5 rounded bg-white border border-gray-200">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                <p className="text-xs text-gray-500">
                  {lessonTypeLabels[lesson.lesson_type]}
                  {lesson.video_duration_minutes && ` • ${formatDuration(lesson.video_duration_minutes)}`}
                  {lesson.document_size_bytes && ` • ${formatFileSize(lesson.document_size_bytes)}`}
                </p>
              </div>
              <Dropdown
                trigger={
                  <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </div>
                }
              >
                <DropdownItem icon={<Edit className="w-4 h-4" />} onClick={() => openLessonEditor(lesson.id)}>
                  Edit
                </DropdownItem>
                <DropdownItem
                  icon={<Trash2 className="w-4 h-4" />}
                  danger
                  onClick={() => setDeleteConfirm({ open: true, type: 'lesson', id: lesson.id, name: lesson.title })}
                >
                  Delete
                </DropdownItem>
              </Dropdown>
            </div>
          );
        })}
        {initialLessons.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No lessons yet. Click &ldquo;Add Content&rdquo; to get started.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Description Tab
  const DescriptionTab = (
    <div>
      <Textarea
        label="Course Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Write a detailed description for your course..."
        className="min-h-[200px]"
      />
      <p className="mt-2 text-xs text-gray-500">Supports rich text. Describe what learners will gain from this course.</p>
    </div>
  );

  // Options Tab
  const OptionsTab = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Visibility</h3>
        <p className="text-xs text-gray-500 mb-3">Decide who can see this course</p>
        <div className="space-y-2">
          {[
            { value: 'everyone' as CourseVisibility, label: 'Everyone', desc: 'Course visible to all visitors' },
            { value: 'signed_in' as CourseVisibility, label: 'Signed In', desc: 'Only logged-in users can see' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                visibility === opt.value ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={visibility === opt.value}
                onChange={() => setVisibility(opt.value)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Access Rule</h3>
        <p className="text-xs text-gray-500 mb-3">Decide who can start/learn the course</p>
        <div className="space-y-2">
          {[
            { value: 'open' as CourseAccessRule, label: 'Open', desc: 'Anyone can start the course' },
            { value: 'on_invitation' as CourseAccessRule, label: 'On Invitation', desc: 'Only invited/enrolled users can access lessons' },
            { value: 'on_payment' as CourseAccessRule, label: 'On Payment', desc: 'Users must purchase to access' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                accessRule === opt.value ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="accessRule"
                value={opt.value}
                checked={accessRule === opt.value}
                onChange={() => setAccessRule(opt.value)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {accessRule === 'on_payment' && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Input
              label="Price (USD)"
              type="number"
              value={price}
              onChange={e => { setPrice(e.target.value); setCourseErrors(prev => { const { price: _, ...rest } = prev; return rest; }); }}
              placeholder="49.99"
            />
            {(!price || parseFloat(price) <= 0) && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                A price greater than $0 is required for paid courses
              </p>
            )}
            <FieldError field="price" errors={courseErrors} />
          </div>
        )}
      </div>

      {/* Course Admin — only shown to admin users */}
      {isAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Course Admin</h3>
          <Select
            label="Responsible / Course Admin"
            value={adminId}
            onChange={e => setAdminId((e.target as HTMLSelectElement).value)}
            options={[
              { value: '', label: 'Select a user...' },
              ...instructors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })),
            ]}
          />
        </div>
      )}
    </div>
  );

  // Quiz Tab
  const QuizTab = (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Quizzes ({initialQuizzes.length})</h3>
        <Link href={`/admin/courses/${course.id}/quiz-builder/new`}>
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Quiz
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        {initialQuizzes.map(quiz => (
          <div
            key={quiz.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <HelpCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{quiz.title}</p>
                <p className="text-xs text-gray-500">
                  Points: {quiz.points_first_attempt} / {quiz.points_second_attempt} / {quiz.points_third_attempt} / {quiz.points_fourth_plus_attempt}
                  {quiz.allow_multiple_attempts && ' • Multiple attempts'}
                </p>
              </div>
            </div>
            <Dropdown
              trigger={
                <div className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </div>
              }
            >
              <DropdownItem
                icon={<Edit className="w-4 h-4" />}
                onClick={() => router.push(`/admin/courses/${course.id}/quiz-builder/${quiz.id}`)}
              >
                Edit
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="w-4 h-4" />}
                danger
                onClick={() => setDeleteConfirm({ open: true, type: 'quiz', id: quiz.id, name: quiz.title })}
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        ))}
        {initialQuizzes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No quizzes yet. Click &ldquo;Add Quiz&rdquo; to create one.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Validation error banner */}
      {Object.keys(courseErrors).length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Please fix the following issues before saving:</p>
            <ul className="mt-1 list-disc list-inside text-sm text-red-700 space-y-0.5">
              {Object.entries(courseErrors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/courses"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title || 'New Course'}</h1>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <Toggle
          checked={isPublished}
          onChange={(v) => {
            setIsPublished(v);
            // Clear websiteUrl error when switching to draft
            if (!v) setCourseErrors(prev => { const { websiteUrl: _, ...rest } = prev; return rest; });
          }}
          label={isPublished ? 'Published' : 'Draft'}
        />
        <div className="flex-1" />
        <Link href={`/courses/${course.slug}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setAttendeeModalOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Add Attendees
        </Button>
        <Button variant="outline" size="sm" onClick={() => setContactModalOpen(true)}>
          <Mail className="w-4 h-4" />
          Contact Attendees
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCoverUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          {coverImageUrl ? 'Change Cover' : 'Upload Cover'}
        </Button>
      </div>

      {/* Cover image preview */}
      {coverImageUrl && (
        <div className="mb-6 relative rounded-xl overflow-hidden h-48 bg-gray-100">
          <img src={coverImageUrl} alt="Course cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Course fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Title"
              value={title}
              onChange={e => { setTitle(e.target.value); setCourseErrors(prev => { const { title: _, ...rest } = prev; return rest; }); }}
              placeholder="Course title"
              required
            />
            <FieldError field="title" errors={courseErrors} />
          </div>
          <div>
            <Input
              label="Website URL"
              value={websiteUrl}
              onChange={e => { setWebsiteUrl(e.target.value); setCourseErrors(prev => { const { websiteUrl: _, ...rest } = prev; return rest; }); }}
              placeholder="https://..."
              helperText={isPublished && !websiteUrl.trim() ? undefined : (isPublished ? 'Required when published' : undefined)}
            />
            {isPublished && !websiteUrl.trim() && !courseErrors.websiteUrl && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                Required before publishing
              </p>
            )}
            <FieldError field="websiteUrl" errors={courseErrors} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[42px]">
              {courseTagsState.map(tag => (
                <Badge key={tag} className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => setCourseTags(courseTagsState.filter(t => t !== tag))}
                    className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <select
                className="text-sm border-none outline-none bg-transparent flex-1 min-w-[120px]"
                onChange={e => {
                  if (e.target.value && !courseTagsState.includes(e.target.value)) {
                    setCourseTags([...courseTagsState, e.target.value]);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="">Add tag...</option>
                {allTags.filter(t => !courseTagsState.includes(t.name)).map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Course Admin selector — only visible to admins */}
          {isAdmin ? (
            <Select
              label="Responsible / Course Admin"
              value={adminId}
              onChange={e => setAdminId((e.target as HTMLSelectElement).value)}
              options={[
                { value: '', label: 'Select...' },
                ...instructors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })),
              ]}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Admin</label>
              <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded-lg border border-gray-200">
                {instructors.find(u => u.id === adminId)
                  ? `${instructors.find(u => u.id === adminId)!.first_name} ${instructors.find(u => u.id === adminId)!.last_name}`
                  : 'Not assigned'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Tabs
          tabs={[
            { id: 'content', label: 'Content', content: ContentTab },
            { id: 'description', label: 'Description', content: DescriptionTab },
            { id: 'options', label: 'Options', content: OptionsTab },
            { id: 'quiz', label: 'Quiz', content: QuizTab },
          ]}
        />
      </div>

      {/* Lesson Editor Modal */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add Content'}
        size="lg"
      >
        <div className="p-6">
          <Tabs
            tabs={[
              {
                id: 'content',
                label: 'Content',
                content: (
                  <div className="space-y-4 pt-2">
                    {/* Lesson validation errors banner */}
                    {Object.keys(lessonErrors).length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-800">Please fix the following:</p>
                          <ul className="mt-0.5 list-disc list-inside text-xs text-red-700 space-y-0.5">
                            {Object.entries(lessonErrors).map(([key, msg]) => (
                              <li key={key}>{msg}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    <div>
                      <Input
                        label="Lesson Title"
                        value={lessonForm.title}
                        onChange={e => { setLessonForm({ ...lessonForm, title: e.target.value }); setLessonErrors(prev => { const { lessonTitle: _, ...rest } = prev; return rest; }); }}
                        placeholder="Enter lesson title"
                        required
                      />
                      <FieldError field="lessonTitle" errors={lessonErrors} />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Lesson Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['video', 'document', 'image'] as LessonType[]).map(type => {
                          const Icon = lessonTypeIcons[type];
                          return (
                            <button
                              key={type}
                              onClick={() => setLessonForm({ ...lessonForm, type })}
                              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                                lessonForm.type === type
                                  ? 'border-primary bg-primary-50 text-primary'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {lessonTypeLabels[type]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Select
                      label="Responsible (optional)"
                      value={lessonForm.responsible}
                      onChange={e => setLessonForm({ ...lessonForm, responsible: (e.target as HTMLSelectElement).value })}
                      options={[
                        { value: '', label: 'Select...' },
                        ...instructors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })),
                      ]}
                    />

                    {/* === VIDEO LESSON === */}
                    {lessonForm.type === 'video' && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                        <FileUpload
                          label="Upload Video"
                          accept="video/*"
                          maxSize={500 * 1024 * 1024} // 500 MB
                          folder="courses/videos"
                          hint="MP4, WebM, MOV up to 500 MB"
                          currentUrl={lessonForm.videoUrl.startsWith('http') && !lessonForm.videoUrl.includes('youtube') && !lessonForm.videoUrl.includes('vimeo') ? lessonForm.videoUrl : ''}
                          currentFilename={lessonForm.videoUrl ? 'Video file' : ''}
                          onUpload={(result) => {
                            setLessonForm(prev => ({ ...prev, videoUrl: result.url }));
                            setLessonErrors(prev => { const { videoUrl: _, ...rest } = prev; return rest; });
                          }}
                          onDurationDetected={(minutes) => {
                            setLessonForm(prev => ({ ...prev, videoDuration: minutes.toString() }));
                            setLessonErrors(prev => { const { videoDuration: _, ...rest } = prev; return rest; });
                          }}
                        />
                        <FieldError field="videoUrl" errors={lessonErrors} />
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex-1 h-px bg-gray-300" />
                          <span>or paste an external URL</span>
                          <div className="flex-1 h-px bg-gray-300" />
                        </div>
                        <Input
                          label="Video URL (YouTube / Vimeo / Direct)"
                          value={lessonForm.videoUrl}
                          onChange={e => { setLessonForm({ ...lessonForm, videoUrl: e.target.value }); setLessonErrors(prev => { const { videoUrl: _, ...rest } = prev; return rest; }); }}
                          placeholder="https://youtube.com/watch?v=... or direct URL"
                        />

                        {/* Video URL Preview */}
                        {lessonForm.videoUrl && (() => {
                          const url = lessonForm.videoUrl;
                          const ytMatch = url.match(
                            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
                          );
                          const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                          if (ytMatch) {
                            return (
                              <div className="rounded-lg overflow-hidden border border-gray-200">
                                <iframe
                                  src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                  className="w-full aspect-video"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title="Video preview"
                                />
                              </div>
                            );
                          }
                          if (vimeoMatch) {
                            return (
                              <div className="rounded-lg overflow-hidden border border-gray-200">
                                <iframe
                                  src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                  className="w-full aspect-video"
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  allowFullScreen
                                  title="Video preview"
                                />
                              </div>
                            );
                          }
                          // Direct video URL — show native player (only if not already shown by FileUpload)
                          if (url.startsWith('http') && !url.includes('youtube') && !url.includes('vimeo')) {
                            return (
                              <div className="rounded-lg overflow-hidden bg-black border border-gray-200">
                                <video
                                  src={url}
                                  controls
                                  preload="metadata"
                                  className="w-full max-h-[240px]"
                                  playsInline
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div>
                          <Input
                            label="Duration (minutes)"
                            type="number"
                            value={lessonForm.videoDuration}
                            onChange={e => { setLessonForm({ ...lessonForm, videoDuration: e.target.value }); setLessonErrors(prev => { const { videoDuration: _, ...rest } = prev; return rest; }); }}
                            placeholder="Auto-detected on upload, or enter manually"
                            helperText={lessonForm.videoDuration ? `${lessonForm.videoDuration} min` : 'Will be auto-detected when uploading a video file'}
                          />
                          <FieldError field="videoDuration" errors={lessonErrors} />
                        </div>
                      </div>
                    )}

                    {/* === DOCUMENT LESSON === */}
                    {lessonForm.type === 'document' && (
                      <div className="space-y-4 p-4 bg-emerald-50 rounded-lg">
                        <FileUpload
                          label="Upload Document"
                          accept=".pdf,.doc,.docx,.pptx,.ppt,.xls,.xlsx,.txt"
                          maxSize={100 * 1024 * 1024} // 100 MB
                          folder="courses/documents"
                          hint="PDF, DOCX, PPTX up to 100 MB"
                          currentUrl={lessonForm.documentUrl}
                          currentFilename={lessonForm.documentFilename}
                          onUpload={(result) => {
                            setLessonForm({
                              ...lessonForm,
                              documentUrl: result.url,
                              documentFilename: result.filename,
                              documentSize: result.size,
                            });
                            setLessonErrors(prev => { const { documentUrl: _, ...rest } = prev; return rest; });
                          }}
                        />
                        <FieldError field="documentUrl" errors={lessonErrors} />
                        <Toggle
                          checked={lessonForm.allowDownload}
                          onChange={v => setLessonForm({ ...lessonForm, allowDownload: v })}
                          label="Allow Download"
                        />
                      </div>
                    )}

                    {/* === IMAGE LESSON === */}
                    {lessonForm.type === 'image' && (
                      <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
                        <FileUpload
                          label="Upload Image"
                          accept="image/*"
                          maxSize={10 * 1024 * 1024} // 10 MB
                          folder="courses/images"
                          hint="PNG, JPG, GIF, WebP up to 10 MB"
                          currentUrl={lessonForm.imageUrl}
                          currentFilename={lessonForm.imageFilename}
                          onUpload={(result) => {
                            setLessonForm({
                              ...lessonForm,
                              imageUrl: result.url,
                              imageFilename: result.filename,
                            });
                            setLessonErrors(prev => { const { imageUrl: _, ...rest } = prev; return rest; });
                          }}
                        />
                        <FieldError field="imageUrl" errors={lessonErrors} />
                        <Toggle
                          checked={lessonForm.allowDownload}
                          onChange={v => setLessonForm({ ...lessonForm, allowDownload: v })}
                          label="Allow Download"
                        />
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: 'description',
                label: 'Description',
                content: (
                  <div className="pt-2">
                    <Textarea
                      label="Lesson Description"
                      value={lessonForm.description}
                      onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                      placeholder="Describe what this lesson covers..."
                      className="min-h-[150px]"
                    />
                  </div>
                ),
              },
              {
                id: 'attachments',
                label: 'Additional Attachments',
                content: (
                  <div className="pt-2 space-y-4">
                    <p className="text-sm text-gray-500">Add extra resources for learners (files or links).</p>
                    {lessonForm.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {att.type === 'file' ? <Upload className="w-4 h-4 text-gray-400" /> : <LinkIcon className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm flex-1">{att.title || att.url}</span>
                        <button
                          onClick={() => setLessonForm({
                            ...lessonForm,
                            attachments: lessonForm.attachments.filter((_, i) => i !== idx),
                          })}
                          className="text-red-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLessonForm({
                          ...lessonForm,
                          attachments: [...lessonForm.attachments, { title: 'New File', type: 'file', url: '' }],
                        })}
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLessonForm({
                          ...lessonForm,
                          attachments: [...lessonForm.attachments, { title: 'New Link', type: 'link', url: '' }],
                        })}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Add Link
                      </Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setLessonModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson} disabled={isPending}>
              {isPending ? 'Saving...' : editingLesson ? 'Save Changes' : 'Add Lesson'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cover Image Upload Modal */}
      <Modal
        isOpen={coverUploadOpen}
        onClose={() => setCoverUploadOpen(false)}
        title="Upload Cover Image"
        size="sm"
      >
        <div className="p-6">
          <FileUpload
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            folder="courses/covers"
            hint="PNG, JPG up to 5 MB. Recommended: 1200×600"
            currentUrl={coverImageUrl}
            onUpload={(result) => {
              setCoverImageUrl(result.url);
              setCoverUploadOpen(false);
            }}
          />
        </div>
      </Modal>

      {/* Add Attendees Modal */}
      <Modal
        isOpen={attendeeModalOpen}
        onClose={() => setAttendeeModalOpen(false)}
        title="Add Attendees"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Send an email invitation to add a learner to this course.</p>
          <Input
            label="Email Address"
            type="email"
            value={attendeeEmail}
            onChange={e => setAttendeeEmail(e.target.value)}
            placeholder="learner@example.com"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAttendeeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvitation} disabled={isPending || !attendeeEmail}>
              {isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contact Attendees Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Contact Attendees"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">Send a message to all enrolled attendees.</p>
          <Input
            label="Subject"
            value={contactSubject}
            onChange={e => setContactSubject(e.target.value)}
            placeholder="Email subject"
          />
          <Textarea
            label="Message"
            value={contactMessage}
            onChange={e => setContactMessage(e.target.value)}
            placeholder="Write your message..."
            className="min-h-[120px]"
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { setContactModalOpen(false); }}>
              Send Message
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm.type}?`}
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
