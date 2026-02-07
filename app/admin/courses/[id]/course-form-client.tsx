'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCourseEditLeaveCheck } from '@/lib/course-edit-context';
import {
  ArrowLeft, Eye, UserPlus, Mail, Upload, Video, FileText,
  Image as ImageIcon, HelpCircle, MoreVertical, Edit, Trash2, Plus,
  GripVertical, ExternalLink, Link as LinkIcon, AlertTriangle, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
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

const DRAFT_KEY = (id: string) => `learnsphere-course-draft-${id}`;
const RETURN_FROM_QUIZ_KEY = 'learnsphere-return-from-quiz-builder';

type CourseDraft = {
  isPublished: boolean;
  title: string;
  courseTagsState: string[];
  websiteUrl: string;
  adminId: string;
  description: string;
  visibility: CourseVisibility;
  accessRule: CourseAccessRule;
  price: string;
  coverImageUrl: string;
};

function getDraft(courseId: string): CourseDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY(courseId));
    const fromQuiz = sessionStorage.getItem(RETURN_FROM_QUIZ_KEY);
    if (!raw || fromQuiz !== courseId) return null;
    return JSON.parse(raw) as CourseDraft;
  } catch {
    return null;
  }
}

function saveDraft(courseId: string, draft: CourseDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY(courseId), JSON.stringify(draft));
    sessionStorage.setItem(RETURN_FROM_QUIZ_KEY, courseId);
  } catch {}
}

function clearDraft(courseId: string) {
  try {
    sessionStorage.removeItem(DRAFT_KEY(courseId));
    if (sessionStorage.getItem(RETURN_FROM_QUIZ_KEY) === courseId) {
      sessionStorage.removeItem(RETURN_FROM_QUIZ_KEY);
    }
  } catch {}
}

