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
      text: 'text-6xl md:text-7xl lg:text-8xl',
      tagline: 'text-base md:text-xl',
    },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Seamless Joined Cursive Wordmark: Creat + Hive */}
      <div className="inline-flex items-center font-script font-bold tracking-tight leading-none">
        {/* "Creat" in Deep Charcoal */}
        <span className={`${currentSize.text} text-[#18181B]`}>
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
        <p className={`font-editorial italic text-stone-600 tracking-wide mt-2 text-center ${currentSize.tagline}`}>
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
