/**
 * Server-safe signup. Kept separate from `lib/auth.ts`, which is a client
 * module ('use client') and cannot be called from a Route Handler.
 */

import { serverSupabase } from './supabase-server';
import { logError } from './logger';
import type { CreativeDiscipline } from './types';

export interface SignUpInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
  disciplines: CreativeDiscipline[];
}

export type SignUpResult =
  | { status: 'created'; user: { id: string; email: string; displayName: string } }
  | { status: 'confirmation_sent'; user: { email: string; displayName: string } };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

/** Validate input on the server too — the client checks are only a convenience. */
export function validateSignUpInput(input: Partial<SignUpInput>): string | null {
  const { email, password, username, displayName } = input;
  if (!email || !password || !username || !displayName) return 'All fields are required.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (!USERNAME_RE.test(username)) {
    return 'Handle must be 3 to 30 characters: lowercase letters, numbers, _ or -.';
  }
  if (displayName.trim().length > 80) return 'Display name is too long.';
  return null;
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('duplicate')) {
    return 'An account with that email already exists. Try signing in.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('confirmation email') || lower.includes('error sending')) {
    return 'We couldn’t send your confirmation email. Please try again in a moment.';
  }
  if (lower.includes('invalid email')) return 'Enter a valid email address.';
  if (lower.includes('password')) return 'Password must be at least 6 characters.';
  return 'Could not create your account. Please try again.';
}

export async function signUpUser(input: SignUpInput): Promise<SignUpResult> {
  if (!serverSupabase) throw new Error('Supabase is not configured.');

  const username = input.username.toLowerCase().replace(/^@/, '');
  const displayName = input.displayName.trim();

  // The profiles.username column is unique — fail early with a useful message.
  const { data: existing, error: lookupError } = await serverSupabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (lookupError) throw new Error('Could not check handle availability.');
  if (existing) throw new Error('That handle is already taken.');

  const { data, error } = await serverSupabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        username,
        display_name: displayName,
        disciplines: input.disciplines,
      },
    },
  });
  if (error) {
    logError('auth', 'Supabase signup failed', error, { status: error.status ?? 0 });
    throw new Error(friendlyAuthError(error.message));
  }

  const user = data.user;
  if (!user) throw new Error('Could not create your account. Please try again.');

  // With email confirmation enabled, Supabase returns a user but no session.
  // The browser cannot write an RLS-protected profile until the user signs in.
  if (!data.session) {
    return { status: 'confirmation_sent', user: { email: user.email || '', displayName } };
  }

  // Autoconfirm: establish the session on this client so RLS sees auth.uid(),
  // then provision the profile keyed by the auth user id.
  await serverSupabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const { error: profileError } = await serverSupabase.from('profiles').insert({
    id: user.id,
    username,
    display_name: displayName,
    tagline: 'Creative on CreatHive',
    bio: 'Making things and sharing them with the hive.',
    avatar_url: '',
    banner_gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
    disciplines: input.disciplines.length ? input.disciplines : ['OTHER'],
    location: '',
    is_available_for_gigs: true,
    social_links: { email: user.email || undefined },
    theme_style: 'soft-brutal',
    stats: { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
    is_ypat_data: true,
    source: 'live',
  });
  if (profileError && !profileError.message.toLowerCase().includes('duplicate')) {
    throw new Error('Account created, but your profile could not be set up. Please sign in.');
  }

  return {
    status: 'created',
    user: { id: user.id, email: user.email || '', displayName },
  };
}