export default function CourseFormClient({ course, lessons: initialLessons, quizzes: initialQuizzes, instructors, tags: allTags, isAdmin = false }: Props) {
  const router = useRouter();
  const leaveCheckCtx = useCourseEditLeaveCheck();
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

  const savedSnapshotRef = useRef<CourseDraft | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const leaveResolveRef = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    const draft = getDraft(course.id);
    if (draft) {
      setIsPublished(draft.isPublished);
      setTitle(draft.title);
      setCourseTags(draft.courseTagsState);
      setWebsiteUrl(draft.websiteUrl);
      setAdminId(draft.adminId);
      setDescription(draft.description);
      setVisibility(draft.visibility);
      setAccessRule(draft.accessRule);
      setPrice(draft.price);
      setCoverImageUrl(draft.coverImageUrl);
      savedSnapshotRef.current = draft;
      sessionStorage.removeItem(RETURN_FROM_QUIZ_KEY);
    } else {
      const server: CourseDraft = {
        isPublished: course.status === 'published',
        title: course.title,
        courseTagsState: course.tags || [],
        websiteUrl: course.website_url || '',
        adminId: course.course_admin_id || '',
        description: course.full_description || '',
        visibility: course.visibility,
        accessRule: course.access_rule,
        price: course.price?.toString() || '',
        coverImageUrl: course.cover_image_url || '',
      };
      savedSnapshotRef.current = server;
      sessionStorage.removeItem(DRAFT_KEY(course.id));
    }
  }, [course.id]);

  const currentDraft = (): CourseDraft => ({
    isPublished,
    title,
    courseTagsState,
    websiteUrl,
    adminId,
    description,
    visibility,
    accessRule,
    price,
    coverImageUrl,
  });

  const hasUnsavedChanges = useCallback(() => {
    const snap = savedSnapshotRef.current;
    if (!snap) return false;
    const cur = currentDraft();
    return (
      snap.isPublished !== cur.isPublished ||
      snap.title !== cur.title ||
      JSON.stringify(snap.courseTagsState) !== JSON.stringify(cur.courseTagsState) ||
      snap.websiteUrl !== cur.websiteUrl ||
      snap.adminId !== cur.adminId ||
      snap.description !== cur.description ||
      snap.visibility !== cur.visibility ||
      snap.accessRule !== cur.accessRule ||
      snap.price !== cur.price ||
      snap.coverImageUrl !== cur.coverImageUrl
    );
  }, [isPublished, title, courseTagsState, websiteUrl, adminId, description, visibility, accessRule, price, coverImageUrl]);

  const runLeaveCheck = useCallback((): Promise<boolean> => {
    if (!hasUnsavedChanges()) return Promise.resolve(true);
    return new Promise((resolve) => {
      leaveResolveRef.current = resolve;
      setLeaveConfirmOpen(true);
    });
  }, [hasUnsavedChanges]);

  useEffect(() => {
    leaveCheckCtx?.setLeaveCheck(runLeaveCheck);
    return () => leaveCheckCtx?.setLeaveCheck(null);
  }, [leaveCheckCtx, runLeaveCheck]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

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
        if (isAdmin) {
          data.course_admin_id = adminId || null;
        }
        await updateCourse(course.id, data);
        savedSnapshotRef.current = currentDraft();
        clearDraft(course.id);
        router.push('/admin/courses');
      } catch (err: any) {
        setCourseErrors({ _global: err?.message || 'Failed to save course.' });
      }
    });
  };

  const goToQuizBuilder = (path: string) => {
    saveDraft(course.id, currentDraft());
    router.push(path);
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    runLeaveCheck().then((ok) => {
      if (ok) {
        clearDraft(course.id);
        router.push('/admin/courses');
      }
    });
  };

  const handleLeaveConfirm = (leave: boolean) => {
    leaveResolveRef.current?.(leave);
    leaveResolveRef.current = null;
    setLeaveConfirmOpen(false);
    if (leave) clearDraft(course.id);
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

  // ─── Tab: Content ───
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

  // ─── Tab: Description ───
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

  // ─── Tab: Quiz ───
  const QuizTab = (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Quizzes ({initialQuizzes.length})</h3>
        <Button size="sm" onClick={() => goToQuizBuilder(`/admin/courses/${course.id}/quiz-builder/new`)}>
          <Plus className="w-4 h-4" />
          Add Quiz
        </Button>
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
                onClick={() => goToQuizBuilder(`/admin/courses/${course.id}/quiz-builder/${quiz.id}`)}
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

      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/admin/courses"
          onClick={handleBackClick}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{title || 'New Course'}</h1>
        </div>
        <Toggle
          checked={isPublished}
          onChange={(v) => {
            setIsPublished(v);
            if (!v) setCourseErrors(prev => { const { websiteUrl: _, ...rest } = prev; return rest; });
          }}
          label={isPublished ? 'Published' : 'Draft'}
        />
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* ─── Two-column: Cover Image + Course Details ─── */}
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        {/* Left: Cover Image */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {coverImageUrl ? (
              <div className="relative group">
                <img src={coverImageUrl} alt="Course cover" className="w-full aspect-[16/10] object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => setCoverUploadOpen(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg text-sm font-medium text-gray-700 shadow-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Change Cover
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCoverUploadOpen(true)}
                className="w-full aspect-[16/10] bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Upload Cover Image</p>
                  <p className="text-xs text-gray-400 mt-0.5">Recommended: 1200 × 600</p>
                </div>
              </button>
            )}
          </div>

          {/* Quick actions under cover */}
          <div className="flex flex-wrap gap-2 mt-3">
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
              Mail Participants
            </Button>
          </div>
        </div>

        {/* Right: Course Details + Inline Options */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {/* Title */}
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

            {/* Website URL */}
            <div>
              <Input
                label="Website URL"
                value={websiteUrl}
                onChange={e => { setWebsiteUrl(e.target.value); setCourseErrors(prev => { const { websiteUrl: _, ...rest } = prev; return rest; }); }}
                placeholder="https://..."
              />
              {isPublished && !websiteUrl.trim() && !courseErrors.websiteUrl && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  Required before publishing
                </p>
              )}
              <FieldError field="websiteUrl" errors={courseErrors} />
            </div>

            {/* Visibility + Access Rule side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/80">Visibility</label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as CourseVisibility)}>
                  <SelectTrigger className="w-full h-10 rounded-xl border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="signed_in">Signed In Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/80">Access Rule</label>
                <Select value={accessRule} onValueChange={(v) => setAccessRule(v as CourseAccessRule)}>
                  <SelectTrigger className="w-full h-10 rounded-xl border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="on_invitation">On Invitation</SelectItem>
                    <SelectItem value="on_payment">On Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price (conditional) */}
            {accessRule === 'on_payment' && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
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

            {/* Tags */}
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

            {/* Course Admin */}
            {isAdmin ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/80">Course Admin</label>
                <Select value={adminId || '_none'} onValueChange={(v) => setAdminId(v === '_none' ? '' : v)}>
                  <SelectTrigger className="w-full h-10 rounded-xl border-border">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select...</SelectItem>
                    {instructors.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
      </div>

      {/* ─── Tabs: Content | Description | Quiz ─── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <Tabs
          tabs={[
            { id: 'content', label: 'Content', content: ContentTab },
            { id: 'description', label: 'Description', content: DescriptionTab },
            { id: 'quiz', label: 'Quiz', content: QuizTab },
          ]}
        />
      </div>

      {/* ─── Lesson Editor Modal ─── */}
      <Modal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add Content'}
        size="lg"
      >
        <div className="p-6">
          {/* Lesson validation errors banner */}
          {Object.keys(lessonErrors).length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
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

          {/* Title + Responsible — always visible above tabs */}
          <div className="space-y-4 mb-5">
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/80">Responsible (optional)</label>
              <Select value={lessonForm.responsible || '_none'} onValueChange={(v) => setLessonForm({ ...lessonForm, responsible: v === '_none' ? '' : v })}>
                <SelectTrigger className="w-full h-10 rounded-xl border-border">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Select...</SelectItem>
                  {instructors.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs
            tabs={[
              {
                id: 'content',
                label: 'Content',
                content: (
                  <div className="space-y-4 pt-2">
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

                    {/* === VIDEO LESSON === */}
                    {lessonForm.type === 'video' && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {(() => {
                          const url = lessonForm.videoUrl;
                          const isYouTube = url && /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(url);
                          const isVimeo = url && /vimeo\.com\/\d+/.test(url);
                          const isDirectUpload = url && url.startsWith('http') && !isYouTube && !isVimeo;

                          return (
                            <>
                              <FileUpload
                                label="Upload Video"
                                accept="video/*"
                                maxSize={500 * 1024 * 1024}
                                folder="courses/videos"
                                hint="MP4, WebM, MOV up to 500 MB"
                                currentUrl={isDirectUpload ? url : ''}
                                currentFilename={isDirectUpload ? 'Video file' : ''}
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

                              {/* Note: Video preview is shown by FileUpload when there's a direct upload — no duplicate here */}

                              {/* External URL input — only show when there is NO direct upload */}
                              {!isDirectUpload && (
                                <>
                                  {/* YouTube / Vimeo preview */}
                                  {isYouTube && (() => {
                                    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                                    return ytMatch ? (
                                      <div className="rounded-lg overflow-hidden border border-gray-200">
                                        <iframe
                                          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                          className="w-full aspect-video"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          title="Video preview"
                                        />
                                      </div>
                                    ) : null;
                                  })()}
                                  {isVimeo && (() => {
                                    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                                    return vimeoMatch ? (
                                      <div className="rounded-lg overflow-hidden border border-gray-200">
                                        <iframe
                                          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                          className="w-full aspect-video"
                                          allow="autoplay; fullscreen; picture-in-picture"
                                          allowFullScreen
                                          title="Video preview"
                                        />
                                      </div>
                                    ) : null;
                                  })()}
                                </>
                              )}

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
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* === DOCUMENT LESSON === */}
                    {lessonForm.type === 'document' && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <FileUpload
                          label="Upload Document"
                          accept=".pdf,.doc,.docx,.pptx,.ppt,.xls,.xlsx,.txt"
                          maxSize={100 * 1024 * 1024}
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
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <FileUpload
                          label="Upload Image"
                          accept="image/*"
                          maxSize={10 * 1024 * 1024}
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
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {att.type === 'file' ? <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                          {att.type === 'link' ? (
                            <div className="flex-1 space-y-2 min-w-0">
                              <Input
                                placeholder="Link title (e.g. Reference document)"
                                value={att.title}
                                onChange={e => {
                                  const next = [...lessonForm.attachments];
                                  next[idx] = { ...next[idx], title: e.target.value };
                                  setLessonForm({ ...lessonForm, attachments: next });
                                }}
                                className="text-sm"
                              />
                              <Input
                                placeholder="https://example.com"
                                value={att.url}
                                onChange={e => {
                                  const next = [...lessonForm.attachments];
                                  next[idx] = { ...next[idx], url: e.target.value };
                                  setLessonForm({ ...lessonForm, attachments: next });
                                }}
                                className="text-sm"
                              />
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <FileUpload
                                compact
                                accept="*"
                                maxSize={100 * 1024 * 1024}
                                folder="courses/attachments"
                                currentUrl={att.url}
                                currentFilename={att.title || undefined}
                                onUpload={(result) => {
                                  const next = [...lessonForm.attachments];
                                  next[idx] = { ...next[idx], url: result.url, title: result.filename };
                                  setLessonForm({ ...lessonForm, attachments: next });
                                }}
                              />
                            </div>
                          )}
                          <button
                            onClick={() => setLessonForm({
                              ...lessonForm,
                              attachments: lessonForm.attachments.filter((_, i) => i !== idx),
                            })}
                            className="text-red-400 hover:text-red-600 cursor-pointer flex-shrink-0 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Leave course – unsaved changes */}
      <ConfirmDialog
        isOpen={leaveConfirmOpen}
        onClose={() => handleLeaveConfirm(false)}
        onConfirm={() => handleLeaveConfirm(true)}
        title="Leave course?"
        message="You have unsaved changes. If you leave now, your progress will be lost. Are you sure?"
        confirmLabel="Leave"
        danger
      />
    </div>
  );
}
