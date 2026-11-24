'use client';

import React, { useRef, useState } from 'react';
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
  /** Optional action — the tooltip's trigger also performs this on click. */
  onClick?: () => void;
  /** Classes for the trigger button itself. */
  triggerClassName?: string;
}

const WIDTH = 230;
const GAP = 10;

/** A small, editorial tooltip: hairline border, paper surface, soft shadow and
 *  a spring-in reveal. Positioned against the viewport so it never slides off
 *  screen, including for triggers near an edge. */
export function Tooltip({ label, title, children, side = 'top', className, onClick, triggerClassName }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - WIDTH / 2, 12), window.innerWidth - WIDTH - 12);
    const top = side === 'top' ? rect.top - GAP : rect.bottom + GAP;
    setPosition({ left, top });
    setOpen(true);
  };

  // A tap fires mouseenter then click. Treat click as "show" when the tooltip
  // was closed by a previous focus/leave cycle, but don't flip it closed here.
  const handleClick = () => {
    if (!open) show();
    onClick?.();
  };

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={title || label}
        aria-expanded={open}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={handleClick}
        className={clsx(
          'inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]/50',
          triggerClassName
        )}
      >
        {children}
      </button>

      <AnimatePresence>
        {open ? (
          <div
            className="pointer-events-none fixed z-[80] w-[230px]"
            style={{
              left: position?.left ?? 12,
              top: position?.top ?? 0,
              transform: side === 'top' ? 'translateY(-100%)' : undefined,
            }}
          >
            <motion.span
              role="tooltip"
              initial={{ opacity: 0, y: side === 'top' ? 6 : -6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="block rounded-xl border border-stone-200 bg-white px-3 py-2 text-left shadow-[0_10px_30px_rgba(24,24,27,0.14)]"
            >
              {title ? (
                <span className="mb-0.5 block font-editorial text-sm font-semibold text-[#18181B]">{title}</span>
              ) : null}
              <span className="block font-sans-ui text-[11px] leading-relaxed text-stone-600">{label}</span>
            </motion.span>
          </div>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
