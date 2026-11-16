'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  MicrophoneStage,
  Feather,
  DeviceMobile,
  FilmStrip,
  CheckCircle,
} from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { NeoButton } from '@/components/ui/NeoButton';
import { useAllProfiles } from '@/lib/store';

export default function HomePage() {
  const { data: profiles } = useAllProfiles();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-stone-200/80 bg-[#FDFBF7]/90 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <CreatHiveWordmark size="sm" />

          <div className="flex items-center gap-2">
            <Link href="/studio">
              <NeoButton variant="secondary" size="sm">
                Studio
              </NeoButton>
            </Link>
            <Link href="/sheriff">
              <NeoButton variant="primary" size="sm">
                View YPAT Showcase
              </NeoButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-10 w-full">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          {/* Hero Wordmark & Tagline (Seamless CreatHive) */}
          <div className="py-2">
            <CreatHiveWordmark size="hero" showTagline={true} />
          </div>

          <p className="text-xs md:text-base text-stone-700 font-sans-ui max-w-lg mx-auto leading-relaxed">
            No messy Google Drive links. No lost talent in email threads. A single, high-converting stage for spoken word artists, dancers, poets, and visual tech creators.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Link href="/sheriff">
              <NeoButton
                variant="primary"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
              >
                Explore @sheriff Showcase
              </NeoButton>
            </Link>

            <Link href="/studio">
              <NeoButton variant="amber" size="lg">
                Enter Creator Studio
              </NeoButton>
            </Link>
          </div>
        </div>

        {/* The 4 Creative Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-5 neo-shadow space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFF2EE] border-2 border-[#18181B] flex items-center justify-center text-[#FF5A36]">
              <MicrophoneStage size={22} weight="duotone" />
            </div>
            <h3 className="text-base font-bold font-sans-ui text-[#18181B]">
              Spoken Word & Audio Streaming
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans-ui">
              Integrated tactile audio player with dynamic pulsing waveforms and synchronized read-along performance transcripts.
            </p>
          </div>

          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-5 neo-shadow space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] border-2 border-[#18181B] flex items-center justify-center text-[#F59E0B]">
              <DeviceMobile size={22} weight="duotone" />
            </div>
            <h3 className="text-base font-bold font-sans-ui text-[#18181B]">
              UI/UX & Tech Imagery
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans-ui">
              Showcase mobile screen flows, 3D Afro-futurist renders, and design prototypes visually without code clutter.
            </p>
          </div>

          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-5 neo-shadow space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border-2 border-[#18181B] flex items-center justify-center text-[#8B5CF6]">
              <Feather size={22} weight="duotone" />
            </div>
            <h3 className="text-base font-bold font-sans-ui text-[#18181B]">
              Substack-Grade Poetry Reader
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans-ui">
              Literary typography and distraction-free reader mode that gives poems and creative writing the prestige they deserve.
            </p>
          </div>

          <div className="bg-white border-2 border-[#18181B] rounded-2xl p-5 neo-shadow space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] border-2 border-[#18181B] flex items-center justify-center text-[#EC4899]">
              <FilmStrip size={22} weight="duotone" />
            </div>
            <h3 className="text-base font-bold font-sans-ui text-[#18181B]">
              Dance & Motion Reels
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans-ui">
              Fluid video cards with ambient previews, instant applause feedback, and direct booking inquiry triggers.
            </p>
          </div>
        </div>

        {/* Featured Profiles Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-sans-ui text-[#18181B]">
              Featured YPAT Creatives
            </h2>
            <span className="text-xs text-stone-500 font-medium">Cohort 2026–27</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles?.map((p) => (
              <Link key={p.id} href={`/${p.username}`} className="group block">
                <div className="bg-white border-2 border-[#18181B] rounded-2xl p-4 neo-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-4">
                  <img
                    src={p.avatarUrl}
                    alt={p.displayName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-[#18181B] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-[#18181B] truncate group-hover:text-[#FF5A36] transition-colors">
                        {p.displayName}
                      </h4>
                      <CheckCircle size={14} weight="fill" className="text-[#FF5A36] shrink-0" />
                    </div>
                    <p className="text-xs text-stone-600 font-medium truncate mt-0.5">
                      {p.tagline}
                    </p>
                    <div className="text-[11px] font-mono font-bold text-stone-400 mt-1">
                      @{p.username} • {p.stats.piecesCount} works
                    </div>
                  </div>
                  <ArrowRight size={18} weight="bold" className="text-stone-400 group-hover:text-[#18181B] transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-6 px-4 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <CreatHiveWordmark size="sm" />
          <p className="text-xs text-stone-500 font-sans-ui">
            Crafted for the Young People&apos;s Action Team (YPAT 2026–27) & limitless creatives everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
