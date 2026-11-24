'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MicrophoneStage,
  Feather,
  Waveform,
  Sparkle,
  Cube,
  DeviceMobile,
  BezierCurve,
  FilmStrip,
  CirclesThree,
} from '@phosphor-icons/react';
import { CreativeDiscipline } from '@/lib/types';

interface DisciplineChipProps {
  discipline: CreativeDiscipline | 'ALL';
  label?: string;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const DISCIPLINE_CONFIG: Record<
  CreativeDiscipline | 'ALL',
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  ALL: {
    label: 'All Work',
    icon: CirclesThree,
    color: '#18181B',
    bg: '#FFFFFF',
  },
  SPOKEN_WORDS_POETRY: {
    label: 'Spoken Words & Poetry',
    icon: MicrophoneStage,
    color: '#FF5A36',
    bg: '#FFF2EE',
  },
  SPOKEN_WORD: {
    label: 'Spoken Words & Poetry',
    icon: MicrophoneStage,
    color: '#FF5A36',
    bg: '#FFF2EE',
  },
  POETRY: {
    label: 'Spoken Words & Poetry',
    icon: Feather,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  MUSIC: {
    label: 'Music & Vocals',
    icon: Waveform,
    color: '#06B6D4',
    bg: '#ECFEFF',
  },
  DANCE: {
    label: 'Dance & Reel',
    icon: Sparkle,
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  TECH_IMAGERY: {
    label: 'Tech Imagery',
    icon: Cube,
    color: '#10B981',
    bg: '#ECFDF5',
  },
  UIUX_DESIGN: {
    label: 'UI/UX & Mobile',
    icon: DeviceMobile,
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  GRAPHIC_DESIGN: {
    label: 'Brand & Visuals',
    icon: BezierCurve,
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  MOTION_ANIMATION: {
    label: 'Motion Graphics',
    icon: FilmStrip,
    color: '#F97316',
    bg: '#FFF7ED',
  },
  OTHER: {
    label: 'Creative Craft',
    icon: Sparkle,
    color: '#6B7280',
    bg: '#F3F4F6',
  },
};

export function DisciplineChip({
  discipline,
  label,
  isSelected = false,
  onClick,
  size = 'md',
}: DisciplineChipProps) {
  const config = DISCIPLINE_CONFIG[discipline] || DISCIPLINE_CONFIG.OTHER;
  const IconComponent = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs md:text-sm gap-2',
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center whitespace-nowrap rounded-full border border-stone-200 bg-white font-bold transition-colors select-none focus:outline-none ${
        sizeClasses[size]
      } ${
        isSelected
          ? 'border-[#18181B] bg-[#18181B] text-white'
          : 'text-stone-700 hover:border-stone-400'
      }`}
    >
      <IconComponent
        size={size === 'sm' ? 14 : 17}
        weight="duotone"
        color={isSelected ? '#FFAE19' : config.color}
      />
      <span>{displayLabel}</span>
    </motion.button>
  );
}
