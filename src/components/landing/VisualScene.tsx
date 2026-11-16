'use client';

import React, { useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface VisualSceneProps {
  /** Small uppercase label, e.g. "SPOKEN WORD". */
  label?: string;
  image: string;
  alt: string;
  imagePosition?: string;
  priority?: boolean;
  align?: 'center' | 'bottom';
  /** Extra soft dark halo behind centred type, for brand lockups. */
  centerGlow?: boolean;
  children: ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * A full-viewport photographic scene with text layered above it.
 * Inspired by the restrained, centred lockups of the Shazoom / Wishluup
 * splash screens: one image, one idea, very little copy.
 */
export function VisualScene({
  label,
  image,
  alt,
  imagePosition = 'center',
  priority = false,
  align = 'bottom',
  centerGlow = false,
  children,
}: VisualSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <motion.section
      ref={ref}
      className="relative isolate min-h-[100svh] w-screen shrink-0 snap-start overflow-hidden bg-[#0B0B0C] md:w-full md:shrink"
      aria-label={label || 'CreatHive scene'}
    >
      {/* Image layer — sits at z-0 and drifts gently while scrolling. */}
      <motion.div
        className="absolute inset-x-0 -inset-y-[10%] z-0 will-change-transform"
        style={reduceMotion ? undefined : { y: parallaxY }}
      >
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: imagePosition }}
        />
      </motion.div>

      {/* Contrast scrim + vignette — keeps overlaid type legible. */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/65 via-black/25 to-black/85" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.45)_100%)]" />
      {centerGlow ? (
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.25)_40%,transparent_70%)]" />
      ) : null}

      {/* Text layer — deliberately z-20, floating over the visual. */}
      <div
        className={`relative z-20 flex min-h-[100svh] flex-col px-6 pt-28 pb-24 md:px-14 md:pt-32 md:pb-28 ${
          align === 'center'
            ? 'items-center justify-center text-center'
            : 'items-start justify-end'
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, ease: EASE }}
          className={align === 'center' ? 'w-full max-w-5xl' : 'max-w-2xl'}
        >
          {label ? (
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
              {label}
            </p>
          ) : null}
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
}
