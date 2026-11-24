import { v2 as cloudinary } from 'cloudinary';
import { usingSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/supabase-server';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
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
  if (type === 'application/pdf') return 'raw';
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
  if (usingSupabase && !user && !anonymous) return json({ error: 'Sign in to upload.' }, 401);

  const rateKey = `${anonymous ? 'inquiry' : 'user'}:${user?.id || request.headers.get('x-forwarded-for') || 'anon'}`;
  if (rateLimited(rateKey, anonymous ? 6 : 20)) {
    return json({ error: 'Too many uploads. Please wait a moment.' }, 429);
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!secret || !apiKey) return json({ error: 'Uploads are not configured.' }, 503);

  const resourceType = resourceTypeFor(file);
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
  if (kind === 'pdf' && (resourceType !== 'raw' || file.type !== 'application/pdf')) {
    return json({ error: 'Only PDF files can be uploaded here.' }, 415);
  }
  const limit = anonymous
    ? 5 * 1024 * 1024
    : resourceType === 'image'
      ? MAX_IMAGE_BYTES
      : MAX_MEDIA_BYTES;
  if (file.size === 0 || file.size > limit) {
    return json(
      { error: `File must be between 1 byte and ${Math.round(limit / 1024 / 1024)} MB.` },
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
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: resourceType, timestamp, signature, api_key: apiKey } as never,
          (uploadError, uploaded) => {
            if (uploadError || !uploaded) {
              reject(uploadError || new Error('Upload returned no result'));
              return;
            }
            resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
          }
        );
        stream.end(bytes);
      }
    );
    return json({ url: result.secure_url, publicId: result.public_id, resourceType }, 200);
  } catch (error) {
    console.error('[cloudinary] upload failed:', error);
    const detail = error instanceof Error ? error.message : 'Upload failed.';
    return json({ error: `Upload failed: ${detail}` }, 500);
  }
}
