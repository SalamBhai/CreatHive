'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, usingSupabase } from './supabase';
import { repository } from './repository';
import { queryClient } from './query-client';
import type { CreativeDiscipline } from './types';

export interface AppSession {
  username: string;
  displayName: string;
  email: string;
  /** Supabase auth user id, used by RLS as auth.uid(). */
  userId?: string;
  disciplines?: CreativeDiscipline[];
}

/* ---------- Local session (mock mode) ---------- */
const STORAGE_KEY = 'creathive_session_v1';
let current: AppSession | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function readLocal(): AppSession | null {
  if (typeof window === 'undefined') return null;
  if (loaded) return current;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    current = raw ? (JSON.parse(raw) as AppSession) : null;
  } catch {
    current = null;
  }
  loaded = true;
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function signInLocal(session: AppSession) {
  current = session;
  loaded = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
  emit();
}

export function signOutLocal() {
  current = null;
  loaded = true;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

/* ---------- Supabase session — one shared external store ---------- */
let remoteSession: AppSession | null = null;
let remoteReady = false;
let remoteStarted = false;
const remoteListeners = new Set<() => void>();

function readRemoteSession(): AppSession | null {
  return remoteSession;
}
function readRemoteReady(): boolean {
  return remoteReady;
}
function readLocalReady(): boolean {
  return true; // local storage is read synchronously on the client
}
function subscribeRemote(listener: () => void) {
  remoteListeners.add(listener);
  return () => {
    remoteListeners.delete(listener);
  };
}
function emitRemote() {
  remoteListeners.forEach((listener) => listener());
}

function setRemote(app: AppSession | null, event?: AuthChangeEvent) {
  const wasReady = remoteReady;
  remoteReady = true;
  if (app === remoteSession) {
    if (!wasReady) emitRemote();
    return;
  }
  remoteSession = app;
  emitRemote();
  // Provision on session arrival only — not on TOKEN_REFRESHED etc.
  if (app && (!event || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
    void ensureProfile(app).catch((err) => console.warn('[auth] profile check failed', err));
  }
}

function startRemote() {
  if (!usingSupabase || !supabase || remoteStarted) return;
  remoteStarted = true;
  supabase.auth.getSession().then(({ data }) => setRemote(toAppSession(data.session)));
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) =>
    setRemote(toAppSession(session), event)
  );
}

function toAppSession(session: Session | null): AppSession | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata || {};
  return {
    username: String(meta.username || meta.display_name || session.user.email?.split('@')[0] || 'creative'),
    displayName: String(meta.display_name || meta.name || meta.username || 'Creative'),
    email: session.user.email || '',
    userId: session.user.id,
    disciplines: (meta.disciplines as CreativeDiscipline[]) || undefined,
  };
}

/** Shared auth state — one store for every consumer, no per-component copies. */
export function useSession(): AppSession | null {
  useEffect(startRemote, []);
  const remote = useSyncExternalStore(subscribeRemote, readRemoteSession, () => null);
  const local = useSyncExternalStore(subscribe, readLocal, () => null);
  return usingSupabase ? remote : local;
}

/** True until the session has been resolved — gates show a loader, not a login form. */
export function useAuthReady(): boolean {
  useEffect(startRemote, []);
  const remote = useSyncExternalStore(subscribeRemote, readRemoteReady, () => false);
  const local = useSyncExternalStore(subscribe, readLocalReady, () => true);
  return usingSupabase ? remote : local;
}

export async function signOut() {
  if (usingSupabase && supabase) {
    await supabase.auth.signOut();
  } else {
    signOutLocal();
  }
  // Never leave one user's cached data visible to the next account.
  queryClient.clear();
}

/** Ensure a profile row exists for the signed-in user, keyed by auth.uid(). */
async function ensureProfile(app: AppSession) {
  if (!app.userId) return;
  const existing = await repository.getProfile(app.username);
  // A mock profile with the same handle is not a real row — still provision.
  if (existing && /^[0-9a-f]{8}-/i.test(existing.id)) return;
  await repository.createProfile({
    id: app.userId,
    username: app.username,
    displayName: app.displayName,
    tagline: 'Creative on CreatHive',
    bio: 'Making things and sharing them with the hive.',
    avatarUrl: '',
    bannerGradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
    disciplines: app.disciplines?.length ? app.disciplines : ['OTHER'],
    location: '',
    isAvailableForGigs: true,
    isYPATData: true,
    socialLinks: { email: app.email || undefined },
    themeStyle: 'soft-brutal',
    stats: { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
    createdAt: '1970-01-01T00:00:00.000Z',
  });
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const app = toAppSession(data.session);
  if (app) await ensureProfile(app);
  return app;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  meta: { username: string; displayName: string; disciplines: CreativeDiscipline[] }
) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: meta.username,
        display_name: meta.displayName,
        disciplines: meta.disciplines,
      },
    },
  });
  if (error) throw error;
  const app = toAppSession(data.session);
  if (app) await ensureProfile(app);
  return app;
}
