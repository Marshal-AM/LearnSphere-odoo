import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/instructor/status
 * Returns the current instructor's online status
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const row = await queryOne<{ is_active: boolean }>(
      `SELECT is_active FROM instructor_status WHERE user_id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ isActive: row?.is_active ?? false });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

/**
 * POST /api/instructor/status
 * Toggle the instructor's online status
 * Body: { isActive: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isActive } = await req.json();

    await query(
      `INSERT INTO instructor_status (user_id, is_active, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET is_active = $2, updated_at = NOW()`,
      [session.user.id, !!isActive]
    );

    return NextResponse.json({ isActive: !!isActive });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
