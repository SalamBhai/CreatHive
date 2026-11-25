'use client';

import { supabase, usingSupabase } from './supabase';

export type UploadKind = 'avatar' | 'media' | 'gallery' | 'cover' | 'inquiry' | 'pdf';

export interface UploadResult {
  url: string;
  publicId: string;
  /** Decided by the upload route from the file's real type. */
  resourceType: 'image' | 'video' | 'raw' | 'pdf' | null;
  /** Number of pages when a PDF was uploaded. */
  pages?: number;
}

interface Signature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: string;
}

function resourceTypeFor(file: File): 'image' | 'video' | 'raw' {
  const type = file.type.toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/') || type.startsWith('audio/')) return 'video';
  if (type === 'application/pdf') return 'raw';
  return 'image';
}

async function accessToken(): Promise<string | null> {
  if (!usingSupabase || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Upload a file straight to Cloudinary using a short-lived server signature.
 *  This avoids serverless request-body limits, so large PDFs and images work. */
export async function uploadFile(file: File, kind: UploadKind): Promise<UploadResult> {
  const resourceType = kind === 'pdf' ? 'raw' : resourceTypeFor(file);
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const token = await accessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const signatureResponse = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers,
    body: JSON.stringify({ kind, resourceType }),
  });
  const signature = (await signatureResponse.json().catch(() => ({}))) as Signature & {
    error?: string;
  };
  if (!signatureResponse.ok || !signature.signature) {
    throw new Error(signature.error || `Upload failed (${signatureResponse.status}).`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);
  form.append('public_id', signature.publicId);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    { method: 'POST', body: form }
  );
  const data = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    public_id?: string;
    pages?: number;
    error?: { message?: string };
  };
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Upload failed (${response.status}).`);
  }

  return {
    url: data.secure_url,
    publicId: data.public_id || signature.publicId,
    resourceType: kind === 'pdf' ? 'pdf' : signature.resourceType as UploadResult['resourceType'],
    pages: data.pages,
  };
}
