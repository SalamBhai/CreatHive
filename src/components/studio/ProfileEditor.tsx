'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { NeoButton } from '@/components/ui/NeoButton';
import { Surface } from '@/components/ui/Surface';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useUpdateProfile } from '@/lib/store';
import { resolveAvatarUrl } from '@/lib/avatar';
import { uploadFile } from '@/lib/upload';
import type { CreativeProfile, SocialLinks } from '@/lib/types';

const SOCIAL_FIELDS: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: 'email', label: 'Email', placeholder: 'you@example.com' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+234 800 000 0000' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/...' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
  { key: 'portfolioUrl', label: 'Website', placeholder: 'https://...' },
];

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none focus:border-[#FF5A36]';

export function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: CreativeProfile;
  onSaved?: () => void;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [tagline, setTagline] = useState(profile.tagline);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [socials, setSocials] = useState<SocialLinks>(profile.socialLinks || {});
  const [available, setAvailable] = useState(profile.isAvailableForGigs);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [avatarPublicId, setAvatarPublicId] = useState(profile.avatarPublicId || '');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const fileInput = useRef<HTMLInputElement>(null);
  const mutation = useUpdateProfile();

  const save = () => {
    mutation.mutate(
      {
        username: profile.username,
        patch: {
          displayName,
          tagline,
          bio,
          location,
          socialLinks: socials,
          isAvailableForGigs: available,
          avatarUrl,
          avatarPublicId: avatarPublicId || undefined,
        },
      },
      { onSuccess: onSaved }
    );
  };

  const hasChanges =
    displayName !== profile.displayName ||
    tagline !== profile.tagline ||
    bio !== profile.bio ||
    location !== profile.location ||
    available !== profile.isAvailableForGigs ||
    avatarUrl !== (profile.avatarUrl || '') ||
    avatarPublicId !== (profile.avatarPublicId || '') ||
    JSON.stringify(socials) !== JSON.stringify(profile.socialLinks || {});

  const handleAvatar = async (file: File) => {
    setUploadError('');
    setUploading(true);
    try {
      const result = await uploadFile(file, 'avatar');
      setAvatarUrl(result.url);
      setAvatarPublicId(result.publicId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Mobile: swap between form and preview to avoid a long scroll. */}
      <div className="mb-4 flex gap-2 rounded-xl border border-stone-200 bg-white p-1 lg:hidden">
        {(['edit', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors ${
              mobileTab === tab ? 'bg-[#18181B] text-white' : 'text-stone-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className={`space-y-4 p-5 md:p-6 ${mobileTab === 'edit' ? '' : 'hidden lg:block'}`}>
        <div>
          <label className="mb-1 block text-xs font-bold">Display name</label>
          <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold">Tagline</label>
          <input className={inputClass} value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold">Bio</label>
          <textarea
            rows={4}
            className={`${inputClass} resize-none leading-relaxed`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold">Location</label>
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <label className="flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-3">
          <span>
            <span className="block text-xs font-bold">Open to gigs</span>
            <span className="block text-[11px] text-stone-500">Shows a badge on your public page.</span>
          </span>
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4 accent-[#FF5A36]"
          />
        </label>

        <div className="rounded-xl border border-stone-200 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold">Avatar</span>
            <span className="text-[10px] text-stone-500">Square image, up to 10 MB</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={inputClass}
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                if (!e.target.value) setAvatarPublicId('');
              }}
              placeholder="https://... or leave blank for initials"
              aria-label="Avatar URL"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="shrink-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:border-[#FF5A36] disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatar(file);
                e.target.value = '';
              }}
            />
          </div>
          {uploadError ? <p role="alert" className="mt-2 text-[11px] font-semibold text-red-600">{uploadError}</p> : null}
        </div>

        <div className="border-t border-stone-200 pt-4">
          <h3 className="mb-3 font-editorial text-lg font-semibold">Social links</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-[11px] font-bold text-stone-600">{field.label}</label>
                <input
                  className={inputClass}
                  value={socials[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setSocials({ ...socials, [field.key]: e.target.value || undefined })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <NeoButton variant="primary" onClick={save} disabled={!hasChanges || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </NeoButton>
          {mutation.isSuccess && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
        </div>
      </Surface>

        <Surface className={`h-fit p-5 md:p-6 ${mobileTab === 'preview' ? '' : 'hidden lg:block'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-editorial text-lg font-semibold">Live preview</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Public card</span>
        </div>
        <Image
          src={resolveAvatarUrl(avatarUrl, displayName || profile.displayName || profile.username || 'CreatHive')}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 rounded-2xl border border-stone-200 object-cover"
        />
        <h2 className="mt-4 font-editorial text-2xl font-semibold">{displayName}</h2>
        <p className="text-xs font-bold text-[#FF5A36]">@{profile.username}</p>
        <p className="mt-2 text-sm text-stone-700">{tagline}</p>
        {available ? (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Open to gigs
          </span>
        ) : null}
        <p className="mt-3 text-xs leading-relaxed text-stone-600">{bio}</p>
        <p className="mt-2 text-[11px] text-stone-500">{location}</p>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
          {profile.disciplines.map((d) => {
            const config = DISCIPLINE_CONFIG[d] || DISCIPLINE_CONFIG.OTHER;
            return (
              <span key={d} className="rounded-full border border-stone-200 px-2.5 py-1 text-[10px] font-bold text-stone-600">
                {config.label}
              </span>
            );
          })}
        </div>
        {Object.values(socials).some(Boolean) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(socials)
              .filter(([, value]) => !!value)
              .map(([key]) => (
                <span key={key} className="rounded-lg bg-stone-100 px-2 py-1 text-[10px] font-semibold capitalize text-stone-600">
                  {key}
                </span>
              ))}
          </div>
        ) : null}
      </Surface>
      </div>
    </div>
  );
}
