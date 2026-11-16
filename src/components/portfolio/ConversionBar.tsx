'use client';

import React, { useState } from 'react';
import { ShareNetwork, Check, PaperPlaneTilt } from '@phosphor-icons/react';
import { InquiryDrawer } from './InquiryDrawer';
import { CreativeProfile } from '@/lib/types';

interface ConversionBarProps {
  profile: CreativeProfile;
}

export function ConversionBar({ profile }: ConversionBarProps) {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${profile.displayName} — CreatHive Portfolio`,
      text: `Check out ${profile.displayName}'s creative showcase on CreatHive:`,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fall back to copying the link.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Ignored.
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/95 to-transparent p-3 pt-8 md:p-4 md:pt-10">
        <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-[0_10px_40px_rgba(24,24,27,0.08)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsInquiryOpen(true)}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#FF5A36] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-transform hover:bg-[#f04e2b] active:scale-[0.98]"
          >
            <PaperPlaneTilt size={16} weight="bold" />
            Book a Gig
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label={isCopied ? 'Link copied' : 'Share this profile'}
            title={isCopied ? 'Link copied' : 'Share this profile'}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-stone-200 px-3.5 py-3 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98]"
          >
            {isCopied ? (
              <Check size={17} weight="bold" className="text-emerald-600" />
            ) : (
              <ShareNetwork size={17} weight="bold" />
            )}
          </button>
        </div>
      </div>

      <InquiryDrawer
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        creativeId={profile.id}
        creativeName={profile.displayName}
      />
    </>
  );
}
