import { NextRequest, NextResponse } from 'next/server';

const AI_API_URL = process.env.AI_API_URL || 'https://odooai-739298578243.us-central1.run.app';

/**
 * POST /api/ai/assist
 * Proxies the /assist endpoint to avoid CORS issues.
 * Body: { query: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const aiResponse = await fetch(`${AI_API_URL}/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      return NextResponse.json(data, { status: aiResponse.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in assist API proxy:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
