/** Which pipeline is active, plus the current session.
 *
 * Mock/real replacement is owned by the repository adapters (single source of
 * truth): a real profile replaces its mock by handle, and a creator's mock
 * pieces are retired once they publish real work. This hook no longer filters
 * data itself — doing it in both places produced conflicting behaviour.
 */

import { usingSupabase } from '@/lib/supabase';
import { useSession } from '@/lib/auth';

export function useDataSource() {
  return {
    isSupabase: usingSupabase,
    session: useSession(),
  };
}
