'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Users, Clock, RefreshCw, ExternalLink,
  Loader2, PhoneCall, UserCheck, Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Meeting {
  id: string;
  room_name: string;
  room_url: string;
  course_id: string;
  student_id: string;
  student_name: string;
  status: string;
  created_at: string;
}

export default function MeetingsClient({
  user,
}: {
  user: { id: string; first_name: string; last_name: string };
}) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMeetings = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/meetings/instructor');
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(() => fetchMeetings(), 6000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  const joinMeeting = (roomUrl: string) => {
    router.push(`/meeting?roomUrl=${encodeURIComponent(roomUrl)}`);
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      return `${diffHrs}h ${diffMin % 60}m ago`;
    } catch {
      return '';
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">See who&apos;s waiting to meet with you</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMeetings(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No active meetings</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            When a student starts a meeting, it will appear here.
            Make sure your status is set to <span className="text-emerald-600 font-medium">Active</span> so students can see you&apos;re available.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-4"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>
            {meetings.map(meeting => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Student avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                        {meeting.student_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
                      </div>
                      {/* Pulsing dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
                      </span>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-gray-900">{meeting.student_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatTime(meeting.created_at)}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                          meeting.status === 'waiting'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        )}>
                          {meeting.status === 'waiting' ? (
                            <><Users className="w-3 h-3" /> Waiting</>
                          ) : (
                            <><UserCheck className="w-3 h-3" /> Active</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => joinMeeting(meeting.room_url)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Join Meeting
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-5 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl border border-violet-100"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20 flex-shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">How meetings work</p>
            <ul className="mt-1.5 space-y-1 text-xs text-gray-600">
              <li>1. Set your status to <strong className="text-emerald-600">Active</strong> using the toggle in the header</li>
              <li>2. Students enrolled in your courses will see you&apos;re online</li>
              <li>3. When a student starts a meeting, it appears here</li>
              <li>4. Click <strong>Join Meeting</strong> to enter the video call</li>
              <li>5. Meetings auto-expire after 30 minutes</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
