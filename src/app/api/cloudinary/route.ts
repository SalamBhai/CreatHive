import { v2 as cloudinary } from 'cloudinary';
import { usingSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/supabase-server';
import { logError, logWarn } from '@/lib/logger';

// Cloudinary (this plan) caps images and raw files at 10 MB per upload.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_RAW_BYTES = 10 * 1024 * 1024;
// Cap video/audio below the provider limit to control abuse and storage.
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const KINDS = ['avatar', 'media', 'gallery', 'cover', 'inquiry', 'pdf'] as const;
type UploadKind = (typeof KINDS)[number];

/** Best-effort in-memory throttle (per process). A hosted app should use Redis. */
const attempts = new Map<string, number[]>();
function rateLimited(key: string, max: number) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 1000) attempts.clear();
  return recent.length > max;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function resourceTypeFor(file: File): 'image' | 'video' | 'raw' | null {
  const type = file.type.toLowerCase();
  if (type.startsWith('image/')) return 'image';
  // Cloudinary serves both video and audio from the `video` resource type.
  if (type.startsWith('video/') || type.startsWith('audio/')) return 'video';
  // Upload PDFs as images so Cloudinary can render each page on demand via
  // pg_N transformations. As `raw` they are forced to download in browsers.
  if (type === 'application/pdf') return 'image';
  return null;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid upload.' }, 400);
  }

  const file = formData.get('file');
  const rawKind = String(formData.get('kind') || 'media');
  const kind: UploadKind = KINDS.includes(rawKind as UploadKind) ? (rawKind as UploadKind) : 'media';
  if (!(file instanceof File)) return json({ error: 'No file provided.' }, 400);

  // Inquiry reference images may be attached by signed-out visitors; every
  // other upload kind still requires a Supabase session in live mode.
  const anonymous = kind === 'inquiry';
  const user = usingSupabase ? await getUserFromRequest(request) : null;
  if (usingSupabase && !user && !anonymous) {
    logWarn('cloudinary', 'Upload rejected: no verified session', { kind, anonymous });
    return json({ error: 'Sign in to upload.' }, 401);
  }

  const rateKey = `${anonymous ? 'inquiry' : 'user'}:${user?.id || request.headers.get('x-forwarded-for') || 'anon'}`;
  if (rateLimited(rateKey, anonymous ? 6 : 20)) {
    return json({ error: 'Too many uploads. Please wait a moment.' }, 429);
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!secret || !apiKey) {
    logError('cloudinary', 'Uploads are not configured: missing credentials');
    return json({ error: 'Uploads are not configured.' }, 503);
  }

  const resourceType = resourceTypeFor(file);
  const isPdf = file.type === 'application/pdf';
  if (!resourceType || (anonymous && resourceType !== 'image')) {
    return json(
      {
        error: anonymous
          ? 'Attach images only (JPG, PNG, WEBP, GIF).'
          : 'Unsupported file type. Use an image, audio, video or PDF.',
      },
      415
    );
  }
  if (kind === 'pdf' && !isPdf) {
    return json({ error: 'Only PDF files can be uploaded here.' }, 415);
  }
  const limit = anonymous
    ? 5 * 1024 * 1024
    : resourceType === 'image'
      ? MAX_IMAGE_BYTES
      : resourceType === 'raw'
        ? MAX_RAW_BYTES
        : MAX_MEDIA_BYTES;
  if (file.size === 0 || file.size > limit) {
    return json(
      {
        error: `${resourceType === 'raw' ? 'PDF' : 'File'} is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum file size is ${Math.round(limit / 1024 / 1024)} MB.`,
      },
      413
    );
  }

  const username = String(user?.user_metadata?.username || 'local')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '') || 'local';
  const folder = anonymous ? 'creathive/inquiries' : `creathive/${username}/${kind}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, secret);

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    // Stream the bytes instead of a base64 data URI. A data URI inflates the
    // payload by ~33% and breaks on larger PDFs/images.
    const result = await new Promise<{ secure_url: string; public_id: string; pages?: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: resourceType, timestamp, signature, api_key: apiKey } as never,
          (uploadError, uploaded) => {
            if (uploadError || !uploaded) {
              reject(uploadError || new Error('Upload returned no result'));
              return;
            }
            resolve({
              secure_url: uploaded.secure_url,
              public_id: uploaded.public_id,
              pages: uploaded.pages,
            });
          }
        );
        stream.end(bytes);
      }
    );
    return json(
      {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: isPdf ? 'pdf' : resourceType,
        pages: isPdf ? result.pages ?? 1 : undefined,
      },
      200
    );
  } catch (error) {
    const err = error as {
      message?: string;
      http_code?: number;
      error?: { message?: string };
    };
    logError('cloudinary', 'Upload failed', undefined, {
      name: file.name,
      type: file.type,
      size: file.size,
      resourceType,
      folder,
      message: error instanceof Error ? error.message : 'unknown',
    });
    // Cloudinary's SDK wraps the useful reason inside `error.error.message`.
    const detail = err?.error?.message || err?.message || 'Unknown error.';
    const code = err?.http_code ? ` (${err.http_code})` : '';
    return json({ error: `Upload failed${code}: ${detail}` }, 500);
  }
}
