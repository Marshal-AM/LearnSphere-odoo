import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MeetingsClient from './meetings-client';

export default async function MeetingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <MeetingsClient
      user={{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      }}
    />
  );
}
