'use client';

import React from 'react';
import Link from 'next/link';

interface CreatHiveWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTagline?: boolean;
  href?: string;
  className?: string;
}

export function CreatHiveWordmark({
  size = 'md',
  showTagline = false,
  href = '/',
  className = '',
}: CreatHiveWordmarkProps) {
  const sizeMap = {
    sm: {
      text: 'text-2xl',
      spark: 'text-xs -mt-2',
      tagline: 'text-xs',
      spacing: 'gap-0.5',
    },
    md: {
      text: 'text-3xl',
      spark: 'text-sm -mt-3',
      tagline: 'text-sm',
      spacing: 'gap-1',
    },
    lg: {
      text: 'text-4xl md:text-5xl',
      spark: 'text-base md:text-lg -mt-4',
      tagline: 'text-sm md:text-base',
      spacing: 'gap-1',
    },
    hero: {
      text: 'text-5xl md:text-7xl',
      spark: 'text-xl md:text-2xl -mt-6',
      tagline: 'text-base md:text-xl',
      spacing: 'gap-1.5',
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Handcrafted Cursive Wordmark (Concept 1 & 2 Combined) */}
      <div className={`inline-flex items-center font-script font-bold tracking-tight ${currentSize.spacing} leading-none`}>
        {/* "Creat" in Deep Charcoal Ink */}
        <span className={`${currentSize.text} text-[#18181B] drop-shadow-xs transition-colors`}>
          Creat
        </span>

        {/* Dynamic Ligature Bridge */}
        <svg
          viewBox="0 0 24 16"
          className="w-4 h-3 md:w-5 md:h-3.5 -mx-1 text-[#FF5A36] overflow-visible"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        >
          <path d="M 2 12 Q 12 2 22 14" />
        </svg>

        {/* "Hive" in Warm Coral to Amber Glow */}
        <span
          className={`${currentSize.text} text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A36] via-[#FF8438] to-[#FFAE19]`}
        >
          Hive
        </span>

        {/* 4-Point Radiant Spark on the 'i' */}
        <span className={`${currentSize.spark} text-[#FFAE19] animate-pulse drop-shadow-sm`}>
          ✦
        </span>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p className={`font-editorial italic text-stone-600 tracking-wide mt-1 text-center ${currentSize.tagline}`}>
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
