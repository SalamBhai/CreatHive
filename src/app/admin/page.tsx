import { Suspense } from 'react';
import AdminClient from '@/components/admin/AdminClient';

/** Admin is client-only (auth + React Query) — defer it so its unstable
 *  values are not evaluated during the server prerender. */
export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
        </div>
      }
    >
      <AdminClient />
    </Suspense>
  );
}
