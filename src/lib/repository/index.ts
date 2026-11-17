import type { DataRepository } from './types';
import { localRepository } from './local';
import { supabaseRepository } from './supabase';
import { usingSupabase } from '@/lib/supabase';

/**
 * One seam for the whole UI. Flip NEXT_PUBLIC_DATA_SOURCE to "supabase"
 * after applying supabase/schema.sql. Mocks remain available as fallback
 * data via the local adapter until real YPAT records replace them.
 */
export const repository: DataRepository = usingSupabase ? supabaseRepository : localRepository;

export type { DataRepository } from './types';
