import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BadgeLevel, BADGE_THRESHOLDS, LearnerCourseStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateBadge(totalPoints: number): BadgeLevel {
  if (totalPoints >= 120) return 'master';
  if (totalPoints >= 100) return 'expert';
  if (totalPoints >= 80) return 'specialist';
  if (totalPoints >= 60) return 'achiever';
  if (totalPoints >= 40) return 'explorer';
  return 'newbie';
}

export function getNextBadge(currentBadge: BadgeLevel): { badge: BadgeLevel; pointsNeeded: number } | null {
  const order: BadgeLevel[] = ['newbie', 'explorer', 'achiever', 'specialist', 'expert', 'master'];
  const currentIndex = order.indexOf(currentBadge);
  if (currentIndex >= order.length - 1) return null;
  const nextBadge = order[currentIndex + 1];
  return { badge: nextBadge, pointsNeeded: BADGE_THRESHOLDS[nextBadge] };
}

export function getStatusColor(status: LearnerCourseStatus): string {
  switch (status) {
    case 'yet_to_start': return 'text-gray-500 bg-gray-100';
    case 'in_progress': return 'text-blue-700 bg-blue-100';
    case 'completed': return 'text-green-700 bg-green-100';
  }
}

export function getStatusLabel(status: LearnerCourseStatus): string {
  switch (status) {
    case 'yet_to_start': return 'Yet to Start';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
  }
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
