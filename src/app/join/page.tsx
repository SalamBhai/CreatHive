'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { signUpWithPassword } from '@/lib/auth';

export default function JoinPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tagline, setTagline] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const canSubmit =
    displayName.trim() && username.trim() && email.trim() && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const handle = username.trim().toLowerCase().replace(/^@/, '');
      const session = await signUpWithPassword(email.trim(), password, {
        username: handle,
        displayName: displayName.trim(),
      });
      // Email confirmation is on: no session until they click the link.
      if (!session) {
        setCheckEmail(true);
      } else {
        router.push('/studio');
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
        <Link href="/explore" aria-label="CreatHive home">
          <CreatHiveWordmark size="sm" href={null} />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        {checkEmail ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle size={24} weight="fill" />
            </div>
            <h1 className="font-editorial text-4xl font-semibold leading-tight">Check your inbox.</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your space, then sign in.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/studio">
                <NeoButton variant="primary" icon={<ArrowRight size={16} weight="bold" />}>Go to sign in</NeoButton>
              </Link>
              <Link href="/explore">
                <NeoButton variant="secondary">Explore the commons</NeoButton>
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FF5A36]">Join the hive</p>
            <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight">
              Your work deserves one link.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-600">
              Create your space for spoken word, poetry, dance, design and everything in between.
            </p>

            <Surface className="mt-8 space-y-4 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold">Display name *</label>
                  <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Adaeze Okafor" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Handle *</label>
                  <input required value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())} placeholder="adaeze" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                  <p className="mt-1 text-[11px] text-stone-500">creathive.app/@{username || 'yourname'}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Email *</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Password *</label>
                  <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">What do you do?</label>
                  <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Spoken word poet & visual artist" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                </div>

                {error ? <p className="text-xs text-red-600">{error}</p> : null}

                <NeoButton type="submit" variant="primary" size="lg" className="w-full" disabled={!canSubmit || busy}>
                  {busy ? 'Creating…' : 'Create my space'}
                </NeoButton>
              </form>
            </Surface>
            <p className="mt-4 text-center text-xs text-stone-600">
              Already a member?{' '}
              <Link href="/studio" className="font-bold text-[#FF5A36]">Sign in</Link>
            </p>
          </>
        )}
        <p className="mt-5 text-center text-xs text-stone-600">
          Browse the work first — <Link href="/explore" className="font-bold text-[#FF5A36]">Explore the commons</Link>
        </p>
      </main>
    </div>
  );
}
