import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getActiveMeetingsForInstructor } from '@/lib/queries';

/**
 * GET /api/meetings/instructor
 * Returns active/waiting meetings for the current instructor.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetings = await getActiveMeetingsForInstructor(session.user.id);
    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error('Error fetching instructor meetings:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
