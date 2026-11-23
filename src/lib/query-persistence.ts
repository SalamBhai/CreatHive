import { get, set, del } from 'idb-keyval';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import { queryClient } from './query-client';

/** IndexedDB-backed cache persister.
 *
 *  The Query cache holds nested pieces/profiles, so IndexedDB is a much better
 *  fit than localStorage: asynchronous (no main-thread blocking), structured
 *  clone (no JSON round-trip) and a far larger quota. Static assets remain in
 *  the service worker's Cache Storage — this is for app data only.
 */
const STORAGE_KEY = 'creathive-query-cache-v1';

export const idbPersister: Persister = {
  persistClient: (client: PersistedClient) => set(STORAGE_KEY, client),
  restoreClient: () => get<PersistedClient>(STORAGE_KEY),
  removeClient: () => del(STORAGE_KEY),
};

/** Drop both the in-memory cache and its persisted copy (identity changes). */
export function clearQueryCache() {
  queryClient.clear();
  void idbPersister.removeClient();
}
