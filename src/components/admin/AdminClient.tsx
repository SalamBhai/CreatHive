'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SignOut } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { Surface } from '@/components/ui/Surface';
import { NeoButton } from '@/components/ui/NeoButton';
import { FilterTabs, type FilterOption } from '@/components/ui/FilterTabs';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { PushOptIn } from '@/components/pwa/PushOptIn';
import { notifyPush } from '@/lib/push';
import { signOut, useSession, useAuthReady } from '@/lib/auth';
import {
  useAdminInquiriesPage,
  useAdminPiecesPage,
  useAdminProfilesPage,
  useAdminStats,
  useAuditLogPage,
  useAllProfiles,
  useCampaigns,
  useCampaignsPage,
  useCreateCampaign,
  useCreativeProfile,
  useFlagsPage,
  useSubmissionsPage,
  useUpdateCampaignStatus,
  useUpdateFlagStatus,
  useUpdateSubmissionStatus,
  useSetProfileAdmin,
  useLogAdminAction,
} from '@/lib/store';
import type { CampaignStatus, CreativeDiscipline, SubmissionStatus } from '@/lib/types';
import { ADMIN_PAGE_SIZE } from '@/lib/repository/types';

type Tab =
  | 'overview'
  | 'creators'
  | 'pieces'
  | 'inquiries'
  | 'campaigns'
  | 'submissions'
  | 'flags'
  | 'audit';

const TABS: Array<FilterOption<Tab>> = [
  { value: 'overview', label: 'Overview' },
  { value: 'creators', label: 'Creators' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'inquiries', label: 'Inquiries' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'flags', label: 'Flags' },
  { value: 'audit', label: 'Audit log' },
];

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#FF5A36]';

