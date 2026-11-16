'use client';

import { useSyncExternalStore } from 'react';

export interface Session {
  username: string;
  displayName: string;
  email: string;
}

const STORAGE_KEY = 'creathive_session_v1';

let current: Session | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function read(): Session | null {
  if (typeof window === 'undefined') return null;
  if (loaded) return current;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    current = raw ? (JSON.parse(raw) as Session) : null;
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

export function getSession(): Session | null {
  return read();
}

export function signIn(session: Session) {
  current = session;
  loaded = true;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
  emit();
}

export function signOut() {
  current = null;
  loaded = true;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

/** Auth state shared by the Studio gate and auth-aware links. */
export function useSession() {
  return useSyncExternalStore(subscribe, read, () => null);
}
