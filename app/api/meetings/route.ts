import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getUserById } from '@/lib/queries';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

/**
 * POST /api/meetings
 * Student creates a meeting room to talk with an instructor.
 * Body: { courseId: string, instructorId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, instructorId } = await req.json();

    if (!courseId || !instructorId) {
      return NextResponse.json({ error: 'courseId and instructorId are required' }, { status: 400 });
    }

    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'Daily API key not configured' }, { status: 500 });
    }

    // End any previous waiting/active meetings for this instructor
    await query(
      `UPDATE meeting_rooms SET status = 'ended', ended_at = NOW()
       WHERE instructor_id = $1 AND status IN ('waiting', 'active')`,
      [instructorId]
    );

    // Get student name
    const student = await getUserById(session.user.id);
    const studentName = student
      ? `${student.first_name} ${student.last_name}`
      : 'Student';

    // Create Daily room
    const exp = Math.round(Date.now() / 1000) + 60 * 30;
    const dailyRes = await fetch('https://api.daily.co/v1/rooms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          exp,
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 2,
        },
      }),
    });

    if (!dailyRes.ok) {
      const errText = await dailyRes.text();
      return NextResponse.json({ error: `Failed to create room: ${errText}` }, { status: 500 });
    }

    const dailyRoom = await dailyRes.json();

    // Save meeting to DB
    const meeting = await queryOne<{ id: string; room_name: string; room_url: string }>(
      `INSERT INTO meeting_rooms (room_name, room_url, course_id, instructor_id, student_id, student_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'waiting')
       RETURNING id, room_name, room_url`,
      [dailyRoom.name, dailyRoom.url, courseId, instructorId, session.user.id, studentName]
    );

    return NextResponse.json({
      meetingId: meeting?.id,
      roomName: dailyRoom.name,
      roomUrl: dailyRoom.url,
      studentName,
    });
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
