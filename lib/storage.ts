import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3-compatible storage client.
 *
 * Works with AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, Supabase Storage, etc.
 *
 * Required env vars:
 *   S3_REGION          – e.g. "us-east-1" or "auto" for R2
 *   S3_ENDPOINT        – e.g. "https://<account>.r2.cloudflarestorage.com"
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET          – bucket name
 *   S3_PUBLIC_URL      – public CDN/bucket URL for reading files (e.g. "https://cdn.example.com")
 *
 * CORS: Make sure your bucket allows PUT from your app's origin for presigned uploads.
 */

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3) return _s3;

  _s3 = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: !!process.env.S3_ENDPOINT, // needed for non-AWS (R2, MinIO, etc.)
  });

  return _s3;
}

const bucket = () => process.env.S3_BUCKET || 'learnsphere';

/**
 * Generate a presigned PUT URL for direct browser-to-S3 upload.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<{ presignedUrl: string; fileUrl: string; key: string }> {
  const s3 = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn });

  // Build the public read URL
  const publicBase = process.env.S3_PUBLIC_URL;
  const fileUrl = publicBase
    ? `${publicBase.replace(/\/$/, '')}/${key}`
    : presignedUrl.split('?')[0]; // fallback: unsigned URL (bucket must allow public read)

  return { presignedUrl, fileUrl, key };
}

/**
 * Build a deterministic S3 key for a given upload.
 */
export function buildStorageKey(folder: string, filename: string): string {
  const ext = filename.split('.').pop() || 'bin';
  return `${folder}/${crypto.randomUUID()}.${ext}`;
}
