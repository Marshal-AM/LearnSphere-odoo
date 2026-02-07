import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPresignedUploadUrl, buildStorageKey } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType, folder } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 });
    }

    const key = buildStorageKey(folder || 'uploads', filename);
    const { presignedUrl, fileUrl } = await getPresignedUploadUrl(key, contentType);

    return NextResponse.json({ presignedUrl, fileUrl, key });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
