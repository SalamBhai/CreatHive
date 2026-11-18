'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { StudioLink } from '@/components/ui/StudioLink';
import { FilterTabs, type FilterOption } from '@/components/ui/FilterTabs';
import { Surface } from '@/components/ui/Surface';
import { resolveAvatarUrl } from '@/lib/avatar';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useAllPieces, useAllProfiles } from '@/lib/store';
import type { CreativeDiscipline } from '@/lib/types';

const NICHES = [
  'ALL',
  'SPOKEN_WORD',
  'POETRY',
  'DANCE',
  'MUSIC',
  'TECH_IMAGERY',
  'UIUX_DESIGN',
  'GRAPHIC_DESIGN',
  'MOTION_ANIMATION',
] as const;

type NicheFilter = (typeof NICHES)[number];

const nicheOptions: Array<FilterOption<NicheFilter>> = NICHES.map((value) => {
  const config = DISCIPLINE_CONFIG[value as CreativeDiscipline | 'ALL'];
  return {
    value,
    label: value === 'ALL' ? 'All Niches' : config.label,
    icon: config.icon,
  };
});

export default function ExplorePage() {
  const [niche, setNiche] = useState<NicheFilter>('ALL');
  const { data: profiles } = useAllProfiles();
  const { data: pieces, isLoading } = useAllPieces();

  const profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  const visiblePieces = (pieces || [])
    .filter((piece) => niche === 'ALL' || piece.discipline === niche)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/explore" aria-label="CreatHive (pronounced Creative) — home">
            <CreatHiveWordmark size="sm" href={null} />
          </Link>
          <StudioLink className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600 hover:text-[#FF5A36]">
            Studio <span aria-hidden>↗</span>
          </StudioLink>
        </div>
      </header>

      {/* Editorial masthead */}
      <section className="border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#FF5A36]">
            The Commons
          </p>
          <h1 className="mt-4 max-w-3xl font-editorial text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
            Explore the hive.
          </h1>
          <p className="mt-5 max-w-xl font-sans-ui text-sm leading-relaxed text-stone-600 md:text-base">
            Work from the YPAT cohort — spoken word, dance, poetry, and design, in one quiet place.
          </p>

          {profiles && profiles.length > 0 ? (
            <div className="mt-9 flex flex-wrap items-center gap-2.5">
              {profiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/${profile.username}`}
                  className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 transition-colors hover:border-[#FF5A36]"
                >
                  <Image
                    src={resolveAvatarUrl(profile.avatarUrl, profile.displayName || 'CreatHive')}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-stone-700 group-hover:text-[#18181B]">
                    {profile.displayName}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Niches filter */}
      <div className="sticky top-16 z-20 border-b border-stone-200 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <FilterTabs
            options={nicheOptions}
            value={niche}
            onChange={setNiche}
            ariaLabel="Niches"
          />
        </div>
      </div>

      {/* The feed */}
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
          </div>
        ) : visiblePieces.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePieces.map((piece, index) => {
              const author = profileById[piece.creativeId];
              const config = DISCIPLINE_CONFIG[piece.discipline] || DISCIPLINE_CONFIG.OTHER;
              return (
                <motion.article
                  key={piece.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.04 }}
                >
                  <Link
                    href={author ? `/${author.username}` : '/'}
                    className="group block h-full"
                    aria-label={`${piece.title} by ${author?.displayName ?? 'a CreatHive creative'}`}
                  >
                    <Surface interactive className="flex h-full flex-col overflow-hidden">
                      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                        <Image
                          src={piece.coverImageUrl || '/images/scenes/hero.jpg'}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#18181B] backdrop-blur">
                          {config.label}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <h2 className="font-editorial text-2xl font-semibold leading-tight text-[#18181B] transition-colors group-hover:text-[#FF5A36]">
                          {piece.title}
                        </h2>
                        <p className="mt-2 line-clamp-2 font-sans-ui text-xs leading-relaxed text-stone-600">
                          {piece.subtitle || 'A new piece from the hive.'}
                        </p>

                        <div className="mt-auto flex items-center gap-2.5 pt-6">
                          {author ? (
                            <>
                              <Image
                                src={resolveAvatarUrl(author.avatarUrl, author.displayName || 'CreatHive')}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#18181B]">
                                  {author.displayName}
                                </p>
                                <p className="text-[11px] text-stone-500">@{author.username}</p>
                              </div>
                            </>
                          ) : null}
                          <ArrowUpRight
                            size={16}
                            weight="bold"
                            className="ml-auto text-stone-400 transition-colors group-hover:text-[#FF5A36]"
                          />
                        </div>
                      </div>
                    </Surface>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-editorial text-2xl text-stone-600">Nothing in this niche yet.</p>
            <button
              type="button"
              onClick={() => setNiche('ALL')}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-[#FF5A36]"
            >
              Show all work
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-center sm:flex-row sm:text-left">
          <CreatHiveWordmark size="sm" />
          <p className="text-[11px] font-medium text-stone-500">
            Built for the limitless creatives — YPAT 2026–27.
          </p>
        </div>
      </footer>
    </div>
  );
}
