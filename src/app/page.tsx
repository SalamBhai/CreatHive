'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { StudioLink } from '@/components/ui/StudioLink';
import { VisualScene } from '@/components/landing/VisualScene';
import { useAllProfiles } from '@/lib/store';
import { resolveAvatarUrl } from '@/lib/avatar';
import { cloudinaryImageUrl } from '@/lib/cloudinary-image';


const EASE = [0.22, 1, 0.36, 1] as const;

function GhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-black"
    >
      {children}
      <ArrowUpRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

function SolidLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-[#FF5A36] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_30px_rgba(255,90,54,0.35)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
    >
      {children}
      <ArrowUpRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

function SceneHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-editorial text-4xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
      {children}
    </h2>
  );
}

function SceneNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 max-w-lg font-sans-ui text-sm leading-relaxed text-white/75 sm:text-base">
      {children}
    </p>
  );
}

const SCENE_COUNT = 5;

export default function HomePage() {
  const { data: profiles } = useAllProfiles();
  const deckRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const { scrollYProgress } = useScroll();
  const scrollProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    restDelta: 0.001,
  });

  // On mobile the scenes are a horizontal snap deck; track the active panel.
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const onScroll = () => {
      setActiveScene(Math.round(deck.scrollLeft / deck.clientWidth));
    };
    deck.addEventListener('scroll', onScroll, { passive: true });
    return () => deck.removeEventListener('scroll', onScroll);
  }, []);

  const goToScene = (index: number) => {
    const deck = deckRef.current;
    if (!deck) return;
    deck.scrollTo({ left: index * deck.clientWidth, behavior: 'smooth' });
  };

  return (
    <main className="relative bg-[#0B0B0C] text-white">
      {/* Reading progress — the only persistent UI chrome. */}
      <motion.div
        aria-hidden
        style={{ scaleX: scrollProgress }}
        className="fixed inset-x-0 top-0 z-50 hidden h-[2px] origin-left bg-[#FF5A36] md:block"
      />

      {/* Fixed, quiet header. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 h-28 bg-gradient-to-b from-black/70 to-transparent" />
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-14">
        <Link href="/explore" aria-label="CreatHive (pronounced Creative), home">
          <CreatHiveWordmark size="sm" tone="light" href={null} />
        </Link>
        <StudioLink className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white">
          Studio <span aria-hidden>↗</span>
        </StudioLink>
      </header>

      {/* Mobile: splash-style page dots. Desktop uses the progress bar above. */}
      <nav
        aria-label="Scene navigation"
        className="fixed inset-x-0 bottom-5 z-40 flex justify-center gap-2 md:hidden"
      >
        {Array.from({ length: SCENE_COUNT }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to scene ${index}`}
            aria-current={activeScene === index ? 'true' : undefined}
            onClick={() => goToScene(index)}
            className={`h-1.5 rounded-full transition-all ${
              activeScene === index ? 'w-6 bg-[#FF5A36]' : 'w-1.5 bg-white/45'
            }`}
          />
        ))}
      </nav>

      {/* Mobile: one full-screen panel per swipe. Desktop: vertical story. */}
      <div
        ref={deckRef}
        className="no-scrollbar flex h-[100svh] w-screen snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain md:block md:h-auto md:w-full md:overflow-visible"
      >
      {/* 00 — The lockup */}
      <VisualScene
        image="/images/scenes/hero.jpg"
        alt="A performer reaching into a haze of stage light"
        imagePosition="center 35%"
        priority
        align="center"
        centerGlow
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <CreatHiveWordmark size="hero" tone="light" showTagline href={null} />
        </motion.div>
        <p className="mt-10 font-sans-ui text-sm tracking-[0.2em] text-white/75 sm:text-base md:mt-12">
          ONE LINK. EVERY NICHE.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <SolidLink href="/explore">Explore Arts</SolidLink>
          <GhostLink href="/studio">Creator Studio</GhostLink>
        </div>
        <div className="mt-16 flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/45">
          <span className="md:hidden">Swipe</span>
          <span className="hidden md:inline">Scroll</span>
          <motion.span
            aria-hidden
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="md:hidden"
          >
            <ArrowRight size={14} weight="bold" />
          </motion.span>
          <motion.span
            aria-hidden
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden md:block"
          >
            <ArrowDown size={14} weight="bold" />
          </motion.span>
        </div>
      </VisualScene>

      {/* 01 — Spoken words and poetry */}
      <VisualScene
        label="Spoken Words, Thoughts & Poetry"
        image="/images/scenes/spoken-word.jpg"
        alt="A microphone lit by a warm spotlight in a dark room"
      >
        <SceneHeading>Let your voice be heard.</SceneHeading>
        <SceneNote>Play your audio. Share your script. Read a poem.</SceneNote>
      </VisualScene>

      {/* 02 — Dance */}
      <VisualScene
        label="Dance & Reels"
        image="/images/scenes/dance.jpg"
        alt="A dancer in motion against a dark studio backdrop"
        imagePosition="center 30%"
      >
        <SceneHeading>Show your moves.</SceneHeading>
        <SceneNote>Watch full videos, with no clutter.</SceneNote>
      </VisualScene>

      {/* 04 — Design */}
      <VisualScene
        label="Tech Imagery & UI/UX"
        image="/images/scenes/design.jpg"
        alt="A design system open on a computer beside a notebook"
      >
        <SceneHeading>Show what you made.</SceneHeading>
        <SceneNote>Screens, designs and 3D work.</SceneNote>
      </VisualScene>

      {/* 05 — The close */}
      <VisualScene
        label="One Link"
        image="/images/scenes/closing.jpg"
        alt="A crowd under concert lights with hands raised"
        align="center"
      >
        <SceneHeading>One link for it all.</SceneHeading>
        <SceneNote>Book, applaud and share your work.</SceneNote>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <SolidLink href="/explore">Explore Arts</SolidLink>
          <GhostLink href="/studio">Creator Studio</GhostLink>
        </div>

        {profiles && profiles.length > 0 ? (
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/${profile.username}`}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 py-1.5 pl-1.5 pr-3 text-[11px] font-semibold text-white/80 backdrop-blur-sm transition-colors hover:border-white/60 hover:text-white"
              >
                <Image
                  src={cloudinaryImageUrl(resolveAvatarUrl(profile.avatarUrl, profile.displayName || 'CreatHive'), 96)}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  className="h-6 w-6 rounded-full object-cover"
                />
                @{profile.username}
              </Link>
            ))}
          </div>
        ) : null}
      </VisualScene>
      </div>

      {/* Quiet footer, kept off the visual narrative. */}
      <footer className="hidden items-center justify-between bg-[#0B0B0C] px-6 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 md:flex md:px-14">
        <span>YPAT 2026 to 2027</span>
        <span>Built for the limitless Creatives...</span>
      </footer>
    </main>
  );
}
