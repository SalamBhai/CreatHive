import { v2 as cloudinary } from 'cloudinary';
import { usingSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/supabase-server';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const KINDS = ['avatar', 'media', 'gallery', 'cover'] as const;
type UploadKind = (typeof KINDS)[number];

/** Best-effort in-memory throttle (per process). A hosted app should use Redis. */
const attempts = new Map<string, number[]>();
function rateLimited(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 1000) attempts.clear();
  return recent.length > 20;
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
  const user = usingSupabase ? await getUserFromRequest(request) : null;
  if (usingSupabase && !user) return json({ error: 'Sign in to upload.' }, 401);

  const rateKey = user?.id || request.headers.get('x-forwarded-for') || 'anon';
  if (rateLimited(rateKey)) {
    return json({ error: 'Too many uploads. Please wait a moment.' }, 429);
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!secret || !apiKey) return json({ error: 'Uploads are not configured.' }, 503);

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

  const resourceType = resourceTypeFor(file);
  if (!resourceType) {
    return json({ error: 'Unsupported file type. Use an image, audio, video or PDF.' }, 415);
  }
  const limit = resourceType === 'image' ? MAX_IMAGE_BYTES : MAX_MEDIA_BYTES;
  if (file.size === 0 || file.size > limit) {
    return json(
      { error: `File must be between 1 byte and ${Math.round(limit / 1024 / 1024)} MB.` },
      413
    );
  }

  const username = String(user?.user_metadata?.username || 'local')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '') || 'local';
  const folder = `creathive/${username}/${kind}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, secret);

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await cloudinary.uploader.upload(
      `data:${file.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`,
      { folder, resource_type: resourceType, timestamp, signature, api_key: apiKey }
    );
    return json({ url: result.secure_url, publicId: result.public_id }, 200);
  } catch (error) {
    console.error('[cloudinary] upload failed:', error);
    return json({ error: 'Upload failed. Please try again.' }, 500);
  }
}