function Pager({ total, page, onPage }: { total: number; page: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-stone-500">
      <span>Page {page + 1} of {pages} · {total} total</span>
      <span className="flex gap-2">
        <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
        <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
      </span>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <Surface className="p-4">
      <div className="font-editorial text-3xl font-semibold leading-none text-[#18181B]">{value}</div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{label}</div>
    </Surface>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#FF5A36]">Administration</p>
        <h1 className="mt-2 font-editorial text-3xl font-semibold md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-xs leading-relaxed text-stone-600 md:text-sm">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function AdminPage() {
  const session = useSession();
  const { data: ownProfile } = useCreativeProfile(session?.username || '');
  const [tab, setTab] = useState<Tab>('overview');
  const [pagesByTab, setPagesByTab] = useState<Partial<Record<Tab, number>>>({});
  const page = pagesByTab[tab] || 0;
  const setPage = (next: number) => setPagesByTab({ ...pagesByTab, [tab]: next });

  // Full list is only for resolving author names in other tabs.
  const { data: profiles } = useAllProfiles();
  const { data: stats } = useAdminStats();
  const { data: profilePage } = useAdminProfilesPage(page, tab === 'creators');
  const { data: piecePage } = useAdminPiecesPage(page, tab === 'pieces');
  const { data: inquiryPage } = useAdminInquiriesPage(page, tab === 'inquiries');
  // Lightweight lookup so submissions can show campaign titles on any page.
  const { data: allCampaigns } = useCampaigns();
  const { data: campaignPage } = useCampaignsPage(page, tab === 'campaigns');
  const { data: submissionPage } = useSubmissionsPage(page, tab === 'submissions');
  const { data: flagPage } = useFlagsPage(page, tab === 'flags');
  const { data: auditPage } = useAuditLogPage(page, tab === 'audit');

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaignStatus();
  const updateSubmission = useUpdateSubmissionStatus();
  const updateFlag = useUpdateFlagStatus();
  const setAdmin = useSetProfileAdmin();
  const log = useLogAdminAction();

  const [draft, setDraft] = useState({ title: '', description: '', discipline: 'ALL' as CreativeDiscipline | 'ALL', reward: '', deadline: '' });

  const authReady = useAuthReady();
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
        <div className="px-6 pt-8"><Link href="/explore"><CreatHiveWordmark size="sm" href={null} /></Link></div>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
          <Surface className="w-full p-8">
            <h1 className="font-editorial text-2xl font-semibold">Admin access</h1>
            <p className="mt-3 text-sm text-stone-600">Sign in with an administrator account to manage CreatHive.</p>
            <Link href="/studio" className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-[#FF5A36]">Go to sign in →</Link>
          </Surface>
        </main>
      </div>
    );
  }

  if (!ownProfile?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDFBF7]">
        <div className="px-6 pt-8"><Link href="/explore"><CreatHiveWordmark size="sm" href={null} /></Link></div>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 text-center">
          <Surface className="w-full p-8">
            <h1 className="font-editorial text-2xl font-semibold">Not authorised</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Your account is signed in but is not an administrator. An existing admin can enable access from the Creators tab.
            </p>
            <Link href="/explore" className="mt-6 inline-block text-xs font-bold uppercase tracking-widest text-[#FF5A36]">Back to Explore →</Link>
          </Surface>
        </main>
      </div>
    );
  }

  const nameById = new Map((profiles || []).map((p) => [p.id, p]));

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/explore" aria-label="CreatHive home"><CreatHiveWordmark size="sm" href={null} /></Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-stone-700 sm:inline">
              {ownProfile?.displayName || session?.displayName || 'Admin'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Admin</span>
            <PushOptIn compact />
            <button type="button" onClick={() => void signOut()} title="Sign out" className="rounded-xl border border-stone-200 bg-white p-2 text-stone-500 hover:border-[#FF5A36] hover:text-[#FF5A36]">
              <SignOut size={16} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-16 z-20 border-b border-stone-200 bg-[#FDFBF7]/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl"><FilterTabs
          options={TABS}
          value={tab}
          onChange={(next) => {
            setTab(next);
            setPagesByTab({}); // a page valid for one list may not exist in another
          }}
          ariaLabel="Admin sections"
        /></div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {tab === 'overview' ? (
          <Section title="Overview" description="A quiet snapshot of the hive — people, work, opportunities and things needing attention.">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat value={stats?.liveCreators ?? 0} label="Live creators" />
              <Stat value={stats?.pieces ?? 0} label="Pieces" />
              <Stat value={stats?.pendingInquiries ?? 0} label="Pending inquiries" />
              <Stat value={stats?.openCampaigns ?? 0} label="Open campaigns" />
              <Stat value={stats?.submissions ?? 0} label="Submissions" />
              <Stat value={stats?.openFlags ?? 0} label="Open flags" />
              <Stat value={stats?.applause ?? 0} label="Applauses" />
            </div>
          </Section>
        ) : null}

        {tab === 'creators' ? (
          <Section title="Creators" description="Profiles on CreatHive. Grant or revoke admin access here.">
            <Surface className="divide-y divide-stone-100 p-2">
              {(profilePage?.items || []).map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/${p.username}`} className="text-sm font-bold hover:text-[#FF5A36]">{p.displayName}</Link>
                    <p className="truncate text-[11px] text-stone-500">@{p.username} · {p.disciplines.map((d) => DISCIPLINE_CONFIG[d]?.label || d).join(', ')}</p>
                  </div>
                  {p.isAdmin ? <span className="rounded-full bg-[#FFF2EE] px-2 py-0.5 text-[9px] font-bold uppercase text-[#FF5A36]">Admin</span> : null}
                  <button
                    type="button"
                    disabled={!p.isYPATData}
                    onClick={() => { setAdmin.mutate({ id: p.id, makeAdmin: !p.isAdmin }); log.mutate({ action: p.isAdmin ? 'revoke_admin' : 'grant_admin', target: p.id }); }}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:border-[#FF5A36] hover:text-[#FF5A36] disabled:opacity-40"
                  >
                    {p.isAdmin ? 'Revoke' : 'Make admin'}
                  </button>
                </div>
              ))}
            </Surface>
          </Section>
        ) : null}

        {tab === 'pieces' ? (
          <Section title="Pieces" description="Everything published, including drafts and unlisted work.">
            <Surface className="divide-y divide-stone-100 p-2">
              {(piecePage?.items || []).map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/p/${p.id}`} className="text-sm font-bold hover:text-[#FF5A36]">{p.title}</Link>
                    <p className="text-[11px] text-stone-500">{nameById.get(p.creativeId)?.displayName || 'Unknown'} · {DISCIPLINE_CONFIG[p.discipline]?.label || p.discipline}</p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase text-stone-600">{p.status || 'PUBLIC'}</span>
                </div>
              ))}
            </Surface>
          </Section>
        ) : null}

        {tab === 'inquiries' ? (
          <Section title="Inquiries" description="Booking and collaboration requests sent from public profiles.">
            <Surface className="divide-y divide-stone-100 p-2">
              {(inquiryPage?.items || []).map((i) => (
                <div key={i.id} className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">{i.senderName} <span className="font-normal text-stone-500">→ {nameById.get(i.creativeId)?.displayName || 'creator'}</span></p>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase text-stone-600">{i.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">{i.senderEmail} · {i.eventType.toLowerCase()}</p>
                  <p className="mt-2 text-xs leading-relaxed text-stone-700">{i.message}</p>
                </div>
              ))}
              {!inquiryPage?.items.length ? <p className="p-6 text-center text-xs text-stone-500">No inquiries yet.</p> : null}
            </Surface>
          </Section>
        ) : null}

        {tab === 'campaigns' ? (
          <Section title="Campaigns" description="Create briefs that creators can submit work to.">
            <Surface className="space-y-3 p-5">
              <h2 className="font-editorial text-lg font-semibold">New campaign</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <select className={inputClass} value={draft.discipline} onChange={(e) => setDraft({ ...draft, discipline: e.target.value as CreativeDiscipline | 'ALL' })}>
                  <option value="ALL">All niches</option>
                  {(Object.keys(DISCIPLINE_CONFIG) as CreativeDiscipline[]).filter((d) => d !== 'OTHER').map((d) => (
                    <option key={d} value={d}>{DISCIPLINE_CONFIG[d].label}</option>
                  ))}
                </select>
              </div>
              <textarea className={`${inputClass} min-h-20`} placeholder="Brief" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className={inputClass} placeholder="Reward (optional)" value={draft.reward} onChange={(e) => setDraft({ ...draft, reward: e.target.value })} />
                <input className={inputClass} type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
              </div>
              <NeoButton
                variant="primary"
                disabled={!draft.title.trim() || createCampaign.isPending}
                onClick={() => {
                  createCampaign.mutate({
                    title: draft.title.trim(),
                    description: draft.description.trim(),
                    discipline: draft.discipline,
                    reward: draft.reward || undefined,
                    deadline: draft.deadline ? new Date(draft.deadline).toISOString() : undefined,
                    status: 'OPEN',
                  });
                  log.mutate({ action: 'create_campaign', target: draft.title.trim() });
                  setDraft({ title: '', description: '', discipline: 'ALL', reward: '', deadline: '' });
                }}
              >
                Publish campaign
              </NeoButton>
            </Surface>
            <Surface className="divide-y divide-stone-100 p-2">
              {(campaignPage?.items || []).map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{c.title}</p>
                    <p className="text-[11px] text-stone-500">{DISCIPLINE_CONFIG[c.discipline]?.label || c.discipline}{c.reward ? ` · ${c.reward}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-stone-400">{c.status}</span>
                  <button
                    type="button"
                    onClick={() => { const next = (c.status === 'OPEN' ? 'CLOSED' : 'OPEN') as CampaignStatus; updateCampaign.mutate({ id: c.id, status: next }); log.mutate({ action: next === 'OPEN' ? 'reopen_campaign' : 'close_campaign', target: c.id }); }}
                    className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:border-[#FF5A36] hover:text-[#FF5A36]"
                  >
                    {c.status === 'OPEN' ? 'Close' : 'Reopen'}
                  </button>
                </div>
              ))}
              {!campaignPage?.items.length ? <p className="p-6 text-center text-xs text-stone-500">No campaigns yet.</p> : null}
            </Surface>
          </Section>
        ) : null}

        {tab === 'submissions' ? (
          <Section title="Submissions" description="Work sent in response to campaigns.">
            <Surface className="divide-y divide-stone-100 p-2">
              {(submissionPage?.items || []).map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{nameById.get(s.creativeId)?.displayName || 'Creator'}</p>
                    <p className="text-[11px] text-stone-500">{allCampaigns?.find((c) => c.id === s.campaignId)?.title || 'Campaign'}{s.note ? ` · ${s.note}` : ''}</p>
                  </div>
                  <select
                    className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[11px] font-bold"
                    value={s.status}
                    onChange={(e) => { const next = e.target.value as SubmissionStatus; updateSubmission.mutate({ id: s.id, status: next }, { onSuccess: () => { if (next === 'ACCEPTED' || next === 'REJECTED') void notifyPush('submission_decision', s.id); } }); log.mutate({ action: 'set_submission_status', target: s.id, meta: { status: next } }); }}
                  >
                    {(['OPEN', 'REVIEWING', 'ACCEPTED', 'REJECTED'] as SubmissionStatus[]).map((status) => (
                      <option key={status} value={status}>{status.toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              ))}
              {!submissionPage?.items.length ? <p className="p-6 text-center text-xs text-stone-500">No submissions yet.</p> : null}
            </Surface>
          </Section>
        ) : null}

        {tab === 'flags' ? (
          <Section title="Flags" description="Reports from the community.">
            <Surface className="divide-y divide-stone-100 p-2">
              {(flagPage?.items || []).map((f) => (
                <div key={f.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{f.targetType} · {f.targetId}</p>
                    <p className="text-[11px] text-stone-500">{f.reason}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-stone-400">{f.status}</span>
                  {f.status === 'OPEN' ? (
                    <button type="button" onClick={() => { updateFlag.mutate({ id: f.id, status: 'RESOLVED' }); log.mutate({ action: 'resolve_flag', target: f.id }); }} className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:border-[#FF5A36] hover:text-[#FF5A36]">Resolve</button>
                  ) : null}
                </div>
              ))}
              {!flagPage?.items.length ? <p className="p-6 text-center text-xs text-stone-500">No flags yet.</p> : null}
            </Surface>
          </Section>
        ) : null}

        {tab === 'audit' ? (
          <Section title="Audit log" description="Privileged actions, with the admin who performed them.">
            <Surface className="divide-y divide-stone-100 p-2">
              {(auditPage?.items || []).map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{entry.action.replace(/_/g, ' ')}</p>
                    <p className="truncate text-[11px] text-stone-500">
                      {nameById.get(entry.adminId || '')?.displayName ||
                        (entry.adminId ? entry.adminId.slice(0, 8) : 'System')}
                      {entry.target ? ` · ${entry.target.slice(0, 24)}` : ''}
                      {entry.meta && Object.keys(entry.meta).length
                        ? ` · ${Object.entries(entry.meta).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}`
                        : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {!auditPage?.items.length ? <p className="p-6 text-center text-xs text-stone-500">No audit events yet.</p> : null}
            </Surface>
          </Section>
        ) : null}

        {tab !== 'overview' ? (
          <Pager
            total={
              tab === 'creators' ? (profilePage?.total || 0) :
              tab === 'pieces' ? (piecePage?.total || 0) :
              tab === 'inquiries' ? (inquiryPage?.total || 0) :
              tab === 'campaigns' ? (campaignPage?.total || 0) :
              tab === 'submissions' ? (submissionPage?.total || 0) :
              tab === 'flags' ? (flagPage?.total || 0) :
              (auditPage?.total || 0)
            }
            page={page}
            onPage={setPage}
          />
        ) : null}
      </main>
    </div>
  );
}
