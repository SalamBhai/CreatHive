'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from '@phosphor-icons/react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: BottomSheetProps) {
  // Prevent background scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Slide-Up Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="relative z-10 w-full max-w-lg max-h-[90vh] bg-[#FDFBF7] border-t-2 md:border-x-2 border-[#18181B] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Grab Bar Header */}
            <div className="pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-b border-stone-200">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full mb-3" />

              <div className="w-full px-5 flex items-center justify-between">
                <div>
                  {title && (
                    <h3 className="text-lg font-bold font-sans-ui text-[#18181B] leading-tight">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-stone-500 font-sans-ui mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-100 text-[#18181B] transition-colors focus:outline-none cursor-pointer"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto overscroll-contain flex-1 pb-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
