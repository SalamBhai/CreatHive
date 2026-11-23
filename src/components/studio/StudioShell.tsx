'use client';

import React from 'react';
import Link from 'next/link';
import {
  SquaresFour,
  Stack,
  UserCircle,
  PaperPlaneTilt,
  ArrowUpRight,
  Eye,
  ArrowLeft,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { PushOptIn } from '@/components/pwa/PushOptIn';

export type StudioView = 'overview' | 'pieces' | 'inquiries' | 'profile';

/**
 * Individual Studio navigation. Creators browse briefs on the Campaigns page
 * (linked in the sidebar) and submit through "Add New Piece". Admin review of
 * campaigns/submissions lives in /admin. See docs/MIGRATION.md.
 */
export const STUDIO_NAV: Array<{
  id: StudioView;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'overview', label: 'Overview', icon: SquaresFour },
  { id: 'pieces', label: 'Pieces', icon: Stack },
  { id: 'inquiries', label: 'Inquiries', icon: PaperPlaneTilt },
  { id: 'profile', label: 'Profile', icon: UserCircle },
];

interface StudioShellProps {
  view: StudioView;
  onViewChange: (view: StudioView) => void;
  username: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
  onSignOut?: () => void;
  onRefreshPreview?: () => void;
}

export function StudioShell({
  view,
  onViewChange,
  username,
  children,
  preview,
  onSignOut,
  onRefreshPreview,
}: StudioShellProps) {
  const renderNavItem = (item: (typeof STUDIO_NAV)[number], mobile = false) => {
    const Icon = item.icon;
    const active = view === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onViewChange(item.id)}
        aria-current={active ? 'page' : undefined}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          mobile ? 'flex-1 flex-col gap-1 rounded-none px-0.5 py-2 text-[9px]' : ''
        } ${
          active
            ? 'bg-[#FFF2EE] text-[#FF5A36]'
            : 'text-stone-600 hover:bg-stone-100 hover:text-[#18181B]'
        }`}
      >
        <Icon size={mobile ? 20 : 18} weight={active ? 'fill' : 'regular'} />
        <span className={mobile ? 'w-full truncate text-center' : ''}>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FDFBF7] text-[#18181B]">
      {/* Top bar — shared across all viewports */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/${username}`}
              className="rounded-xl border border-stone-200 bg-white p-2 text-[#18181B] transition-colors hover:border-stone-400"
              title="Back to Portfolio"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <Link href="/explore" aria-label="CreatHive home">
              <CreatHiveWordmark size="sm" href={null} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <PushOptIn compact />
            <Link
              href={`/${username}`}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold transition-colors hover:border-stone-400 sm:inline-flex"
            >
              <ArrowUpRight size={15} weight="bold" />
              View Public Link
            </Link>
            <Link
              href={`/${username}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white p-2 text-stone-700 sm:hidden"
              aria-label="View public portfolio"
            >
              <Eye size={16} weight="bold" />
            </Link>
            <div className="ml-1 hidden rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 md:block">
              @{username}
            </div>
            {onRefreshPreview ? (
              <button
                type="button"
                onClick={onRefreshPreview}
                title="Refresh preview"
                className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600 transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
              >
                <ArrowsClockwise size={16} weight="bold" />
              </button>
            ) : null}
            {onSignOut ? (
              <button
                type="button"
                onClick={onSignOut}
                className="hidden rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-600 transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36] md:inline-flex"
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-stone-200 px-3 py-6 lg:flex">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">
            Studio
          </p>
          <nav className="flex flex-1 flex-col gap-1" aria-label="Studio sections">
            {STUDIO_NAV.map((item) => renderNavItem(item))}
          </nav>
          <Link
            href="/campaigns"
            className="group mb-3 flex items-center gap-3 rounded-xl border border-[#FF5A36]/30 bg-[#FFF7ED] px-3 py-2.5 text-sm font-semibold text-[#C2410C] transition-colors hover:border-[#FF5A36]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#FF5A36]">
              <SquaresFour size={16} weight="duotone" />
            </span>
            <span className="flex-1">Campaigns</span>
            <ArrowUpRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="font-editorial text-sm font-semibold leading-snug">
              Your work, your way.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              Publish, curate, and track how your portfolio performs — from one calm place.
            </p>
          </div>
        </aside>

        {/* Workspace */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-6 lg:pb-12">
          <div className={preview ? 'grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]' : 'min-w-0'}>
            <div className="min-w-0 space-y-6">{children}</div>
            {preview ? <aside className="hidden min-w-0 xl:block">{preview}</aside> : null}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Studio quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-stone-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {STUDIO_NAV.map((item) => renderNavItem(item, true))}
      </nav>
    </div>
  );
}
