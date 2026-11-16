'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkle,
  ShareNetwork,
  Check,
  Faders,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { NeoButton } from '../ui/NeoButton';
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
        // Fallback to clipboard
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  return (
    <>
      {/* Sticky Bottom Action Dock (Native App Feeling) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 md:p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent pointer-events-none">
        <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md border-2 border-[#18181B] rounded-2xl p-2 neo-shadow flex items-center justify-between gap-2 pointer-events-auto">
          {/* Book / Performance Button */}
          <NeoButton
            variant="primary"
            size="md"
            onClick={() => setIsInquiryOpen(true)}
            className="flex-1 shadow-none"
            icon={<PaperPlaneTilt size={17} weight="bold" />}
          >
            Book for Gig
          </NeoButton>

          {/* Share Button */}
          <NeoButton
            variant="secondary"
            size="md"
            onClick={handleShare}
            className="shadow-none"
            icon={
              isCopied ? (
                <Check size={17} weight="bold" className="text-emerald-600" />
              ) : (
                <ShareNetwork size={17} weight="bold" />
              )
            }
          >
            {isCopied ? 'Copied!' : 'Share'}
          </NeoButton>

          {/* Studio Quick Link */}
          <Link href="/studio">
            <NeoButton
              variant="amber"
              size="md"
              className="shadow-none"
              icon={<Faders size={17} weight="bold" />}
              title="Creator Studio"
            >
              Studio
            </NeoButton>
          </Link>
        </div>
      </div>

      {/* Inquiry Drawer Modal */}
      <InquiryDrawer
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        creativeId={profile.id}
        creativeName={profile.displayName}
      />
    </>
  );
}
