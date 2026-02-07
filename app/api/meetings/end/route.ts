import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * POST /api/meetings/end
 * End a meeting by room name.
 * Body: { roomName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    await query(
      `UPDATE meeting_rooms SET status = 'ended', ended_at = NOW()
       WHERE room_name = $1 AND status IN ('waiting', 'active')`,
      [roomName]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
