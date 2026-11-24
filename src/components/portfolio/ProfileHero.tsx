'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, CheckCircle } from '@phosphor-icons/react';
import { CreativeProfile } from '@/lib/types';
import { DisciplineChip } from '../ui/DisciplineChip';
import { resolveAvatarUrl } from '@/lib/avatar';
import { VerifiedHiveBadge } from '@/components/brand/VerifiedHiveBadge';
import { SocialQuickIcons, SocialMoreIcons } from './SocialLinks';
import { cloudinaryImageUrl } from '@/lib/cloudinary-image';


interface ProfileHeroProps {
  profile: CreativeProfile;
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(24,24,27,0.04)]">
      {/* Banner — uploaded image, or the brand gradient fallback */}
      <div
        className={`relative h-24 w-full overflow-hidden border-b border-stone-200 md:h-32 ${
          profile.bannerUrl ? '' : `bg-gradient-to-r ${profile.bannerGradient}`
        }`}
      >
        {profile.bannerUrl ? (
          <Image
            src={cloudinaryImageUrl(profile.bannerUrl, 1200)}
            alt=""
            fill
            sizes="100vw"
            unoptimized
            priority
            className="object-cover"
          />
        ) : null}
        {/* Availability Badge */}
        {profile.isAvailableForGigs && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/95 px-3 py-1 text-xs font-bold text-[#18181B] backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open to Performances & Gigs
            </span>
          </div>
        )}
      </div>

      {/* Main Avatar & Profile Body */}
      <div className="px-5 pb-6 pt-0 relative">
        {/* Avatar positioned over banner */}
        <div className="-mt-12 md:-mt-16 mb-4 flex items-end justify-between">
          <div className="relative">
            <Image
              src={cloudinaryImageUrl(resolveAvatarUrl(profile.avatarUrl, profile.displayName), 200)}
              alt={profile.displayName}
              width={112}
              height={112}
              className="h-24 w-24 rounded-2xl border-[3px] border-white bg-white object-cover shadow-[0_6px_18px_rgba(24,24,27,0.12)] md:h-28 md:w-28"
            />
            <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-[#FFAE19] p-1 text-[#18181B]">
              <VerifiedHiveBadge size={14} />
            </div>
          </div>

          {/* First three links stay beside the avatar; the rest wrap into a grid below. */}
          <SocialQuickIcons links={profile.socialLinks} />
        </div>

        {/* Name & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-editorial text-3xl md:text-4xl font-semibold leading-tight text-[#18181B]">
              {profile.displayName}
            </h1>
            <span className="font-sans-ui text-sm font-semibold text-stone-500">
              @{profile.username}
            </span>
          </div>

          <p className="font-sans-ui text-sm md:text-base font-semibold text-[#FF5A36]">
            {profile.tagline}
          </p>
        </div>

        {/* Cohort Badge / Location */}
        <div className="font-sans-ui flex items-center gap-3 flex-wrap mt-2.5 text-xs text-stone-600 font-medium">
          {profile.cohortBadge && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FFF7ED] border border-[#F97316]/30 text-[#C2410C] font-semibold">
              <CheckCircle size={13} weight="fill" className="text-[#F97316]" />
              {profile.cohortBadge}
            </span>
          )}
          {profile.location?.trim() ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} weight="bold" />
              {profile.location}
            </span>
          ) : null}
        </div>

        {/* Bio */}
        <p className="text-xs md:text-sm text-stone-700 leading-relaxed mt-3 max-w-2xl font-sans-ui">
          {profile.bio}
        </p>

        {/* Discipline Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-stone-200">
          {profile.disciplines.map((d) => (
            <DisciplineChip key={d} discipline={d} size="sm" />
          ))}
        </div>

        <SocialMoreIcons links={profile.socialLinks} />
      </div>
    </div>
  );
}
