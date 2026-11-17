'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { useCreateProfile, useSubmitJoinRequest } from '@/lib/store';
import { signIn, useSession } from '@/lib/auth';

export default function JoinPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [tagline, setTagline] = useState('');
  const [isDone, setIsDone] = useState(false);
  const session = useSession();
  const joinRequest = useSubmitJoinRequest();
  const createProfile = useCreateProfile();

  const canSubmit = displayName.trim() && username.trim() && email.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    joinRequest.mutate(
      {
        handle: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim(),
        tagline: tagline.trim(),
      },
      {
        onSuccess: () => {
          const handle = username.trim().toLowerCase();
          createProfile.mutate(
            {
              id: `c-${handle}-${Date.now()}`,
              username: handle,
              displayName: displayName.trim(),
              tagline: tagline.trim() || 'Creative on CreatHive',
              bio: 'Making things and sharing them with the hive.',
              avatarUrl:
                'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
              bannerGradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
              disciplines: ['OTHER'],
              location: '',
              isAvailableForGigs: true,
              socialLinks: { email: email.trim() },
              themeStyle: 'soft-brutal',
              stats: { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
              createdAt: new Date().toISOString(),
            },
            {
              onSuccess: () => {
                signIn({ username: handle, displayName: displayName.trim(), email: email.trim() });
                setIsDone(true);
              },
            }
          );
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <Link href="/" aria-label="CreatHive home">
            <CreatHiveWordmark size="sm" href={null} />
          </Link>
          <Link href="/explore" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#FF5A36]">
            <ArrowLeft size={14} weight="bold" /> Explore
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        {isDone ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle size={32} weight="fill" />
            </div>
            <h1 className="mt-5 font-editorial text-4xl font-semibold">Your hive awaits.</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
              We&apos;ve got your request, @{username.replace(/^@/, '')}. Once your spot is confirmed you&apos;ll be able to publish pieces, collect applause, and get booked.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <NeoButton variant="primary" onClick={() => router.push('/studio')} icon={<ArrowRight size={16} weight="bold" />}>
                Explore the Studio
              </NeoButton>
              <Link href="/explore">
                <NeoButton variant="secondary">See the commons</NeoButton>
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FF5A36]">Join the hive</p>
            <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight md:text-5xl">
              Your work deserves one link.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-600">
              Tell us who you are. We&apos;ll set up your space for spoken word, poetry, dance, design and everything in between.
            </p>

            <Surface className="mt-8 space-y-4 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold">Display name *</label>
                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Adaeze Okafor"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Handle *</label>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
                    placeholder="adaeze"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
                  />
                  <p className="mt-1 text-[11px] text-stone-500">creathive.app/@{username || 'yourname'}</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">Email *</label>
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
                  <label className="mb-1 block text-xs font-bold">What do you do?</label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Spoken word poet & visual artist"
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
                  />
                </div>
                <NeoButton type="submit" variant="primary" size="lg" className="w-full" disabled={!canSubmit || joinRequest.isPending}>
                  {joinRequest.isPending ? 'Sending…' : 'Request my space'}
                </NeoButton>
              </form>
            </Surface>
            <p className="mt-4 text-center text-[11px] text-stone-500">
              Already a member?{' '}
              <Link href={session ? '/studio' : '/join'} className="font-bold text-[#FF5A36]">
                {session ? 'Open your Studio' : 'Sign in'}
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
