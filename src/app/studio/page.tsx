'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Eye,
  ArrowUpRight,
  PaperPlaneTilt,
  Megaphone,
  Tray,
  ClockCounterClockwise,
  PencilSimple,
} from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { PieceForm } from '@/components/studio/PieceForm';
import { StudioShell, type StudioView } from '@/components/studio/StudioShell';
import { useCreativePieces, useCreativeProfile, useInquiries } from '@/lib/store';

const currentUsername = 'sheriff';

function StatCard({
  value,
  label,
  tone = 'ink',
}: {
  value: string | number;
  label: string;
  tone?: 'ink' | 'coral' | 'amber';
}) {
  const toneClass =
    tone === 'coral' ? 'text-[#FF5A36]' : tone === 'amber' ? 'text-[#FFAE19]' : 'text-[#18181B]';
  return (
    <Surface className="p-4 md:p-5">
      <div className={`font-editorial text-3xl font-semibold leading-none md:text-4xl ${toneClass}`}>
        {value}
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
    </Surface>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#FF5A36]">{eyebrow}</p>
        <h1 className="mt-2 font-editorial text-3xl font-semibold leading-tight md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-stone-600 md:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export default function StudioPage() {
  const [view, setView] = useState<StudioView>('overview');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: profile } = useCreativeProfile(currentUsername);
  const { data: pieces } = useCreativePieces(currentUsername);
  const { data: inquiries } = useInquiries();

  const pieceCount = pieces?.length || 0;
  const applauseTotal = (pieces || []).reduce((sum, p) => sum + p.applauseCount, 0);

  const openAdd = () => setIsAddOpen(true);

  const pieceRows = (limit?: number) =>
    (pieces || [])
      .slice(0, limit ?? pieces?.length ?? 0)
      .map((piece) => {
        const config = DISCIPLINE_CONFIG[piece.discipline] || DISCIPLINE_CONFIG.OTHER;
        const Icon = config.icon;
        return (
          <div
            key={piece.id}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-colors hover:border-stone-300 md:p-4"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 md:h-11 md:w-11"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={19} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-[#18181B]">{piece.title}</h3>
              <p className="mt-0.5 truncate text-[11px] text-stone-500">
                {config.label} · {piece.applauseCount} applauses
              </p>
            </div>
            <Link
              href={`/${currentUsername}`}
              className="rounded-lg border border-stone-200 p-2 text-stone-600 transition-colors hover:border-stone-400 hover:text-[#18181B]"
              title="View on public portfolio"
            >
              <Eye size={15} weight="bold" />
            </Link>
          </div>
        );
      });

  const emptyPanel = (
    icon: React.ElementType,
    title: string,
    description: string,
    cta?: string
  ) => {
    const Icon = icon;
    return (
      <Surface className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF2EE] text-[#FF5A36]">
          <Icon size={24} weight="duotone" />
        </div>
        <h2 className="mt-4 font-editorial text-2xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-600 md:text-sm">{description}</p>
        {cta ? (
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 rounded-full bg-[#18181B] px-5 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            {cta}
          </button>
        ) : null}
      </Surface>
    );
  };

  const shell = (
    <StudioShell
      view={view}
      onViewChange={setView}
      username={currentUsername}
      preview={
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
              <Eye size={15} weight="bold" />
              Live public preview
            </div>
            <Link href={`/${currentUsername}`} target="_blank" aria-label="Open public portfolio">
              <ArrowUpRight size={15} weight="bold" className="text-stone-400 hover:text-[#FF5A36]" />
            </Link>
          </div>
          <iframe
            src={`/${currentUsername}`}
            title="Public portfolio preview"
            className="h-[640px] w-full border-0 bg-white"
          />
        </Surface>
      }
    >
      {view === 'overview' ? (
        <>
          <SectionHeading
            eyebrow="Creator Studio"
            title={`Welcome back, ${profile?.displayName?.split(' ')[0] || 'Creator'}`}
            description="Publish work, respond to opportunities, and see what your portfolio is doing — all from one calm workspace."
            action={
              <NeoButton variant="primary" icon={<Plus size={17} weight="bold" />} onClick={openAdd}>
                Add New Piece
              </NeoButton>
            }
          />

          <div className="grid grid-cols-3 gap-3">
            <StatCard value={pieceCount} label="Pieces" />
            <StatCard value={applauseTotal} label="Applauses" tone="coral" />
            <StatCard value={profile?.stats.viewsCount || 0} label="Views" tone="amber" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Surface className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-xl font-semibold">Recent work</h2>
                <button
                  type="button"
                  onClick={() => setView('pieces')}
                  className="text-[11px] font-bold text-[#FF5A36] hover:underline"
                >
                  Manage all →
                </button>
              </div>
              <div className="mt-4 space-y-2.5">{pieceRows(3)}</div>
            </Surface>

            <Surface className="p-5">
              <h2 className="font-editorial text-xl font-semibold">Next actions</h2>
              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3.5 text-left transition-colors hover:border-[#FF5A36]"
                >
                  <span className="rounded-lg bg-[#FFF2EE] p-2 text-[#FF5A36]">
                    <PencilSimple size={18} weight="duotone" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Publish a new piece</span>
                    <span className="block text-[11px] text-stone-500">Audio, video, text or imagery</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('inquiries')}
                  className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3.5 text-left transition-colors hover:border-[#FF5A36]"
                >
                  <span className="rounded-lg bg-[#F5F3FF] p-2 text-[#8B5CF6]">
                    <PaperPlaneTilt size={18} weight="duotone" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Review inquiries</span>
                    <span className="block text-[11px] text-stone-500">
                      {inquiries?.length || 0} received so far
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('campaigns')}
                  className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3.5 text-left transition-colors hover:border-[#FF5A36]"
                >
                  <span className="rounded-lg bg-[#FFF7ED] p-2 text-[#F97316]">
                    <Megaphone size={18} weight="duotone" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">Plan a campaign</span>
                    <span className="block text-[11px] text-stone-500">Collect work by niche</span>
                  </span>
                </button>
              </div>
            </Surface>
          </div>
        </>
      ) : null}

      {view === 'pieces' ? (
        <>
          <SectionHeading
            eyebrow="Your library"
            title="Creative pieces"
            description="Everything you have published, in one place. Add new work as your practice evolves."
            action={
              <NeoButton variant="primary" icon={<Plus size={17} weight="bold" />} onClick={openAdd}>
                Add New Piece
              </NeoButton>
            }
          />
          <div className="space-y-2.5">{pieceRows()}</div>
        </>
      ) : null}

      {view === 'submissions'
        ? emptyPanel(
            Tray,
            'Submissions, organized.',
            'When a campaign opens, submissions will collect here — grouped by niche, ready to review, accept or decline.',
            undefined
          )
        : null}

      {view === 'campaigns'
        ? emptyPanel(
            Megaphone,
            'Campaigns, coming soon.',
            'Create a call for work, choose the niches it belongs to, and share one link to collect submissions.'
          )
        : null}

      {view === 'inquiries' ? (
        <>
          <SectionHeading
            eyebrow="Opportunities"
            title="Inquiries"
            description="Performance, collaboration and booking requests sent from your public profile."
          />
          {inquiries && inquiries.length > 0 ? (
            <div className="space-y-2.5">
              {inquiries.map((inquiry) => (
                <Surface key={inquiry.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold">{inquiry.senderName}</h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {inquiry.senderEmail} · {inquiry.eventType.toLowerCase()}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <ClockCounterClockwise size={12} weight="bold" />
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-stone-700">{inquiry.message}</p>
                </Surface>
              ))}
            </div>
          ) : (
            emptyPanel(
              PaperPlaneTilt,
              'No inquiries yet.',
              'When someone books or reaches out from your public profile, the request will appear here.'
            )
          )}
        </>
      ) : null}

      {view === 'profile' && profile ? (
        <>
          <SectionHeading
            eyebrow="Identity"
            title="Profile settings"
            description="The basics that appear across your public page, Explore cards and share previews."
          />
          <Surface className="p-5 md:p-6">
            <div className="flex flex-wrap items-start gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-20 w-20 rounded-2xl border border-stone-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-editorial text-2xl font-semibold">{profile.displayName}</h2>
                <p className="text-xs font-semibold text-[#FF5A36]">@{profile.username}</p>
                <p className="mt-2 text-sm text-stone-700">{profile.tagline}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{profile.bio}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
              {profile.disciplines.map((d) => {
                const config = DISCIPLINE_CONFIG[d] || DISCIPLINE_CONFIG.OTHER;
                return (
                  <span
                    key={d}
                    className="rounded-full border border-stone-200 px-3 py-1 text-[11px] font-bold text-stone-600"
                  >
                    {config.label}
                  </span>
                );
              })}
            </div>
          </Surface>
        </>
      ) : null}
    </StudioShell>
  );

  return (
    <>
      {shell}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Publish New Creative Work"
        subtitle="Add a spoken word piece, poem, dance reel, or UI tech imagery."
      >
        <PieceForm profile={profile!} onSuccess={() => setIsAddOpen(false)} />
      </BottomSheet>
    </>
  );
}
