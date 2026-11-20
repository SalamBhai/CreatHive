'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

interface TooltipProps {
  /** The text/help shown in the bubble. */
  label: string;
  /** Optional heading for richer tooltips. */
  title?: string;
  /** The element that triggers the tooltip. */
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/**
 * A small, editorial tooltip: hairline border, paper surface, soft shadow and
 * a spring-in reveal with a matching arrow. Works on hover, focus and click
 * (so it's keyboard and touch accessible).
 */
export function Tooltip({ label, title, children, side = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={title || label}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]/50"
      >
        {children}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={clsx(
              'pointer-events-none absolute left-1/2 z-50 w-max max-w-[230px] -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left shadow-[0_10px_30px_rgba(24,24,27,0.14)]',
              side === 'top' ? 'bottom-[calc(100%+10px)]' : 'top-[calc(100%+10px)]'
            )}
          >
            {title ? (
              <span className="mb-0.5 block font-editorial text-sm font-semibold text-[#18181B]">{title}</span>
            ) : null}
            <span className="block font-sans-ui text-[11px] leading-relaxed text-stone-600">{label}</span>
            {/* arrow */}
            <span
              className={clsx(
                'absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-stone-200 bg-white',
                side === 'top'
                  ? '-bottom-1 border-b border-r'
                  : '-top-1 border-l border-t'
              )}
            />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
