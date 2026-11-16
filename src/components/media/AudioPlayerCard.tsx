'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  HandsClapping,
  Article,
  MicrophoneStage,
  ShareNetwork,
} from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { CreativePiece } from '@/lib/types';
import { NeoButton } from '../ui/NeoButton';
import { useApplaudPiece } from '@/lib/store';
import { StoryReader } from './StoryReader';

interface AudioPlayerCardProps {
  piece: CreativePiece;
}

export function AudioPlayerCard({ piece }: AudioPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(165); // default fallback ~2:45
  const [showTranscript, setShowTranscript] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const applaudMutation = useApplaudPiece();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleApplaud = (e: React.MouseEvent) => {
    // Fire confetti from button position
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)] transition-all">
      {/* Audio element */}
      {piece.mediaUrl && (
        <audio ref={audioRef} src={piece.mediaUrl} preload="metadata" />
      )}

      {/* Header Info */}
      <div className="border-b border-stone-200 bg-[#FAF8F5] p-4 md:p-5">
        <div className="mb-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#FF5A36]/40 bg-[#FFF2EE] px-2.5 py-1 text-xs font-bold text-[#FF5A36]">
          <MicrophoneStage size={13} weight="duotone" />
          <span>Spoken Word</span>
        </div>

        <h3 className="font-editorial text-xl font-semibold leading-tight text-[#18181B] md:text-2xl">
          {piece.title}
        </h3>

        {piece.subtitle && (
          <p className="mt-2 line-clamp-2 font-sans-ui text-xs leading-relaxed text-stone-600">
            {piece.subtitle}
          </p>
        )}
      </div>

      {/* Player Core Bar */}
      <div className="p-4 md:p-5 space-y-4">
        {/* Animated Waveform Visualization */}
        <div className="h-12 flex items-center justify-center gap-1 bg-[#FDFBF7] border border-stone-200 rounded-xl px-4 py-2 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => {
            // Dynamic bar heights
            const baseH = [20, 45, 75, 30, 90, 60, 40, 85, 95, 35, 70, 50, 80, 100, 65, 40, 85, 55, 30, 90, 75, 45, 60, 35, 70, 40, 25, 50][i % 28];
            const isBarActive = (currentTime / duration) * 28 > i;

            return (
              <motion.div
                key={i}
                animate={
                  isPlaying
                    ? {
                        height: [`${baseH * 0.4}%`, `${baseH}%`, `${baseH * 0.6}%`],
                      }
                    : { height: `${baseH * 0.6}%` }
                }
                transition={{
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 0.5 + (i % 5) * 0.1,
                  ease: 'easeInOut',
                }}
                className={`w-1 rounded-full transition-colors duration-150 ${
                  isBarActive
                    ? 'bg-gradient-to-t from-[#FF5A36] to-[#FFAE19]'
                    : 'bg-stone-300'
                }`}
              />
            );
          })}
        </div>

        {/* Time Scrubber */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#FF5A36]"
          />
          <div className="flex justify-between text-xs font-semibold text-stone-500 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Play/Pause Button */}
          <NeoButton
            variant="primary"
            size="md"
            onClick={togglePlay}
            icon={
              isPlaying ? (
                <Pause size={18} weight="bold" />
              ) : (
                <Play size={18} weight="bold" />
              )
            }
          >
            {isPlaying ? 'Pause' : 'Listen Now'}
          </NeoButton>

          <div className="flex items-center gap-2">
            {piece.contentBlocks && piece.contentBlocks.length > 0 ? (
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => setShowStory(true)}
                icon={<Article size={16} weight="duotone" />}
              >
                Read Story
              </NeoButton>
            ) : null}

            {/* Read Transcript Toggle */}
            {piece.textContent && (
              <NeoButton
                variant="secondary"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                icon={<Article size={16} weight="duotone" />}
              >
                {showTranscript ? 'Hide Script' : 'Read Script'}
              </NeoButton>
            )}

            {/* Applaud Button */}
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

        {/* Expandable Substack-Style Transcript Drawer */}
        <AnimatePresence>
          {showTranscript && piece.textContent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pt-3 border-t border-stone-200"
            >
              <div className="p-4 bg-[#FDFBF7] rounded-xl border border-stone-200 font-editorial text-[#18181B] text-base leading-relaxed whitespace-pre-line italic">
                <div className="text-xs font-sans-ui uppercase tracking-wider text-stone-500 font-bold mb-2 not-italic">
                  Spoken Word Performance Script
                </div>
                {piece.textContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StoryReader
        piece={piece}
        isOpen={showStory}
        onClose={() => setShowStory(false)}
      />
    </div>
  );
}
