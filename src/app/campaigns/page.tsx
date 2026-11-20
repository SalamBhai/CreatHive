import { Suspense } from 'react';
import CampaignsClient from '@/components/campaigns/CampaignsClient';

/** Creator-facing briefs, deferred behind Suspense (auth + React Query). */
export default function CampaignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
        </div>
      }
    >
      <CampaignsClient />
    </Suspense>
  );
}
