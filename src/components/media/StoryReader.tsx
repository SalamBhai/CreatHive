'use client';

import React from 'react';
import Image from 'next/image';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { sanitizeHtml } from '@/lib/sanitize';
import type { ContentBlock, CreativePiece } from '@/lib/types';

function Block({ block }: { block: ContentBlock }) {
  if (block.type === 'divider') return <hr className="my-8 border-stone-200" />;
  if (block.type === 'image') {
    if (!block.url) return null;
    return (
      <figure className="my-7">
        <Image
          src={block.url}
          alt={block.caption || ''}
          width={900}
          height={600}
          unoptimized
          className="h-auto w-full rounded-xl border border-stone-200"
        />
        {block.caption ? (
          <figcaption className="mt-2 text-center text-xs italic text-stone-500">
            {block.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  if (!block.html) return null;
  const className =
    block.type === 'heading'
      ? 'font-editorial text-2xl font-semibold text-[#18181B] mt-8 mb-3'
      : block.type === 'quote'
        ? 'my-7 border-l-2 border-[#FF5A36] pl-4 font-editorial text-lg italic leading-relaxed text-stone-700'
        : 'my-4 text-[15px] leading-[1.85] text-stone-800';
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html || '') }} />;
}

interface StoryReaderProps {
  piece: CreativePiece;
  isOpen: boolean;
  onClose: () => void;
}

export function StoryReader({ piece, isOpen, onClose }: StoryReaderProps) {
  const blocks = piece.contentBlocks || [];
  if (!blocks.length) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={piece.title}
      subtitle={piece.subtitle}
    >
      <article className="mx-auto max-w-prose pb-6">
        {blocks.map((block) => (
          <Block key={block.id} block={block} />
        ))}
      </article>
    </BottomSheet>
  );
}
