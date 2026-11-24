'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, SquaresFour } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { ProfileHero } from '@/components/portfolio/ProfileHero';
import { PieceRenderer } from '@/components/portfolio/PieceRenderer';
import { ConversionBar } from '@/components/portfolio/ConversionBar';
import { StudioLink } from '@/components/ui/StudioLink';
import { useSession } from '@/lib/auth';
import { ProfileViewTracker } from '@/components/portfolio/ProfileViewTracker';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { FilterTabs, type FilterOption } from '@/components/ui/FilterTabs';
import { useCreativeProfile, useCreativePieces } from '@/lib/store';
import {
  CreativeDiscipline,
  CreativePiece,
  CreativeProfile,
} from '@/lib/types';

interface PortfolioViewProps {
  username: string;
  initialProfile?: CreativeProfile;
  initialPieces?: CreativePiece[];
}

export function PortfolioView({ username, initialProfile, initialPieces }: PortfolioViewProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState<CreativeDiscipline | 'ALL'>('ALL');
  const session = useSession();

  const { data: profile } = useCreativeProfile(username, initialProfile);
  const { data: pieces, isLoading: isPiecesLoading } = useCreativePieces(
    username,
    selectedDiscipline,
    initialPieces
  );

  if (!profile) {
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
  const availableDisciplines: Array<CreativeDiscipline | 'ALL'> = ['ALL'];
  for (const discipline of profile.disciplines) {
    if (!availableDisciplines.includes(discipline)) availableDisciplines.push(discipline);
  }
  // Existing work may use a discipline the profile doesn't list.
  for (const piece of pieces || []) {
    if (!availableDisciplines.includes(piece.discipline)) availableDisciplines.push(piece.discipline);
  }

  const filterOptions: Array<FilterOption<CreativeDiscipline | 'ALL'>> =
    availableDisciplines.map((discipline) => {
      const config = DISCIPLINE_CONFIG[discipline] || DISCIPLINE_CONFIG.OTHER;
      return { value: discipline, label: config.label, icon: config.icon };
    });

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-28">
      {/* Top App Header (Mobile Native Feeling) */}
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200/80 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <CreatHiveWordmark size="sm" />

          <div className="flex items-center gap-2">
            {session ? (
              <StudioLink
                aria-label="Open Studio"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-[#18181B] hover:border-[#FF5A36] hover:text-[#FF5A36] sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
              >
                <SquaresFour size={17} weight="bold" className="sm:hidden" />
                <span className="hidden font-sans-ui text-[11px] font-bold sm:inline">Studio ↗</span>
              </StudioLink>
            ) : null}
            <span className="font-sans-ui text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 border border-stone-300 text-stone-700">
              @{profile.username}
            </span>
          </div>
        </div>
      </header>

      <ProfileViewTracker profile={profile} />

      {/* Main Content Feed */}
      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-2 pt-5">
        {/* Profile Hero Card */}
        <ProfileHero profile={profile} />

        {/* Sticky Filter Bar */}
        <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-[#FDFBF7]/95 backdrop-blur-xs border-y border-stone-200">
          <FilterTabs
            options={filterOptions}
            value={selectedDiscipline}
            onChange={setSelectedDiscipline}
            ariaLabel="Filter work by niche"
          />
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

      {/* Onboarding nudge only for visitors — signed-in creators go to Studio. */}
      {!session ? (
        <footer className="relative z-10 flex justify-center px-6 pb-36 pt-10 md:pb-40">
          <Link
            href="/join"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-bold text-[#18181B] shadow-[0_8px_30px_rgba(24,24,27,0.14)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Join the Hive
            <ArrowUpRight size={15} weight="bold" />
          </Link>
        </footer>
      ) : null}

      {/* Sticky Bottom Conversion Bar */}
      <ConversionBar profile={profile} />
    </div>
  );
}
