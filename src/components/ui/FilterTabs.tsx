'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ElementType;
}

interface FilterTabsProps<T extends string> {
  options: Array<FilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

/** Quiet, editorial filter tabs with one sliding ink indicator. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = 'Filter',
}: FilterTabsProps<T>) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx('no-scrollbar flex items-center gap-2 overflow-x-auto py-1', className)}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={clsx(
              'relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]',
              isActive ? 'text-white' : 'text-stone-600 hover:text-[#18181B]'
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-[#18181B]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : (
              <span className="absolute inset-0 rounded-full border border-stone-200 bg-white/60" />
            )}
            {Icon ? (
              <Icon
                size={14}
                weight="duotone"
                className="relative z-10"
                color={isActive ? '#FFAE19' : undefined}
              />
            ) : null}
            <span className="relative z-10 whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
