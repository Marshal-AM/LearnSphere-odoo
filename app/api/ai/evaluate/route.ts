import { NextRequest, NextResponse } from 'next/server';

const AI_API_URL = process.env.AI_API_URL || 'https://odooai-739298578243.us-central1.run.app';

/**
 * POST /api/ai/evaluate
 * Proxies the /evaluate endpoint to avoid CORS issues.
 * Body: { question: string, options: string[], correct_answer: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, options, correct_answer } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }
    if (!options || options.length < 2) {
      return NextResponse.json({ error: 'options must have at least 2 choices' }, { status: 400 });
    }
    if (!correct_answer) {
      return NextResponse.json({ error: 'correct_answer is required' }, { status: 400 });
    }

    const aiResponse = await fetch(`${AI_API_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options, correct_answer }),
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      return NextResponse.json(data, { status: aiResponse.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in evaluate API proxy:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
