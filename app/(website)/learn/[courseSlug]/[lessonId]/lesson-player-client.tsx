'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  PlayCircle, Menu, X, FileText, Image as ImageIcon, HelpCircle,
  Video, Download, ExternalLink, Trophy, PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { formatDuration, getNextBadge } from '@/lib/utils';
import { BADGE_LABELS, BadgeLevel, LessonType } from '@/lib/types';
import { markLessonComplete, submitQuizAttempt } from '@/lib/actions';
import type { Course, Lesson, LessonAttachment, LessonProgress, CourseEnrollment, Quiz, QuizQuestion, QuizAttempt } from '@/lib/types';

const typeIcons: Record<LessonType, React.ElementType> = {
  video: Video,
  document: FileText,
  image: ImageIcon,
  quiz: HelpCircle,
};

/**
 * Detect if a URL is a YouTube/Vimeo embed and return the embed URL.
 * Returns null for direct video URLs.
 */
function getVideoEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

/**
 * Check if a URL points to a PDF document.
 */
function isPdf(url: string, filename?: string): boolean {
  if (filename?.toLowerCase().endsWith('.pdf')) return true;
  try { return new URL(url).pathname.toLowerCase().endsWith('.pdf'); } catch { return false; }
}

interface Props {
  course: Course;
  courseLessons: Lesson[];
  currentLesson: Lesson;
  attachments: LessonAttachment[];
  enrollment: CourseEnrollment | null;
  userProgress: LessonProgress[];
  quiz: Quiz | null;
  quizQuestions: QuizQuestion[];
  quizAttempts: QuizAttempt[];
  user: { id: string; total_points: number; current_badge: BadgeLevel };
}

