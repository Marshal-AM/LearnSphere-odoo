import { Suspense } from 'react';
import MeetingClient from './meeting-client';

export default function MeetingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MeetingClient />
    </Suspense>
  );
}
