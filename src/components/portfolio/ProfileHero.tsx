'use client';

import React from 'react';
import {
  MapPin,
  Sparkle,
  EnvelopeSimple,
  WhatsappLogo,
  TwitterLogo,
  GithubLogo,
  LinkedinLogo,
  CheckCircle,
} from '@phosphor-icons/react';
import { CreativeProfile } from '@/lib/types';
import { DisciplineChip } from '../ui/DisciplineChip';

interface ProfileHeroProps {
  profile: CreativeProfile;
}

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <div className="bg-white border-2 border-[#18181B] rounded-3xl neo-shadow overflow-hidden">
      {/* Banner Gradient Strip */}
      <div
        className={`h-24 md:h-32 w-full bg-gradient-to-r ${profile.bannerGradient} relative border-b-2 border-[#18181B]`}
      >
        {/* Availability Badge */}
        {profile.isAvailableForGigs && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-[#18181B] neo-shadow-sm text-xs font-bold text-[#18181B]">
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
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-3 border-[#18181B] neo-shadow bg-white"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#FFAE19] text-[#18181B] p-1 rounded-full border-2 border-[#18181B]">
              <Sparkle size={14} weight="fill" />
            </div>
          </div>

          {/* Social Quick Icons */}
          <div className="flex items-center gap-2">
            {profile.socialLinks.email && (
              <a
                href={`mailto:${profile.socialLinks.email}`}
                className="w-9 h-9 rounded-xl border-2 border-[#18181B] neo-shadow-sm bg-white hover:bg-[#FFF3E8] flex items-center justify-center text-[#18181B] transition-colors"
                title="Send Email"
              >
                <EnvelopeSimple size={18} weight="bold" />
              </a>
            )}
            {profile.socialLinks.whatsapp && (
              <a
                href={`https://wa.me/${profile.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border-2 border-[#18181B] neo-shadow-sm bg-[#E7F8EC] hover:bg-[#d6f3de] flex items-center justify-center text-[#18181B] transition-colors"
                title="WhatsApp"
              >
                <WhatsappLogo size={18} weight="bold" className="text-[#25D366]" />
              </a>
            )}
            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border-2 border-[#18181B] neo-shadow-sm bg-white hover:bg-stone-50 flex items-center justify-center text-[#18181B] transition-colors"
                title="Twitter / X"
              >
                <TwitterLogo size={18} weight="bold" />
              </a>
            )}
            {profile.socialLinks.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border-2 border-[#18181B] neo-shadow-sm bg-white hover:bg-stone-50 flex items-center justify-center text-[#18181B] transition-colors"
                title="GitHub"
              >
                <GithubLogo size={18} weight="bold" />
              </a>
            )}
          </div>
        </div>

        {/* Name & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold font-sans-ui text-[#18181B]">
              {profile.displayName}
            </h1>
            <span className="text-sm font-bold text-stone-500 font-mono">
              @{profile.username}
            </span>
          </div>

          <p className="text-sm md:text-base font-semibold text-[#FF5A36]">
            {profile.tagline}
          </p>
        </div>

        {/* Cohort Badge / Location */}
        <div className="flex items-center gap-3 flex-wrap mt-2.5 text-xs text-stone-600 font-medium">
          {profile.cohortBadge && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FFF7ED] border border-[#F97316]/30 text-[#C2410C] font-semibold">
              <CheckCircle size={13} weight="fill" className="text-[#F97316]" />
              {profile.cohortBadge}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} weight="bold" />
            {profile.location}
          </span>
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
      </div>
    </div>
  );
}
