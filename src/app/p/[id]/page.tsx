import { Suspense } from 'react';
import { PostView } from '@/components/portfolio/PostView';
import { INITIAL_PIECES } from '@/lib/sample-data';

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
