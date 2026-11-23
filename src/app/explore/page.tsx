'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { StudioLink } from '@/components/ui/StudioLink';
import { FilterTabs, type FilterOption } from '@/components/ui/FilterTabs';
import { Surface } from '@/components/ui/Surface';
import { resolveAvatarUrl } from '@/lib/avatar';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useAllPieces, useAllProfiles } from '@/lib/store';
import { searchPieces, searchProfiles } from '@/lib/search';
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

const PAGE_SIZE = 9;
const FEATURED_CREATORS = 6;

export default function ExplorePage() {
  const router = useRouter();
  const [niche, setNiche] = useState<NicheFilter>('ALL');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Chosen once per page load; the server render uses a fixed seed so hydration
  // stays deterministic, and the client seeds from the time on first render.
  const [shuffleSeed] = useState(() => (typeof window === 'undefined' ? 1 : Date.now()));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data: profiles } = useAllProfiles();
  const { data: pieces, isLoading } = useAllPieces();

  const profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  // Featured creators: admins are never shown, search narrows the pool, and a
  // seeded shuffle picks up to six — so the row is random but always capped.
  const featuredCreators = (() => {
    const term = query.trim().toLowerCase();
    const eligible = (profiles || []).filter(
      (profile) =>
        !profile.isAdmin &&
        (!term ||
          profile.displayName?.toLowerCase().includes(term) ||
          profile.username.toLowerCase().includes(term))
    );
    let seed = shuffleSeed || 1;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    return eligible.slice(0, FEATURED_CREATORS);
  })();

  // Text search over title/subtitle/tags and creator name/bio, combined with
  // the niche filter. Matching a creator surfaces all of their pieces.
  const searched = (() => {
    const q = query.trim();
    if (!q) return pieces || [];
    const matched = searchPieces(pieces || [], { query: q });
    const profileRecord = Object.fromEntries((profiles || []).map((p) => [p.username, p]));
    const matchedCreatorIds = new Set(
      searchProfiles(profileRecord, { query: q }).map((p) => p.id)
    );
    const fromCreators = (pieces || []).filter((p) => matchedCreatorIds.has(p.creativeId));
    // De-dupe by id — a piece can match both by text and by its creator.
    return [...new Map([...matched, ...fromCreators].map((p) => [p.id, p])).values()];
  })();
  const visiblePieces = searched
    .filter((piece) => niche === 'ALL' || piece.discipline === niche)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const shown = visiblePieces.slice(0, visibleCount);
  const hasMore = visibleCount < visiblePieces.length;

  // Reveal the next page when the sentinel scrolls into view.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // Reset paging whenever the filter or query changes.
  const changeNiche = (value: NicheFilter) => {
    setNiche(value);
    setVisibleCount(PAGE_SIZE);
  };
  const changeQuery = (value: string) => {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/explore" aria-label="CreatHive (pronounced Creative), home">
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
            Work from the YPAT cohort: spoken word, dance, poetry and design, in one quiet place.
          </p>

          {featuredCreators.length > 0 ? (
            <div className="mt-9 flex flex-wrap items-center gap-2.5">
              {featuredCreators.map((profile) => (
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

      {/* Search + niches filter */}
      <div className="sticky top-16 z-20 border-b border-stone-200 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="relative mb-3 max-w-md">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Search work, tags, creatives…"
              aria-label="Search the hive"
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-xs font-sans-ui outline-none transition-colors placeholder:text-stone-400 focus:border-[#FF5A36]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => changeQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:text-[#FF5A36]"
              >
                <X size={14} weight="bold" />
              </button>
            ) : null}
          </div>
          <FilterTabs
            options={nicheOptions}
            value={niche}
            onChange={changeNiche}
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
            {shown.map((piece, index) => {
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
                    href={`/p/${piece.id}`}
                    className="group block h-full"
                    aria-label={`Read ${piece.title} by ${author?.displayName ?? 'a CreatHive creative'}`}
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
                            <span
                              role="link"
                              tabIndex={0}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/${author.username}`);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/${author.username}`);
                                }
                              }}
                              className="flex cursor-pointer items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]/50"
                              aria-label={`View ${author.displayName}'s profile`}
                            >
                              <Image
                                src={resolveAvatarUrl(author.avatarUrl, author.displayName || 'CreatHive')}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#18181B] transition-colors group-hover:text-[#FF5A36]">
                                  {author.displayName}
                                </p>
                                <p className="text-[11px] text-stone-500">@{author.username}</p>
                              </div>
                            </span>
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
        ) : null}

        {/* Infinite-scroll sentinel + quiet end-of-feed note */}
        {!isLoading && hasMore ? (
          <div ref={sentinelRef} className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
          </div>
        ) : null}
        {!isLoading && visiblePieces.length > PAGE_SIZE && !hasMore ? (
          <p className="py-10 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            You&rsquo;ve seen it all.
          </p>
        ) : null}
        {!isLoading && visiblePieces.length === 0 ? (
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
        ) : null}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-center sm:flex-row sm:text-left">
          <CreatHiveWordmark size="sm" />
          <p className="text-[11px] font-medium text-stone-500">
            Built for the limitless creatives. YPAT 2026 to 2027.
          </p>
        </div>
      </footer>
    </div>
  );
}