export default function LessonPlayerClient({
  course, courseLessons, currentLesson, attachments,
  enrollment, userProgress, quiz, quizQuestions: quizQuestionsList,
  quizAttempts, user,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const courseSlug = course.slug;

  const currentIndex = courseLessons.findIndex(l => l.id === currentLesson.id);
  const completedCount = userProgress.filter(lp => lp.is_completed).length;
  const completionPercentage = courseLessons.length > 0
    ? Math.round((completedCount / courseLessons.length) * 100)
    : 0;

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Points popup
  const [pointsPopup, setPointsPopup] = useState<{ show: boolean; points: number }>({ show: false, points: 0 });
  const [showCourseComplete, setShowCourseComplete] = useState(false);

  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const getLessonStatus = (lId: string) => {
    const progress = userProgress.find(lp => lp.lesson_id === lId);
    if (!progress) return 'not_started';
    if (progress.is_completed) return 'completed';
    return 'in_progress';
  };

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: [optionId],
    });
  };

  const handleProceedQuestion = () => {
    if (currentQuestionIndex < quizQuestionsList.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit quiz attempt via server action
      if (quiz && enrollment) {
        startTransition(async () => {
          const result = await submitQuizAttempt(quiz.id, enrollment.id, selectedAnswers);
          setQuizScore(result.correctCount);
          setQuizCompleted(true);
          if (result.pointsEarned > 0) {
            setPointsPopup({ show: true, points: result.pointsEarned });
          }
        });
      } else {
        // Calculate score locally if no enrollment
        let correct = 0;
        quizQuestionsList.forEach(q => {
          const selected = selectedAnswers[q.id] || [];
          const isCorrect = q.correct_answer_ids.length === selected.length &&
            q.correct_answer_ids.every(id => selected.includes(id));
          if (isCorrect) correct++;
        });
        setQuizScore(correct);
        setQuizCompleted(true);
      }
    }
  };

  const handleMarkComplete = () => {
    if (!enrollment) return;
    startTransition(async () => {
      await markLessonComplete(currentLesson.id, course.id, enrollment.id);
      router.refresh();
    });
  };

  const handleCompleteThisCourse = () => {
    setShowCourseComplete(true);
  };

  const isCurrentLessonComplete = getLessonStatus(currentLesson.id) === 'completed';
  const isLastLessonCompleted = completedCount >= courseLessons.length - 1;

  const currentQ = quizQuestionsList[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
        <Link
          href={`/my-courses`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
        </div>
        {nextLesson ? (
          <Link
            href={`/learn/${courseSlug}/${nextLesson.id}`}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary-dark transition-colors"
          >
            Next Content
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : isLastLessonCompleted ? (
          <Button size="sm" onClick={handleCompleteThisCourse}>
            Complete Course
          </Button>
        ) : (
          <span className="text-sm text-gray-400">Last Lesson</span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            'flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto transition-all duration-300',
            sidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {sidebarOpen && (
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">{course.title}</h3>
                <div className="mt-2">
                  <ProgressBar value={completionPercentage} showLabel size="sm" />
                </div>
              </div>

              <div className="space-y-1">
                {courseLessons.map((lesson) => {
                  const status = getLessonStatus(lesson.id);
                  const isActive = lesson.id === currentLesson.id;
                  const Icon = typeIcons[lesson.lesson_type];

                  return (
                    <div key={lesson.id}>
                      <Link
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <div className="flex-shrink-0">
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          ) : status === 'in_progress' ? (
                            <PlayCircle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                        <span className="flex-1 truncate">{lesson.title}</span>
                        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-20 left-0 z-10 p-1.5 bg-white border border-gray-200 rounded-r-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
          style={{ left: sidebarOpen ? '320px' : '0px' }}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h1>
            {currentLesson.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{currentLesson.description}</p>
            )}

            {/* ======== VIDEO PLAYER ======== */}
            {currentLesson.lesson_type === 'video' && currentLesson.video_url && (
              <div className="mb-6">
                {(() => {
                  const embedUrl = getVideoEmbedUrl(currentLesson.video_url);
                  if (embedUrl) {
                    // YouTube / Vimeo embed
                    return (
                      <div className="rounded-xl overflow-hidden aspect-video">
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          title={currentLesson.title}
                        />
                      </div>
                    );
                  }
                  // Direct video URL (S3, etc.) — native HTML5 player
                  return (
                    <div className="rounded-xl overflow-hidden bg-black">
                      <video
                        src={currentLesson.video_url}
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        className="w-full aspect-video"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  );
                })()}
                {currentLesson.video_duration_minutes != null && currentLesson.video_duration_minutes > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Duration: {formatDuration(currentLesson.video_duration_minutes)}
                  </p>
                )}
              </div>
            )}

            {/* ======== DOCUMENT VIEWER ======== */}
            {currentLesson.lesson_type === 'document' && (
              <div className="mb-6">
                {currentLesson.document_url && isPdf(currentLesson.document_url, currentLesson.document_filename || undefined) ? (
                  // Inline PDF viewer
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <iframe
                      src={currentLesson.document_url}
                      className="w-full"
                      style={{ height: '80vh', minHeight: '500px' }}
                      title={currentLesson.title}
                    />
                  </div>
                ) : (
                  // Non-PDF document — show download card
                  <div className="bg-gray-50 rounded-xl p-12 flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium text-gray-700">{currentLesson.document_filename || 'Document'}</p>
                      {currentLesson.document_size_bytes && (
                        <p className="text-sm text-gray-500 mt-1">
                          Size: {(currentLesson.document_size_bytes / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentLesson.document_allow_download && currentLesson.document_url && (
                  <div className="mt-3">
                    <a href={currentLesson.document_url} download target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                        Download {currentLesson.document_filename || 'Document'}
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ======== IMAGE VIEWER ======== */}
            {currentLesson.lesson_type === 'image' && (
              <div className="mb-6">
                {currentLesson.image_url && (
                  <div className="rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={currentLesson.image_url}
                      alt={currentLesson.title}
                      className="w-full max-h-[700px] object-contain"
                    />
                  </div>
                )}
                {currentLesson.image_allow_download && currentLesson.image_url && (
                  <div className="mt-3">
                    <a href={currentLesson.image_url} download target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                        Download Image
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ======== QUIZ ======== */}
            {currentLesson.lesson_type === 'quiz' && quiz && (
              <div className="mb-6">
                {!quizStarted && !quizCompleted && (
                  <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-8 text-center">
                    <HelpCircle className="w-16 h-16 mx-auto text-primary mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
                    {quiz.description && (
                      <p className="text-gray-600 mb-4">{quiz.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-600">
                      <span>{quizQuestionsList.length} questions</span>
                      {quiz.allow_multiple_attempts && <span>Multiple attempts</span>}
                      {quiz.time_limit_minutes && <span>{quiz.time_limit_minutes} min limit</span>}
                    </div>
                    {quizAttempts.length > 0 && (
                      <p className="text-sm text-gray-500 mb-4">
                        Previous attempts: {quizAttempts.length} | Best score: {Math.max(...quizAttempts.map(a => a.score_percentage))}%
                      </p>
                    )}
                    <Button size="lg" onClick={() => setQuizStarted(true)}>
                      {quizAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                    </Button>
                  </div>
                )}

                {quizStarted && !quizCompleted && currentQ && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <Badge variant="primary">
                        Question {currentQuestionIndex + 1} of {quizQuestionsList.length}
                      </Badge>
                      <ProgressBar
                        value={((currentQuestionIndex + 1) / quizQuestionsList.length) * 100}
                        className="w-32"
                        size="sm"
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-6">{currentQ.question_text}</h3>

                    <div className="space-y-3">
                      {currentQ.options.map(option => {
                        const isSelected = (selectedAnswers[currentQ.id] || []).includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleSelectAnswer(currentQ.id, option.id)}
                            className={cn(
                              'w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all cursor-pointer',
                              isSelected
                                ? 'border-primary bg-primary-50 text-primary'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                          >
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                              )}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm font-medium">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={handleProceedQuestion}
                        disabled={!selectedAnswers[currentQ.id]?.length || isPending}
                      >
                        {currentQuestionIndex === quizQuestionsList.length - 1
                          ? 'Proceed and Complete Quiz'
                          : 'Proceed'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {quizCompleted && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
                    <p className="text-gray-600 mb-4">
                      You got {quizScore} out of {quizQuestionsList.length} correct
                    </p>
                    <div className="text-3xl font-bold text-primary mb-4">
                      {Math.round((quizScore / quizQuestionsList.length) * 100)}%
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuizStarted(false);
                        setQuizCompleted(false);
                        setCurrentQuestionIndex(0);
                        setSelectedAnswers({});
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mark as complete button */}
            {enrollment && !isCurrentLessonComplete && currentLesson.lesson_type !== 'quiz' && (
              <div className="mb-6">
                <Button onClick={handleMarkComplete} disabled={isPending}>
                  <CheckCircle2 className="w-4 h-4" />
                  {isPending ? 'Marking...' : 'Mark as Complete'}
                </Button>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Resources</h3>
                <div className="space-y-2">
                  {attachments.map(att => (
                    <a
                      key={att.id}
                      href={att.attachment_type === 'file' ? att.file_url : att.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 hover:border-primary/50 transition-colors"
                    >
                      {att.attachment_type === 'file' ? (
                        <Download className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">{att.title}</span>
                      {att.file_name && (
                        <span className="text-xs text-gray-400 ml-auto">{att.file_name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
              {prevLesson ? (
                <Link
                  href={`/learn/${courseSlug}/${prevLesson.id}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {prevLesson.title}
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                <Link href={`/learn/${courseSlug}/${nextLesson.id}`}>
                  <Button>
                    Next Content
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button onClick={handleCompleteThisCourse}>
                  Complete Course
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Points Popup */}
      <Modal isOpen={pointsPopup.show} onClose={() => setPointsPopup({ show: false, points: 0 })} size="sm">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Congratulations!</h2>
          <p className="text-gray-600 mt-2">You have earned</p>
          <p className="text-4xl font-bold text-primary my-3">+{pointsPopup.points} points</p>
          {(() => {
            const next = getNextBadge(user.current_badge);
            if (next) {
              const pointsToNext = next.pointsNeeded - user.total_points;
              return (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Progress to next badge</p>
                  <p className="text-sm font-medium text-gray-700">
                    {BADGE_LABELS[next.badge]} — {pointsToNext > 0 ? `${pointsToNext} more points needed` : 'Almost there!'}
                  </p>
                  <ProgressBar
                    value={(user.total_points / next.pointsNeeded) * 100}
                    size="sm"
                    className="mt-2"
                  />
                </div>
              );
            }
            return null;
          })()}
          <Button className="mt-6" onClick={() => setPointsPopup({ show: false, points: 0 })}>
            Continue
          </Button>
        </div>
      </Modal>

      {/* Course Completion Modal */}
      <Modal isOpen={showCourseComplete} onClose={() => setShowCourseComplete(false)} size="sm">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Course Completed! 🎉</h2>
          <p className="text-gray-600 mt-2">
            Congratulations! You have completed &ldquo;{course.title}&rdquo;
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={`/courses/${course.slug}`}>
              <Button className="w-full">View Course</Button>
            </Link>
            <Link href="/my-courses">
              <Button variant="outline" className="w-full">Back to My Courses</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
