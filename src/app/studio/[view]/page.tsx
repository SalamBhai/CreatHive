import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import StudioClient from '@/components/studio/StudioClient';
import type { StudioView } from '@/components/studio/StudioShell';

const VIEWS: StudioView[] = ['overview', 'pieces', 'inquiries', 'profile'];


export function generateStaticParams() {
  return VIEWS.map((view) => ({ view }));
}

/** Each Studio tab is a real URL (/studio/pieces, /studio/profile, …) so a
 *  refresh or a shared link lands on the same tab. */
export default async function StudioViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (!VIEWS.includes(view as StudioView)) notFound();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
        </div>
      }
    >
      <StudioClient initialView={view as StudioView} />
    </Suspense>
  );
}
