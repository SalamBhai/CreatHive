import { v2 as cloudinary } from 'cloudinary';
import { usingSupabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/supabase-server';
import { logError, logWarn } from '@/lib/logger';

/** Issue a short-lived signed upload so the browser posts directly to
 *  Cloudinary, bypassing serverless request-body limits (large PDFs). */

const KINDS = new Set(['avatar', 'media', 'gallery', 'cover', 'inquiry', 'pdf']);
const RESOURCE_TYPES = new Set(['image', 'video', 'raw']);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const kind = typeof body?.kind === 'string' && KINDS.has(body.kind) ? body.kind : 'media';
  const resourceType =
    typeof body?.resourceType === 'string' && RESOURCE_TYPES.has(body.resourceType)
      ? body.resourceType
      : 'image';

  const anonymous = kind === 'inquiry' && resourceType === 'image';
  const user = usingSupabase ? await getUserFromRequest(request) : null;
  if (usingSupabase && !anonymous && !user) {
    logWarn('cloudinary', 'Signature rejected: no verified session', { kind });
    return Response.json({ error: 'Sign in to upload.' }, { status: 401 });
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !secret || !cloudName) {
    logError('cloudinary', 'Signature unavailable: missing credentials');
    return Response.json({ error: 'Uploads are not configured.' }, { status: 503 });
  }

  const username = String(user?.user_metadata?.username || 'local')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '') || 'local';
  const folder = anonymous ? 'creathive/inquiries' : `creathive/${username}/${kind}`;
  // Cloudinary prepends `folder` itself; sending a full path doubles it.
  const publicId = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, public_id: publicId, timestamp },
    secret
  );

  // Signatures expire in 10 minutes; the browser uploads immediately.
  return Response.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    publicId,
    resourceType,
  });
}
