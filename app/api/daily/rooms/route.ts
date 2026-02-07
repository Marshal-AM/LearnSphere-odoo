import { NextResponse } from 'next/server';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

/**
 * POST /api/daily/rooms
 * Creates a Daily.co room with a 30-minute expiry.
 * Returns { name, url, id, ... }
 */
export async function POST() {
  if (!DAILY_API_KEY) {
    return NextResponse.json(
      { error: 'DAILY_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const exp = Math.round(Date.now() / 1000) + 60 * 30; // 30 min expiry

    const response = await fetch('https://api.daily.co/v1/rooms/', {
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('Daily API error:', errText);
      return NextResponse.json(
        { error: `Failed to create room: ${response.status}` },
        { status: response.status }
      );
    }

    const room = await response.json();
    return NextResponse.json(room);
  } catch (error: any) {
    console.error('Error creating Daily room:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
