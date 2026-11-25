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

/** Upload a file through the signed Cloudinary route and surface errors to callers. */
export async function uploadFile(file: File, kind: UploadKind): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', kind);

  const headers: Record<string, string> = {};
  if (usingSupabase && supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  }

  const response = await fetch('/api/cloudinary', {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = (await response.json().catch(() => ({}))) as Partial<UploadResult> & {
    error?: string;
  };
  if (!response.ok || !data.url) {
    // The server returns JSON errors; a non-JSON body means a proxy/HTML error.
    throw new Error(
      data.error ||
        `Upload failed (${response.status}). Check your connection and try again.`
    );
  }
  return {
    url: data.url,
    publicId: data.publicId || '',
    resourceType: data.resourceType || null,
    pages: data.pages,
  };
}
