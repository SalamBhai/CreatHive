'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, ArrowUpRight, PaperPlaneTilt, ClockCounterClockwise } from '@phosphor-icons/react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { PieceForm } from '@/components/studio/PieceForm';
import { ProfileEditor } from '@/components/studio/ProfileEditor';
import { StudioShell, type StudioView } from '@/components/studio/StudioShell';
import type { CreativePiece } from '@/lib/types';
import {
  useCreativePieces,
  useCreativeProfile,
  useCreateProfile,
  useInquiries,
  useUpdateInquiryStatus,
} from '@/lib/store';
import { signInLocal, signOut, useAuthReady } from '@/lib/auth';
import { requestInquiryReplyEmail } from '@/lib/inquiry-reply';
import { usingSupabase } from '@/lib/supabase';
import { useDataSource } from '@/lib/data-source';
import { StudioGate } from '@/components/studio/StudioGate';
import { SupabaseAuthGate } from '@/components/studio/SupabaseAuthGate';
import { LivePreview } from '@/components/studio/LivePreview';
import { PieceManager } from '@/components/studio/PieceManager';

const DEMO_USERNAME = 'sheriff';

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

export default function StudioPage({ initialView }: { initialView: StudioView }) {
  const { session } = useDataSource();
  const currentUsername = session?.username || DEMO_USERNAME;
  const router = useRouter();

  // Tabs are routes, so refresh/refresh-preserving links keep the same view.
  const goToView = (next: StudioView) =>
    router.push(next === 'overview' ? '/studio' : `/studio/${next}`);
  const view = initialView;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});
  const [editingPiece, setEditingPiece] = useState<CreativePiece | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const refreshPreview = () => setPreviewKey((k) => k + 1);
  const { data: rawProfile } = useCreativeProfile(currentUsername);
  const { data: rawPieces } = useCreativePieces(currentUsername);
  // The signed-in creative always sees their own profile, even if it is a seed
  // record — filtering it here used to hide the editor and the Add Piece form.
  const profile = rawProfile ?? null;
  // Scoped to this user's id by useCreativePieces; the repository already
  // handles mock/real replacement, so no second filter is needed here.
  const pieces = rawPieces ?? [];
  const { data: inquiries } = useInquiries(profile?.id);
  const createProfile = useCreateProfile();
  const updateInquiry = useUpdateInquiryStatus();

  const pieceCount = pieces?.length || 0;
  const applauseTotal = (pieces || []).reduce((sum, p) => sum + p.applauseCount, 0);
  const pendingCount = (inquiries || []).filter((i) => i.status === 'PENDING').length;

  const openAdd = () => {
    setEditingPiece(null);
    setIsAddOpen(true);
  };

  const openEdit = (piece: CreativePiece) => {
    setEditingPiece(piece);
    setIsAddOpen(true);
  };

  const handleEnter = (handle: string) => {
    const existing = profile?.username === handle ? profile : undefined;
    if (!existing) {
      createProfile.mutate(
        {
          id: `c-${handle}-temp`,
          username: handle,
          displayName: handle,
          tagline: 'Creative on CreatHive',
          bio: 'Making things and sharing them with the hive.',
          avatarUrl:
            'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
          bannerGradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
          disciplines: ['OTHER'],
          location: '',
          isAvailableForGigs: true,
          socialLinks: {},
          themeStyle: 'soft-brutal',
          stats: { viewsCount: 0, applauseCount: 0, piecesCount: 0 },
          createdAt: new Date().toISOString(),
        },
        {
          onSuccess: () => signInLocal({ username: handle, displayName: handle, email: '' }),
        }
      );
    } else {
      signInLocal({ username: handle, displayName: existing.displayName, email: '' });
    }
  };

  // Wait for the session to resolve before choosing a gate — otherwise a
  // signed-in creator briefly sees the sign-in form on every refresh.
  const authReady = useAuthReady();
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return usingSupabase ? (
      <SupabaseAuthGate />
    ) : (
      <StudioGate onEnter={handleEnter} isPending={createProfile.isPending} />
    );
  }

  const recentRows = (limit: number) =>
    (pieces || [])
      .slice(0, limit)
      .map((piece) => {
        const config = DISCIPLINE_CONFIG[piece.discipline] || DISCIPLINE_CONFIG.OTHER;
        const Icon = config.icon;
        return (
          <Link
            key={piece.id}
            href={`/p/${piece.id}`}
            className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-colors hover:border-stone-300"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
              <Icon size={17} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-[#18181B]">{piece.title}</h3>
              <p className="text-[11px] text-stone-500">{config.label} · {piece.applauseCount} applauses</p>
            </div>
            <ArrowUpRight size={14} weight="bold" className="shrink-0 text-stone-400" />
          </Link>
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
      onViewChange={goToView}
      username={currentUsername}
      onSignOut={() => signOut()}
      onRefreshPreview={refreshPreview}
      preview={<LivePreview username={currentUsername} refreshKey={previewKey} />}
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
                  onClick={() => goToView('pieces')}
                  className="text-[11px] font-bold text-[#FF5A36] hover:underline"
                >
                  Manage all →
                </button>
              </div>
              <div className="mt-4 space-y-2.5">{recentRows(3)}</div>
            </Surface>

            <Surface className="p-5">
              <h2 className="font-editorial text-xl font-semibold">Your page</h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                {pieceCount} published {pieceCount === 1 ? 'piece' : 'pieces'} · {inquiries?.length || 0}{' '}
                {inquiries?.length === 1 ? 'inquiry' : 'inquiries'}. Your name, bio and socials are what
                reviewers see first.
              </p>
              <button
                type="button"
                onClick={() => goToView('profile')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A36] hover:underline"
              >
                Edit profile &amp; socials <ArrowUpRight size={14} weight="bold" />
              </button>
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
          <PieceManager
            pieces={pieces || []}
            onEdit={openEdit}
            onRefreshPreview={refreshPreview}
          />
        </>
      ) : null}

      {view === 'inquiries' ? (
        <>
          <SectionHeading
            eyebrow="Opportunities"
            title="Inquiries"
            description={
              pendingCount > 0
                ? `${pendingCount} awaiting review · sent from your public profile.`
                : 'Performance, collaboration and booking requests sent from your public profile.'
            }
          />
          {inquiries && inquiries.length > 0 ? (
            <div className="space-y-2.5">
              {inquiries.map((inquiry) => (
                <Surface key={inquiry.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold">{inquiry.senderName}</h3>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {inquiry.senderEmail} · {inquiry.eventType.toLowerCase()} ·{' '}
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        inquiry.status === 'PENDING'
                          ? 'border-[#FFAE19]/40 bg-[#FFF7ED] text-[#C2410C]'
                          : inquiry.status === 'RESPONDED'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : inquiry.status === 'DECLINED'
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : 'border-stone-200 text-stone-500'
                      }`}
                    >
                      <ClockCounterClockwise size={12} weight="bold" />
                      {inquiry.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-stone-700">{inquiry.message}</p>

                  {inquiry.attachments?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {inquiry.attachments.map((file, index) => (
                        <a
                          key={`${file.url}-${index}`}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          title={`Reference image ${index + 1}`}
                        >
                          <Image
                            src={file.url}
                            alt={`Reference ${index + 1}`}
                            width={64}
                            height={64}
                            unoptimized
                            className="h-16 w-16 rounded-lg border border-stone-200 object-cover transition-transform hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-500">
                    <span>Sent {new Date(inquiry.createdAt).toLocaleDateString()}</span>
                    {inquiry.reviewedAt ? (
                      <span>Reviewed {new Date(inquiry.reviewedAt).toLocaleDateString()}</span>
                    ) : null}
                    {inquiry.respondedAt ? (
                      <span>
                        {inquiry.status === 'DECLINED' ? 'Declined' : 'Responded'}{' '}
                        {new Date(inquiry.respondedAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>

                  {inquiry.replyNote ? (
                    <p className="mt-2 rounded-lg border border-stone-100 bg-stone-50 p-2.5 text-xs text-stone-700">
                      Note: {inquiry.replyNote}
                    </p>
                  ) : null}

                  {!['RESPONDED', 'DECLINED'].includes(inquiry.status) ? (
                    <div className="mt-4 border-t border-stone-200 pt-3">
                      <input
                        value={replyNotes[inquiry.id] || ''}
                        onChange={(e) =>
                          setReplyNotes((current) => ({ ...current, [inquiry.id]: e.target.value }))
                        }
                        placeholder="Private note for yourself (optional)"
                        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs outline-none focus:border-[#FF5A36]"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {inquiry.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => updateInquiry.mutate({ id: inquiry.id, status: 'REVIEWED' })}
                            className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-700 hover:border-[#FF5A36] hover:text-[#FF5A36]"
                          >
                            Mark reviewed
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            updateInquiry.mutate(
                              {
                                id: inquiry.id,
                                status: 'RESPONDED',
                                note: replyNotes[inquiry.id] || undefined,
                              },
                              { onSuccess: () => void requestInquiryReplyEmail(inquiry.id) }
                            )
                          }
                          className="rounded-lg bg-[#18181B] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black"
                        >
                          Mark responded
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateInquiry.mutate(
                              {
                                id: inquiry.id,
                                status: 'DECLINED',
                                note: replyNotes[inquiry.id] || undefined,
                              },
                              { onSuccess: () => void requestInquiryReplyEmail(inquiry.id) }
                            )
                          }
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-500 hover:border-red-400 hover:text-red-600"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ) : null}
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
          <ProfileEditor profile={profile} onSaved={refreshPreview} />
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
        wide
        title={editingPiece ? 'Edit Creative Work' : 'Publish New Creative Work'}
        subtitle={editingPiece ? 'Update the details below and save your changes.' : 'Add a spoken word piece, poem, dance reel, or UI tech imagery.'}
      >
        {profile ? (
          <PieceForm
            key={editingPiece?.id || 'new'}
            profile={profile}
            piece={editingPiece || undefined}
            onSuccess={() => {
              setIsAddOpen(false);
              refreshPreview();
            }}
          />
        ) : null}
      </BottomSheet>
    </>
  );
}
