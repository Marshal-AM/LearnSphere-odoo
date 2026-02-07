'use client';

import { useState, useRef, useCallback, DragEvent } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface FileUploadProps {
  /** MIME types to accept, e.g. "video/*" or "image/*,.pdf" */
  accept?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** S3 folder prefix, e.g. "courses/videos" */
  folder?: string;
  /** Called when upload completes successfully */
  onUpload: (result: UploadResult) => void;
  /** For video files — called with duration in minutes */
  onDurationDetected?: (durationMinutes: number) => void;
  /** Already-uploaded file URL (shows preview state) */
  currentUrl?: string;
  /** Current filename for display */
  currentFilename?: string;
  /** Visual label */
  label?: string;
  /** Hint text below the drop zone */
  hint?: string;
  className?: string;
  /** Compact mode for inline usage */
  compact?: boolean;
}

export function FileUpload({
  accept,
  maxSize,
  folder,
  onUpload,
  onDurationDetected,
  currentUrl,
  currentFilename,
  label,
  hint,
  className,
  compact = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl || '');
  const [uploadedName, setUploadedName] = useState(currentFilename || '');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectVideoDuration = useCallback(
    (file: File) => {
      if (!file.type.startsWith('video/') || !onDurationDetected) return;
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const minutes = Math.round(video.duration / 60 * 10) / 10; // 1 decimal
        onDurationDetected(minutes);
        URL.revokeObjectURL(url);
      };
      video.onerror = () => URL.revokeObjectURL(url);
      video.src = url;
    },
    [onDurationDetected],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      setError('');

      if (maxSize && file.size > maxSize) {
        setError(`File too large. Max: ${(maxSize / (1024 * 1024)).toFixed(0)} MB`);
        return;
      }

      // Detect video duration in parallel
      detectVideoDuration(file);

      setUploading(true);
      setProgress(5);

      try {
        // Build FormData and upload to our server-side endpoint
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder || 'uploads');

        // Upload with progress via XHR
        const fileUrl = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 90));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.url);
              } catch {
                reject(new Error('Invalid response'));
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText);
                reject(new Error(data.error || `Upload failed (${xhr.status})`));
              } catch {
                reject(new Error(`Upload failed (${xhr.status})`));
              }
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });

        setProgress(100);
        setUploadedUrl(fileUrl);
        setUploadedName(file.name);

        onUpload({ url: fileUrl, filename: file.name, size: file.size, mimeType: file.type });
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [folder, maxSize, onUpload, detectVideoDuration],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [uploadFile],
  );

  const handleRemove = () => {
    setUploadedUrl('');
    setUploadedName('');
    setProgress(0);
    onUpload({ url: '', filename: '', size: 0, mimeType: '' });
  };

  const getIcon = () => {
    if (accept?.includes('video')) return <Video className="w-8 h-8 text-gray-400" />;
    if (accept?.includes('image')) return <ImageIcon className="w-8 h-8 text-gray-400" />;
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  // Preview / uploaded state
  if (uploadedUrl && !uploading) {
    const isImage = uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
      (uploadedName && uploadedName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i));

    return (
      <div className={cn('relative', className)}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {isImage && (
              <img src={uploadedUrl} alt="" className="w-16 h-16 object-cover rounded mb-1" />
            )}
            <p className="text-sm font-medium text-gray-900 truncate">{uploadedName || 'Uploaded file'}</p>
            <p className="text-xs text-gray-500 truncate">{uploadedUrl}</p>
          </div>
          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          compact ? 'p-4' : 'p-8',
          dragOver
            ? 'border-primary bg-primary-50'
            : 'border-gray-300 hover:border-gray-400',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-2" />
            <p className="text-sm text-gray-600">Uploading… {progress}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            {compact ? (
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-gray-400" />
                <p className="text-sm text-gray-600">Click or drag to upload</p>
              </div>
            ) : (
              <>
                {getIcon()}
                <p className="text-sm text-gray-600 mt-2">Click or drag file to upload</p>
                {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
