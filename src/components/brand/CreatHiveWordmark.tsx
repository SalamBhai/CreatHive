'use client';

import React from 'react';
import Link from 'next/link';

interface CreatHiveWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTagline?: boolean;
  /** Pass `null` to render without a link (e.g. inside another link). */
  href?: string | null;
  className?: string;
  /** Use `light` when placing the wordmark over dark imagery. */
  tone?: 'dark' | 'light';
}

export function CreatHiveWordmark({
  size = 'md',
  showTagline = false,
  href = '/explore',
  className = '',
  tone = 'dark',
}: CreatHiveWordmarkProps) {
  const sizeMap = {
    sm: {
      text: 'text-2xl',
      tagline: 'text-[11px]',
    },
    md: {
      text: 'text-3xl md:text-4xl',
      tagline: 'text-xs md:text-sm',
    },
    lg: {
      text: 'text-4xl md:text-5xl',
      tagline: 'text-sm md:text-base',
    },
    hero: {
      text: 'text-5xl sm:text-7xl md:text-8xl lg:text-9xl',
      tagline: 'text-base sm:text-lg md:text-2xl',
    },
  };

  const currentSize = sizeMap[size];
  const taglineSpacing = size === 'hero' ? 'mt-5 md:mt-7' : 'mt-2';

  const content = (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      title="CreatHive — pronounced “Creative”"
    >
      {/* Spoken form of the neologism, for assistive tech. */}
      <span className="sr-only">CreatHive, pronounced Creative.</span>

      {/* Seamless Joined Cursive Wordmark: Creat + Hive */}
      <div aria-hidden="true" className="inline-flex items-center font-script font-bold tracking-tight leading-none">
        {/* "Creat" in Deep Charcoal (or white on dark surfaces) */}
        <span className={`${currentSize.text} ${tone === 'light' ? 'text-white' : 'text-[#18181B]'}`}>
          Creat
        </span>

        {/* "Hive" in Warm Coral-Amber Gradient - smoothly joined */}
        <span
          className={`${currentSize.text} text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] via-[#FF8438] to-[#FFAE19]`}
        >
          Hive
        </span>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p className={`font-editorial italic tracking-wide text-center ${taglineSpacing} ${tone === 'light' ? 'text-white/80' : 'text-stone-600'} ${currentSize.tagline}`}>
          “Built for the limitless Creatives...”
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block group focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
