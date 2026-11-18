'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, CaretDown, Check } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { signUpWithPassword } from '@/lib/auth';
import type { CreativeDiscipline } from '@/lib/types';

export default function JoinPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [disciplines, setDisciplines] = useState<CreativeDiscipline[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const nicheOptions = (Object.keys(DISCIPLINE_CONFIG) as Array<CreativeDiscipline | 'ALL'>)
    .filter((key): key is CreativeDiscipline => key !== 'ALL');

  const toggleNiche = (key: CreativeDiscipline) =>
    setDisciplines((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
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
        disciplines,
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

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Display name *</label>
                    <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Adaeze Okafor" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Handle *</label>
                    <input required value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())} placeholder="adaeze" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                    <p className="mt-1 text-[11px] text-stone-500">creathive.app/@{username || 'yourname'}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Email *</label>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">Password *</label>
                    <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold">What do you do?</label>
                  {/* Mobile: a single field that opens a checkable sheet */}
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-left sm:hidden"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#18181B]">
                        {disciplines.length
                          ? `${disciplines.length} selected`
                          : 'Choose your niches'}
                      </span>
                      {disciplines.length ? (
                        <span className="mt-0.5 block truncate text-[11px] text-stone-500">
                          {disciplines.map((d) => DISCIPLINE_CONFIG[d].label).join(', ')}
                        </span>
                      ) : null}
                    </span>
                    <CaretDown size={16} weight="bold" className="shrink-0 text-stone-500" />
                  </button>

                  {/* Desktop: 3-per-row icon tiles */}
                  <div className="hidden grid-cols-3 gap-2 sm:grid">
                    {nicheOptions.map((key) => {
                      const config = DISCIPLINE_CONFIG[key];
                      const Icon = config.icon;
                      const active = disciplines.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleNiche(key)}
                          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                            active
                              ? 'border-[#FF5A36] bg-[#FFF2EE] shadow-[0_2px_0_0_#FF5A36]'
                              : 'border-stone-200 bg-white hover:border-stone-400'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              active ? 'bg-white text-[#FF5A36]' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <Icon size={17} weight="duotone" />
                          </span>
                          <span className={`text-xs font-bold leading-tight ${active ? 'text-[#FF5A36]' : 'text-[#18181B]'}`}>
                            {config.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-stone-500">
                    Pick all that fit — {disciplines.length || 'none'} selected.
                  </p>
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
      </main>

      <BottomSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="What do you do?"
        subtitle="Pick all the niches that fit you."
      >
        <div className="space-y-1.5 pb-4">
          {nicheOptions.map((key) => {
            const config = DISCIPLINE_CONFIG[key];
            const Icon = config.icon;
            const active = disciplines.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleNiche(key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active ? 'border-[#FF5A36] bg-[#FFF2EE]' : 'border-stone-200 bg-white'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active ? 'bg-white text-[#FF5A36]' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Icon size={18} weight="duotone" />
                </span>
                <span className={`flex-1 text-sm font-bold ${active ? 'text-[#FF5A36]' : 'text-[#18181B]'}`}>
                  {config.label}
                </span>
                {active ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5A36] text-white">
                    <Check size={14} weight="bold" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <NeoButton variant="primary" size="lg" className="w-full" onClick={() => setPickerOpen(false)}>
          Done{disciplines.length ? ` · ${disciplines.length} selected` : ''}
        </NeoButton>
      </BottomSheet>
    </div>
  );
}
