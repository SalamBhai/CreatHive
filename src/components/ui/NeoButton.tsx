'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface NeoButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'amber' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function NeoButton({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}: NeoButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold font-sans-ui rounded-xl border-2 border-[#18181B] transition-all select-none cursor-pointer focus:outline-none';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#FF5A36] text-white neo-shadow hover:bg-[#ff6947] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    secondary:
      'bg-white text-[#18181B] neo-shadow hover:bg-stone-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    amber:
      'bg-[#FFAE19] text-[#18181B] neo-shadow hover:bg-[#ffb732] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    dark:
      'bg-[#18181B] text-white neo-shadow-coral hover:bg-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    ghost:
      'border-transparent hover:border-[#18181B] hover:bg-white/80 text-[#18181B]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
