import { Suspense } from 'react';
import StudioClient from '@/components/studio/StudioClient';

/** The Studio is client-only (auth + React Query). Deferring it behind
 *  Suspense keeps its unstable values (Date.now inside useQuery) out of the
 *  server prerender, which would otherwise fail the Cache Components build. */
export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
        </div>
      }
    >
      <StudioClient initialView="overview" />
    </Suspense>
  );
}
