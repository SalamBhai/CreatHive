'use client';

import React, { useState } from 'react';
import { Sparkle, HandsClapping, Play, Pause } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { CreativePiece } from '@/lib/types';
import { NeoButton } from '../ui/NeoButton';
import { useApplaudPiece } from '@/lib/store';

interface VideoReelCardProps {
  piece: CreativePiece;
}

export function VideoReelCard({ piece }: VideoReelCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const applaudMutation = useApplaudPiece();

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
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

  return (
    <div className="bg-white border-2 border-[#18181B] rounded-2xl neo-shadow overflow-hidden transition-all">
      {/* Media Video Viewport */}
      <div className="relative aspect-video md:aspect-video w-full bg-black overflow-hidden group">
        {piece.mediaUrl ? (
          <video
            ref={videoRef}
            src={piece.mediaUrl}
            poster={piece.coverImageUrl}
            playsInline
            loop
            onClick={togglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />
        ) : (
          <img
            src={piece.coverImageUrl}
            alt={piece.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Play / Pause Overlay Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-white/90 border-2 border-[#18181B] neo-shadow flex items-center justify-center text-[#18181B] hover:scale-105 transition-transform">
            {isPlaying ? (
              <Pause size={24} weight="bold" />
            ) : (
              <Play size={24} weight="bold" className="ml-1" />
            )}
          </div>
        </button>

        {/* Top Discipline Tag */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18181B]/80 backdrop-blur-xs text-white text-xs font-bold border border-white/20">
            <Sparkle size={13} weight="duotone" className="text-[#FFAE19]" />
            <span>{piece.discipline === 'DANCE' ? 'Dance Performance' : 'Motion Reel'}</span>
          </span>
        </div>

        {piece.duration && (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-xs font-mono font-medium">
              {piece.duration}
            </span>
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
            {piece.contextNote || 'Performance Showcase'}
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
