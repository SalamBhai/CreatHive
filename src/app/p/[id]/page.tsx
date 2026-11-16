import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PostView } from '@/components/portfolio/PostView';
import { INITIAL_PIECES } from '@/lib/sample-data';

// Full-post pages read URL params before the client view hydrates.
export const instant = false;

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then(({ id }) => {
    const piece = INITIAL_PIECES.find((p) => p.id === id);
    if (!piece) {
      return { title: 'Post not found — CreatHive' };
    }
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
  });
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
