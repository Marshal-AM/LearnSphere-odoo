import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * S3-compatible storage client — PUBLIC bucket mode.
 *
 * The bucket is assumed to be publicly readable. All uploads go directly
 * via the server using PutObjectCommand (no presigning needed).
 *
 * Required env vars:
 *   S3_REGION          – e.g. "us-east-1" or "auto" for R2
 *   S3_ENDPOINT        – e.g. "https://<account>.r2.cloudflarestorage.com"
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET          – bucket name
 *   S3_PUBLIC_URL      – public CDN/bucket URL for reading files
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
 * Upload a file buffer directly to S3 and return its public URL.
 */
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const s3 = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);

  return getPublicUrl(key);
}

/**
 * Build the public read URL for a given S3 key.
 */
export function getPublicUrl(key: string): string {
  const publicBase = process.env.S3_PUBLIC_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }
  // Fallback: construct from endpoint + bucket
  const endpoint = process.env.S3_ENDPOINT || `https://s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com`;
  return `${endpoint}/${bucket()}/${key}`;
}

/**
 * Build a deterministic S3 key for a given upload.
 */
export function buildStorageKey(folder: string, filename: string): string {
  const ext = filename.split('.').pop() || 'bin';
  return `${folder}/${crypto.randomUUID()}.${ext}`;
}
