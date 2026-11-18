import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PostView } from '@/components/portfolio/PostView';
import { INITIAL_PIECES } from '@/lib/sample-data';
import { serverSupabase } from '@/lib/supabase-server';

// Full-post pages read URL params before the client view hydrates.
export const instant = false;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MetaPiece = {
  title: string;
  subtitle?: string;
  coverImageUrl?: string;
  tags: string[];
};

async function loadPiece(id: string): Promise<MetaPiece | undefined> {
  // Mock ids like "piece-sheriff-01" are not UUIDs — never send them to Postgres.
  if (UUID_RE.test(id) && serverSupabase) {
    const { data, error } = await serverSupabase
      .from('pieces')
      .select('title, subtitle, cover_image_url, tags')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) {
      return {
        title: String(data.title || 'Creative piece'),
        subtitle: data.subtitle ? String(data.subtitle) : undefined,
        coverImageUrl: data.cover_image_url ? String(data.cover_image_url) : undefined,
        tags: (data.tags as string[]) || [],
      };
    }
  }
  return INITIAL_PIECES.find((p) => p.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const piece = await loadPiece(id);
  if (!piece) return { title: 'Post not found — CreatHive' };

  return {
    title: `${piece.title} — CreatHive`,
    description: piece.subtitle || `A creative piece on CreatHive: ${piece.tags.join(', ')}`,
    openGraph: {
      title: piece.title,
      description: piece.subtitle || 'A creative piece on CreatHive',
      images: piece.coverImageUrl ? [{ url: piece.coverImageUrl, alt: piece.title }] : undefined,
      type: 'article',
    },
  };
}

export function generateStaticParams() {
  return INITIAL_PIECES.map((piece) => ({ id: piece.id }));
}

export default async function FullPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
        </div>
      }
    >
      <PostView id={id} />
    </Suspense>
  );
}
