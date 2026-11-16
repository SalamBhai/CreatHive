'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CirclesThree } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { ProfileHero } from '@/components/portfolio/ProfileHero';
import { PieceRenderer } from '@/components/portfolio/PieceRenderer';
import { ConversionBar } from '@/components/portfolio/ConversionBar';
import { DisciplineChip } from '@/components/ui/DisciplineChip';
import { useCreativeProfile, useCreativePieces } from '@/lib/store';
import { CreativeDiscipline } from '@/lib/types';

interface PortfolioViewProps {
  username: string;
}

export function PortfolioView({ username }: PortfolioViewProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState<CreativeDiscipline | 'ALL'>('ALL');

  const { data: profile, isLoading: isProfileLoading } = useCreativeProfile(username);
  const { data: pieces, isLoading: isPiecesLoading } = useCreativePieces(username, selectedDiscipline);

  if (isProfileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <CreatHiveWordmark size="md" />
          <div className="w-8 h-8 border-3 border-[#FF5A36] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Filter list options: All + only the disciplines this creative has work in
  const availableDisciplines: Array<CreativeDiscipline | 'ALL'> = [
    'ALL',
    ...profile.disciplines,
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28">
      {/* Top App Header (Mobile Native Feeling) */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur-md border-b-2 border-[#18181B] px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <CreatHiveWordmark size="sm" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-stone-100 border border-stone-300 text-stone-700">
              @{profile.username}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Feed */}
      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* Profile Hero Card */}
        <ProfileHero profile={profile} />

        {/* Sticky Filter Bar */}
        <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-[#FDFBF7]/95 backdrop-blur-xs border-y border-stone-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {availableDisciplines.map((disc) => (
              <DisciplineChip
                key={disc}
                discipline={disc}
                size="sm"
                isSelected={selectedDiscipline === disc}
                onClick={() => setSelectedDiscipline(disc)}
              />
            ))}
          </div>
        </div>

        {/* Pieces List Feed */}
        <div className="space-y-5">
          {isPiecesLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#FF5A36] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pieces && pieces.length > 0 ? (
            pieces.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PieceRenderer piece={piece} />
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center bg-white border-2 border-dashed border-stone-300 rounded-2xl">
              <p className="text-sm font-semibold text-stone-500 font-sans-ui">
                No creative pieces published under this category yet.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Conversion Bar */}
      <ConversionBar profile={profile} />
    </div>
  );
}
