'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CalendarBlank, Gift, Check, ClockCounterClockwise } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { Surface } from '@/components/ui/Surface';
import { NeoButton } from '@/components/ui/NeoButton';
import { FilterTabs, type FilterOption } from '@/components/ui/FilterTabs';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useSession, useAuthReady } from '@/lib/auth';
import { useCreativeProfile, useCampaigns, useSubmissions, useCreateSubmission } from '@/lib/store';

type Filter = 'OPEN' | 'ALL' | 'MINE';
const FILTERS: Array<FilterOption<Filter>> = [
  { value: 'OPEN', label: 'Open briefs' },
  { value: 'ALL', label: 'All' },
  { value: 'MINE', label: 'My submissions' },
];

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'border-[#FFAE19]/40 bg-[#FFFBEB] text-[#B45309]',
  REVIEWING: 'border-amber-300 bg-amber-50 text-amber-700',
  ACCEPTED: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-stone-300 bg-stone-100 text-stone-600',
};

export default function CampaignsClient() {
  const session = useSession();
  const ready = useAuthReady();
  const { data: profile } = useCreativeProfile(session?.username || '');
  const { data: campaigns, isLoading } = useCampaigns();
  const { data: submissions } = useSubmissions();
  const createSubmission = useCreateSubmission();
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [submitted, setSubmitted] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
      </div>
    );
  }

  const mySubmissions = (submissions || []).filter((s) => s.creativeId === profile?.id);
  const submittedIds = new Set(mySubmissions.map((s) => s.campaignId));

  const visible = (campaigns || []).filter((c) => {
    if (filter === 'OPEN') return c.status === 'OPEN';
    if (filter === 'MINE') return submittedIds.has(c.id);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/explore" aria-label="Back to Explore">
            <CreatHiveWordmark size="sm" href={null} />
          </Link>
          <Link href="/studio" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-bold text-[#18181B] hover:border-[#FF5A36] hover:text-[#FF5A36]">
            <ArrowLeft size={14} weight="bold" /> Studio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#FF5A36]">Opportunities</p>
        <h1 className="mt-2 font-editorial text-4xl font-semibold leading-tight md:text-5xl">Campaigns</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
          Campaigns are open briefs from the CreatHive team. Pick one that fits your work, submit a piece,
          and our reviewers will take it from there. New briefs appear here as they open.
        </p>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-[#FFF7ED] p-5">
          <h2 className="font-editorial text-lg font-semibold">How it works</h2>
          <ol className="mt-3 grid gap-2 text-xs leading-relaxed text-stone-700 sm:grid-cols-3">
            <li><span className="font-bold text-[#FF5A36]">1. Choose</span> — browse an open brief below.</li>
            <li><span className="font-bold text-[#FF5A36]">2. Submit</span> — attach a published piece, or create one and pick the campaign.</li>
            <li><span className="font-bold text-[#FF5A36]">3. Track</span> — follow the status here: open → reviewing → accepted / rejected.</li>
          </ol>
        </div>

        <div className="mt-8"><FilterTabs options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Campaign filter" /></div>

        {isLoading ? (
          <div className="mt-8 flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
          </div>
        ) : visible.length ? (
          <div className="mt-6 space-y-3">
            {visible.map((c) => {
              const mine = mySubmissions.find((s) => s.campaignId === c.id);
              const justSubmitted = submitted === c.id;
              const config = DISCIPLINE_CONFIG[c.discipline] || DISCIPLINE_CONFIG.OTHER;
              return (
                <Surface key={c.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                        {config.icon ? <config.icon size={11} weight="duotone" /> : null}{config.label}
                      </span>
                      <h3 className="mt-2 font-editorial text-xl font-semibold">{c.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">{c.description}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-stone-500">
                        {c.reward ? <span className="inline-flex items-center gap-1"><Gift size={13} /> {c.reward}</span> : null}
                        {c.deadline ? <span className="inline-flex items-center gap-1"><CalendarBlank size={13} /> {new Date(c.deadline).toLocaleDateString()}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {mine ? (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[mine.status]}`}>
                          {mine.status === 'ACCEPTED' ? <Check size={12} weight="bold" /> : <ClockCounterClockwise size={12} weight="bold" />}
                          {mine.status.toLowerCase()}
                        </span>
                      ) : c.status === 'OPEN' && profile ? (
                        justSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><Check size={13} weight="bold" /> Submitted</span>
                        ) : (
                          <NeoButton
                            variant="primary"
                            size="sm"
                            disabled={createSubmission.isPending}
                            onClick={() => {
                              createSubmission.mutate(
                                { campaignId: c.id, creativeId: profile.id },
                                { onSuccess: () => setSubmitted(c.id) }
                              );
                            }}
                          >
                            Submit interest
                          </NeoButton>
                        )
                      ) : null}
                      <Link href="/studio" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5A36] hover:underline">
                        Use in Add Piece <ArrowUpRight size={12} weight="bold" />
                      </Link>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-stone-300 p-12 text-center">
            <p className="font-editorial text-xl text-stone-600">
              {filter === 'MINE' ? 'No submissions yet.' : 'No campaigns here right now.'}
            </p>
            <p className="mt-2 text-xs text-stone-500">New briefs will appear here as they open.</p>
          </div>
        )}

        {createSubmission.isError ? (
          <p className="mt-4 text-xs font-semibold text-red-600">Could not submit. Please try again.</p>
        ) : null}
      </main>
    </div>
  );
}
