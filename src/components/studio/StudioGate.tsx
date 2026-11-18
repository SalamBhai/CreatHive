'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LockSimple } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';

interface StudioGateProps {
  onEnter: (handle: string) => void;
  isPending?: boolean;
}

export function StudioGate({ onEnter, isPending }: StudioGateProps) {
  const [handle, setHandle] = useState('');

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] text-[#18181B]">
      <div className="px-6 pt-8">
        <Link href="/explore" aria-label="CreatHive home">
          <CreatHiveWordmark size="sm" href={null} />
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF2EE] text-[#FF5A36]">
          <LockSimple size={22} weight="duotone" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#FF5A36]">Creator Studio</p>
        <h1 className="mt-3 font-editorial text-4xl font-semibold leading-tight">Sign in to your space.</h1>

        <Surface className="mt-8 space-y-4 p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = handle.trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
              if (clean) onEnter(clean);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-xs font-bold">Your handle</label>
              <input
                autoFocus
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="sheriff"
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#FF5A36]"
              />
              <p className="mt-1 text-[11px] text-stone-500">creathive.app/@{handle.replace(/^@/, '').toLowerCase() || 'yourname'}</p>
            </div>
            <NeoButton type="submit" variant="primary" size="lg" className="w-full" disabled={isPending} icon={<ArrowRight size={16} weight="bold" />}>
              {isPending ? 'Opening…' : 'Enter Studio'}
            </NeoButton>
          </form>
        </Surface>

        <p className="mt-5 text-center text-xs text-stone-600">
          New here? <Link href="/join" className="font-bold text-[#FF5A36]">Request your space</Link>
        </p>
      </main>
    </div>
  );
}
