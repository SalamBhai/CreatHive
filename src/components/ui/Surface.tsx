import React from 'react';
import { clsx } from 'clsx';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a barely-there lift on hover. */
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
}

/**
 * The one shared card surface for the clean pages: paper white, hairline
 * border, no offset shadow. Neobrutalist weight is reserved for primary actions.
 */
export function Surface({
  interactive = false,
  as: Tag = 'div',
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <Tag
      className={clsx(
        'rounded-2xl border border-stone-200 bg-white',
        interactive && 'transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_30px_rgba(24,24,27,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
