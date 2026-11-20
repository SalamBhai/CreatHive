'use client';

import React, { useState } from 'react';
import { Feather, HandsClapping, BookOpen } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { CreativePiece } from '@/lib/types';
import { StoryReader } from './StoryReader';
import { NeoButton } from '../ui/NeoButton';
import { BottomSheet } from '../ui/BottomSheet';
import { useApplaudPiece } from '@/lib/store';
import { ApplauseNotice } from './ApplauseNotice';

interface PoetryCardProps {
  piece: CreativePiece;
}

export function PoetryCard({ piece }: PoetryCardProps) {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const applaudMutation = useApplaudPiece();

  const handleApplaud = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
    applaudMutation.mutate(piece.id, {
      onSuccess: () =>
        confetti({ particleCount: 25, spread: 60, origin, colors: ['#FF5A36', '#FFAE19', '#18181B'] }),
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)] transition-all">
        {/* Editorial Top Accent */}
        <div className="p-5 md:p-6 bg-[#FCFAF6] border-b border-stone-200 space-y-3">
          <span className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#8B5CF6]/40 bg-[#F5F3FF] px-2.5 py-1 text-xs font-bold leading-none text-[#8B5CF6]">
            <Feather size={13} weight="duotone" />
            <span>Poetry</span>
          </span>

          <h3 className="text-xl md:text-2xl font-editorial font-bold text-[#18181B] leading-tight italic">
            “{piece.title}”
          </h3>

          {piece.subtitle && (
            <p className="text-xs text-stone-600 font-sans-ui leading-relaxed">
              {piece.subtitle}
            </p>
          )}

          {/* Excerpt */}
          {piece.textContent && (
            <div className="font-editorial italic text-stone-700 text-sm leading-relaxed border-l-2 border-[#FFAE19] pl-3 py-1 line-clamp-3">
              {piece.textContent}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 md:p-5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            {piece.contentBlocks && piece.contentBlocks.length > 0 ? (
              <NeoButton variant="secondary" size="sm" onClick={() => setShowStory(true)}>
                Read Story
              </NeoButton>
            ) : null}
            <NeoButton
              variant="secondary"
              size="sm"
              onClick={() => setIsReaderOpen(true)}
              icon={<BookOpen size={16} weight="duotone" />}
            >
              Read Full Poem
            </NeoButton>
          </div>

          <NeoButton
            variant="amber"
            size="sm"
            disabled={applaudMutation.isPending}
            onClick={handleApplaud}
            icon={<HandsClapping size={16} weight="duotone" />}
          >
            <span>{piece.applauseCount}</span>
          </NeoButton>
        </div>
        {applaudMutation.isError ? (
          <ApplauseNotice message={String(applaudMutation.error?.message || '')} />
        ) : null}
      </div>

      {/* Full Substack-Style Reader Modal */}
      <BottomSheet
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        title={piece.title}
        subtitle={piece.subtitle}
      >
        <div className="max-w-prose mx-auto py-4 space-y-6">
          <div className="font-editorial text-[#18181B] text-lg md:text-xl leading-relaxed whitespace-pre-line italic">
            {piece.textContent}
          </div>

          <div className="pt-6 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500 font-sans-ui">
              Original creative writing
            </span>
            <NeoButton
              variant="amber"
              size="sm"
              disabled={applaudMutation.isPending}
              onClick={handleApplaud}
              icon={<HandsClapping size={16} weight="duotone" />}
            >
              Applaud ({piece.applauseCount})
            </NeoButton>
          </div>
        </div>
      </BottomSheet>

      <StoryReader piece={piece} isOpen={showStory} onClose={() => setShowStory(false)} />
    </>
  );
}
