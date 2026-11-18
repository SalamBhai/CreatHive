'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { signInWithPassword, signUpWithPassword } from '@/lib/auth';

export function SupabaseAuthGate() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password);
      } else {
        const session = await signUpWithPassword(email, password, {
          username: handle.replace(/^@/, '').toLowerCase() || email.split('@')[0],
          displayName: displayName || handle || email.split('@')[0],
        });
        // Email confirmation is on: no session yet until they click the link.
        if (!session) {
          setCheckEmail(true);
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] text-[#18181B]">
      <div className="px-6 pt-8">
        <Link href="/" aria-label="CreatHive home">
          <CreatHiveWordmark size="sm" href={null} />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FF5A36]">Creator Studio</p>
        {checkEmail ? (
          <>
            <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight">Check your inbox.</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your Studio, then sign in here.
            </p>
            <button
              type="button"
              onClick={() => {
                setCheckEmail(false);
                setMode('signin');
              }}
              className="mt-5 text-xs font-bold text-[#FF5A36] hover:underline"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight">
              {mode === 'signin' ? 'Welcome back.' : 'Claim your space.'}
            </h1>
          </>
        )}

        {checkEmail ? null : (
        <Surface className="mt-8 space-y-4 p-6">
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold">Display name</label>
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Adaeze Okafor"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Handle</label>
                  <input
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
                    placeholder="adaeze"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-1 block text-xs font-bold">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">Password</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
              />
            </div>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}

            <NeoButton type="submit" variant="primary" size="lg" className="w-full" disabled={busy} icon={<ArrowRight size={16} weight="bold" />}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Enter Studio' : 'Create my account'}
            </NeoButton>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            className="w-full text-center text-xs font-semibold text-stone-600 hover:text-[#FF5A36]"
          >
            {mode === 'signin' ? 'New here? Create an account' : 'Already a member? Sign in'}
          </button>
        </Surface>
        )}

        <p className="mt-5 text-center text-xs text-stone-600">
          Browse the work first — <Link href="/explore" className="font-bold text-[#FF5A36]">Explore the commons</Link>
        </p>
      </main>
    </div>
  );
}
