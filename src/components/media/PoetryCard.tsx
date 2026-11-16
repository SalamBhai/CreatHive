'use client';

import React, { useState } from 'react';
import { Feather, HandsClapping, BookOpen } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { CreativePiece } from '@/lib/types';
import { NeoButton } from '../ui/NeoButton';
import { BottomSheet } from '../ui/BottomSheet';
import { useApplaudPiece } from '@/lib/store';

interface PoetryCardProps {
  piece: CreativePiece;
}

export function PoetryCard({ piece }: PoetryCardProps) {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const applaudMutation = useApplaudPiece();

  const handleApplaud = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 25,
      spread: 60,
      origin: { x, y },
      colors: ['#FF5A36', '#FFAE19', '#18181B'],
    });

    applaudMutation.mutate(piece.id);
  };

  return (
    <>
      <div className="bg-white border-2 border-[#18181B] rounded-2xl neo-shadow overflow-hidden transition-all">
        {/* Editorial Top Accent */}
        <div className="p-5 md:p-6 bg-[#FCFAF6] border-b border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5F3FF] border border-[#8B5CF6]/40 text-[#8B5CF6] text-xs font-bold">
              <Feather size={13} weight="duotone" />
              <span>Poetry & Verse</span>
            </span>

            {piece.contextNote && (
              <span className="text-[11px] font-semibold text-stone-500">
                {piece.contextNote}
              </span>
            )}
          </div>

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
          <NeoButton
            variant="secondary"
            size="sm"
            onClick={() => setIsReaderOpen(true)}
            icon={<BookOpen size={16} weight="duotone" />}
          >
            Read Full Poem
          </NeoButton>

          <NeoButton
            variant="amber"
            size="sm"
            onClick={handleApplaud}
            icon={<HandsClapping size={16} weight="duotone" />}
          >
            <span>{piece.applauseCount}</span>
          </NeoButton>
        </div>
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
              {piece.contextNote || 'Original Creative Writing'}
            </span>
            <NeoButton
              variant="amber"
              size="sm"
              onClick={handleApplaud}
              icon={<HandsClapping size={16} weight="duotone" />}
            >
              Applaud ({piece.applauseCount})
            </NeoButton>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
