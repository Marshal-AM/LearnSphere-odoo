'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Eye, UserPlus, Mail, Upload, Video, FileText,
  Image as ImageIcon, HelpCircle, MoreVertical, Edit, Trash2, Plus,
  GripVertical, ExternalLink, Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea, Select } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
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
}

export default function CourseFormClient({ course, lessons: initialLessons, quizzes: initialQuizzes, instructors, tags: allTags }: Props) {
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

  // Lesson editor
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', type: 'video' as LessonType, responsible: '',
    videoUrl: '', videoDuration: '', documentUrl: '', allowDownload: true,
    imageUrl: '', description: '', attachments: [] as { title: string; type: 'file' | 'link'; url: string }[],
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

  const handleSave = () => {
    startTransition(async () => {
      await updateCourse(course.id, {
        title,
        full_description: description,
        visibility,
        access_rule: accessRule,
        price: accessRule === 'on_payment' ? parseFloat(price) || null : null,
        website_url: websiteUrl || undefined,
        course_admin_id: adminId || null,
        tags: courseTagsState,
        status: isPublished ? 'published' : 'draft',
      });
      router.refresh();
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
          allowDownload: lesson.document_allow_download,
          imageUrl: lesson.image_url || '',
          description: lesson.description || '',
          attachments: [],
        });
      }
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '', type: 'video', responsible: '',
        videoUrl: '', videoDuration: '', documentUrl: '', allowDownload: true,
        imageUrl: '', description: '', attachments: [],
      });
    }
    setLessonModalOpen(true);
  };

  const handleSaveLesson = () => {
    startTransition(async () => {
      if (editingLesson) {
        await updateLesson(editingLesson, {
          title: lessonForm.title,
          lesson_type: lessonForm.type,
          responsible_user_id: lessonForm.responsible || null,
          video_url: lessonForm.videoUrl || null,
          video_duration_minutes: lessonForm.videoDuration ? parseInt(lessonForm.videoDuration) : null,
          document_url: lessonForm.documentUrl || null,
          image_url: lessonForm.imageUrl || null,
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
          video_duration_minutes: lessonForm.videoDuration ? parseInt(lessonForm.videoDuration) : undefined,
          document_url: lessonForm.documentUrl || undefined,
          image_url: lessonForm.imageUrl || undefined,
          description: lessonForm.description || undefined,
          document_allow_download: lessonForm.allowDownload,
          image_allow_download: lessonForm.allowDownload,
        });
      }
      setLessonModalOpen(false);
      router.refresh();
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
              onChange={e => setPrice(e.target.value)}
              placeholder="49.99"
            />
          </div>
        )}
      </div>

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
          onChange={setIsPublished}
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
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>
      </div>

      {/* Course fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Course title"
            required
          />
          <Input
            label="Website URL"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            helperText={isPublished ? 'Required when published' : undefined}
          />
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
          <Select
            label="Responsible / Course Admin"
            value={adminId}
            onChange={e => setAdminId((e.target as HTMLSelectElement).value)}
            options={[
              { value: '', label: 'Select...' },
              ...instructors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })),
            ]}
          />
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
                    <Input
                      label="Lesson Title"
                      value={lessonForm.title}
                      onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Enter lesson title"
                      required
                    />
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
                    {lessonForm.type === 'video' && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                        <Input
                          label="Video URL"
                          value={lessonForm.videoUrl}
                          onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                          placeholder="YouTube / Google Drive / Vimeo URL"
                        />
                        <Input
                          label="Duration (minutes)"
                          type="number"
                          value={lessonForm.videoDuration}
                          onChange={e => setLessonForm({ ...lessonForm, videoDuration: e.target.value })}
                          placeholder="30"
                        />
                      </div>
                    )}
                    {lessonForm.type === 'document' && (
                      <div className="space-y-4 p-4 bg-emerald-50 rounded-lg">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click or drag to upload a document</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX up to 100MB</p>
                        </div>
                        <Toggle
                          checked={lessonForm.allowDownload}
                          onChange={v => setLessonForm({ ...lessonForm, allowDownload: v })}
                          label="Allow Download"
                        />
                      </div>
                    )}
                    {lessonForm.type === 'image' && (
                      <div className="space-y-4 p-4 bg-amber-50 rounded-lg">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click or drag to upload an image</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </div>
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
