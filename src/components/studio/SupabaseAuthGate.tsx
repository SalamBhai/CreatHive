'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { signInWithPassword } from '@/lib/auth';

export function SupabaseAuthGate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] text-[#18181B]">
      <div className="px-6 pt-8">
        <Link href="/explore" aria-label="CreatHive home">
          <CreatHiveWordmark size="sm" href={null} />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FF5A36]">Creator Studio</p>
        <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight">Welcome back.</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">Sign in to manage your work and opportunities.</p>

        <Surface className="mt-8 space-y-4 p-6">
          <form onSubmit={submit} className="space-y-4">
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
              />
            </div>

            {error ? <p className="text-xs text-red-600">{error}</p> : null}

            <NeoButton type="submit" variant="primary" size="lg" className="w-full" disabled={busy} icon={<ArrowRight size={16} weight="bold" />}>
              {busy ? 'Signing in…' : 'Enter Studio'}
            </NeoButton>
          </form>

          <Link href="/join" className="block w-full text-center text-xs font-semibold text-[#FF5A36] hover:underline">
            New here? Create your space
          </Link>
        </Surface>

      </main>
    </div>
  );
}
