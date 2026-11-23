'use client';

import React from 'react';
import {
  EnvelopeSimple,
  WhatsappLogo,
  XLogo,
  GithubLogo,
  Newspaper,
  MediumLogo,
  InstagramLogo,
  LinkedinLogo,
  GlobeHemisphereWest,
} from '@phosphor-icons/react';
import type { SocialLinks } from '@/lib/types';

type SocialKey = keyof SocialLinks;

interface SocialConfig {
  key: SocialKey;
  label: string;
  icon: React.ElementType;
  quickTone: string;
}

/** Single source of truth for every social we support — the editor already
 *  stores all seven, so the public card must render all seven too. */
const SOCIALS: SocialConfig[] = [
  {
    key: 'email',
    label: 'Email',
    icon: EnvelopeSimple,
    quickTone: 'bg-white text-[#18181B] hover:bg-[#FFF3E8]',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: WhatsappLogo,
    quickTone: 'bg-[#E7F8EC] text-[#25D366] hover:bg-[#d6f3de]',
  },
  {
    key: 'twitter',
    label: 'X',
    icon: XLogo,
    quickTone: 'bg-white text-[#18181B] hover:bg-stone-50',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: InstagramLogo,
    quickTone: 'bg-white text-[#18181B] hover:bg-stone-50',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: LinkedinLogo,
    quickTone: 'bg-white text-[#18181B] hover:bg-stone-50',
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: GithubLogo,
    quickTone: 'bg-white text-[#18181B] hover:bg-stone-50',
  },
  {
    key: 'substack',
    label: 'Substack',
    icon: Newspaper,
    quickTone: 'bg-[#FFF3E8] text-[#FF5A36] hover:bg-[#ffe6d5]',
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: MediumLogo,
    quickTone: 'bg-white text-[#18181B] hover:bg-stone-50',
  },
  {
    key: 'portfolioUrl',
    label: 'Website',
    icon: GlobeHemisphereWest,
    quickTone: 'bg-white text-[#18181B] hover:bg-stone-50',
  },
];

function externalUrl(value?: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function hrefFor(config: SocialConfig, value: string): string | null {
  if (config.key === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null;
  }
  if (config.key === 'whatsapp') {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 ? `https://wa.me/${digits}` : null;
  }
  return externalUrl(value);
}

interface SocialItem extends SocialConfig {
  href: string;
}

function getSocialItems(links?: SocialLinks): SocialItem[] {
  if (!links) return [];
  return SOCIALS.flatMap((config) => {
    const value = links[config.key]?.trim();
    if (!value) return [];
    const href = hrefFor(config, value);
    return href ? [{ ...config, href }] : [];
  });
}

/** First three links stay beside the avatar — the compact, familiar row. */
export function SocialQuickIcons({ links }: { links?: SocialLinks }) {
  const items = getSocialItems(links).slice(0, 3);
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {items.map(({ key, label, icon: Icon, href, quickTone }) => (
        <a
          key={key}
          href={href}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 transition-colors ${quickTone}`}
          title={label}
          aria-label={label}
        >
          <Icon size={18} weight="bold" />
        </a>
      ))}
    </div>
  );
}

/** Links 4+ stay in one compact icon-only row — no labels, no tall stack. */
export function SocialMoreIcons({ links }: { links?: SocialLinks }) {
  const items = getSocialItems(links).slice(3);
  if (!items.length) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-4">
      {items.map(({ key, label, icon: Icon, href, quickTone }) => (
        <a
          key={key}
          href={href}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 transition-colors ${quickTone}`}
          title={label}
          aria-label={label}
        >
          <Icon size={18} weight="bold" />
        </a>
      ))}
    </div>
  );
}
