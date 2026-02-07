import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/db';
import { getPresignedUploadUrl, buildStorageKey } from '@/lib/storage';

/**
 * Server-side upload: receives a file via FormData, uploads it to S3,
 * records in DB, and returns the public URL.
 *
 * For large files, prefer the /api/upload/presign route for direct
 * browser-to-S3 uploads.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Build S3 key and get presigned URL
    const key = buildStorageKey(folder, file.name);
    const { presignedUrl, fileUrl } = await getPresignedUploadUrl(key, file.type);

    // Upload to S3
    const bytes = await file.arrayBuffer();
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: bytes,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadRes.ok) {
      throw new Error(`S3 upload failed: ${uploadRes.status}`);
    }

    // Record in database
    const uploaded = await queryOne<{ id: string; file_url: string }>(
      `INSERT INTO uploaded_files (original_filename, stored_filename, file_path, file_url, file_size_bytes, mime_type, uploaded_by, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, file_url`,
      [file.name, key, key, fileUrl, file.size, file.type, session.user.id, entityType || null, entityId || null]
    );

    return NextResponse.json({
      id: uploaded!.id,
      url: uploaded!.file_url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
