'use client';

import React, { useState } from 'react';
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
    <div className="bg-white border-2 border-[#18181B] rounded-2xl neo-shadow overflow-hidden transition-all">
      {/* Visual Image Viewport */}
      <div className="relative aspect-[16/10] w-full bg-[#18181B] overflow-hidden group">
        {images.length > 0 && (
          <img
            src={images[currentIndex]}
            alt={`${piece.title} - ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}

        {/* Carousel arrows if multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#18181B] neo-shadow-sm flex items-center justify-center text-[#18181B] hover:bg-white cursor-pointer"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#18181B] neo-shadow-sm flex items-center justify-center text-[#18181B] hover:bg-white cursor-pointer"
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
        <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs font-medium text-stone-500">
            {piece.contextNote || 'Visual Artifact'}
          </span>

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
