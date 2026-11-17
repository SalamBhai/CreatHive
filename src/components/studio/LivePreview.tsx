'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, ArrowUpRight, ArrowsClockwise } from '@phosphor-icons/react';
import { Surface } from '@/components/ui/Surface';

export function LivePreview({ username, refreshKey }: { username: string; refreshKey: number }) {
  return (
    <Surface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <Eye size={15} weight="bold" />
          Live public preview
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${username}`} target="_blank" aria-label="Open public portfolio">
            <ArrowUpRight size={15} weight="bold" className="text-stone-400 hover:text-[#FF5A36]" />
          </Link>
        </div>
      </div>
      <iframe
        key={refreshKey}
        src={`/${username}?preview=${refreshKey}`}
        title="Public portfolio preview"
        className="h-[640px] w-full border-0 bg-white"
      />
    </Surface>
  );
}

export function PreviewRefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Refresh preview"
      aria-label="Refresh preview"
      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600 transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
    >
      <ArrowsClockwise size={14} weight="bold" />
      Refresh
    </button>
  );
}
