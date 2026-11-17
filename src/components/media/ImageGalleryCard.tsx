'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DeviceMobile, HandsClapping, CaretLeft, CaretRight, Cube } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { CreativePiece } from '@/lib/types';
import { NeoButton } from '../ui/NeoButton';
import { useApplaudPiece } from '@/lib/store';

interface ImageGalleryCardProps {
  piece: CreativePiece;
}

export function ImageGalleryCard({ piece }: ImageGalleryCardProps) {
  const images = piece.galleryImages && piece.galleryImages.length > 0
    ? piece.galleryImages
    : piece.coverImageUrl
    ? [piece.coverImageUrl]
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const applaudMutation = useApplaudPiece();

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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

  const isUIUX = piece.discipline === 'UIUX_DESIGN';

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)] transition-all">
      {/* Visual Image Viewport */}
      <div className="relative aspect-[16/10] w-full bg-[#18181B] overflow-hidden group">
        {images.length > 0 && (
          <Image
            src={images[currentIndex]}
            alt={`${piece.title} - ${currentIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}

        {/* Carousel arrows if multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-stone-200 shadow-sm flex items-center justify-center text-[#18181B] hover:bg-white cursor-pointer"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-stone-200 shadow-sm flex items-center justify-center text-[#18181B] hover:bg-white cursor-pointer"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </>
        )}

        {/* Discipline Badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18181B]/85 backdrop-blur-xs text-white text-xs font-bold border border-white/20">
            {isUIUX ? (
              <DeviceMobile size={13} weight="duotone" className="text-[#FFAE19]" />
            ) : (
              <Cube size={13} weight="duotone" className="text-[#10B981]" />
            )}
            <span>{isUIUX ? 'UI/UX Mobile Design' : 'Tech Imagery & 3D'}</span>
          </span>
        </div>

        {/* Slide Indicator Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-none">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-[#FF5A36] w-3' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-stone-200 bg-[#FCFAF6] p-2.5">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Show image ${idx + 1}`}
              className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                idx === currentIndex ? 'border-[#FF5A36]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Info & Footer Controls */}
      <div className="p-4 md:p-5 space-y-3">
        <div>
          <h3 className="text-base md:text-lg font-bold font-sans-ui text-[#18181B] leading-snug">
            {piece.title}
          </h3>
          {piece.subtitle && (
            <p className="text-xs text-stone-600 mt-1 font-sans-ui leading-relaxed">
              {piece.subtitle}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {piece.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-semibold text-stone-600 bg-[#F5F3EF] px-2 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Conversion / Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-2">
          <Link
            href={`/p/${piece.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A36] hover:underline"
          >
            View full case study ↗
          </Link>

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
    </div>
  );
}
