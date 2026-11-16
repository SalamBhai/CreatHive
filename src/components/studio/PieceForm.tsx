'use client';

import React, { useMemo, useState } from 'react';
import { NeoButton } from '@/components/ui/NeoButton';
import { useAddPiece, useAllPieces } from '@/lib/store';
import { ALLOWED_EMBED_HOSTS } from '@/lib/media';
import { MEDIA_LABELS, mediaTypeForNiche } from '@/lib/media-format';
import { MAX_TAGS, normalizeTags } from '@/lib/tags';
import { StoryComposer } from '@/components/studio/StoryComposer';
import type { CreativeDiscipline, CreativeProfile } from '@/lib/types';

interface PieceFormProps {
  profile: CreativeProfile;
  onSuccess?: () => void;
}

export function PieceForm({ profile, onSuccess }: PieceFormProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discipline, setDiscipline] = useState<CreativeDiscipline>('SPOKEN_WORD');
  const [mediaUrl, setMediaUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [bodyHtml, setBodyHtml] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const mediaType = mediaTypeForNiche(discipline);
  const addPieceMutation = useAddPiece();
  const { data: allPieces } = useAllPieces();

  const currentTags = useMemo(() => normalizeTags(tagsInput), [tagsInput]);

  const suggestedTags = useMemo(() => {
    const counts = new Map<string, number>();
    (allPieces || []).forEach((piece) => {
      (piece.tags || []).forEach((tag) => {
        const normalized = normalizeTags(tag)[0];
        if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .filter((tag) => !currentTags.includes(tag))
      .slice(0, 8);
  }, [allPieces, currentTags]);

  const addTag = (tag: string) => {
    const next = normalizeTags([...currentTags, tag], MAX_TAGS);
    setTagsInput(next.join(', '));
  };

  const reset = () => {
    setTitle('');
    setSubtitle('');
    setMediaUrl('');
    setTextContent('');
    setCoverImageUrl('');
    setTagsInput('');
    setGalleryImages([]);
    setBodyHtml('');
    setPdfUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addPieceMutation.mutate(
      {
        creativeId: profile.id,
        title,
        subtitle,
        discipline,
        mediaType,
        mediaUrl: mediaUrl || undefined,
        textContent: textContent || undefined,
        bodyHtml: bodyHtml || undefined,
        pdfUrl: pdfUrl || undefined,
        galleryImages: galleryImages.filter(Boolean).length ? galleryImages.filter(Boolean) : undefined,
        coverImageUrl:
          coverImageUrl ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        tags: currentTags.length ? currentTags : ['creative', discipline.toLowerCase()],
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      <div>
        <label className="mb-1 block text-xs font-bold text-[#18181B]">Title *</label>
        <input
          required
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Echoes of the Sahel / Mobile Interface Prototype"
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none focus:border-[#FF5A36]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-[#18181B]">Subtitle / Hook</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="A brief one-line description of the piece"
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none focus:border-[#FF5A36]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-[#18181B]">Niche *</label>
          <select
            value={discipline}
            onChange={(e) => {
              setDiscipline(e.target.value as CreativeDiscipline);
            }}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-sans-ui outline-none"
          >
            <option value="SPOKEN_WORD">Spoken Word</option>
            <option value="POETRY">Poetry & Verse</option>
            <option value="UIUX_DESIGN">UI/UX Mobile Design</option>
            <option value="TECH_IMAGERY">Tech Imagery & 3D</option>
            <option value="DANCE">Dance & Performance</option>
            <option value="MOTION_ANIMATION">Motion Graphics</option>
            <option value="MUSIC">Music & Vocals</option>
            <option value="GRAPHIC_DESIGN">Brand & Visuals</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-[#18181B]">Media Format</label>
          <div className="rounded-xl border border-stone-200 bg-[#FCFAF6] px-3 py-2.5 text-xs font-semibold text-stone-600">
            {MEDIA_LABELS[mediaType]}
          </div>
        </div>
      </div>

      {(mediaType === 'AUDIO' || mediaType === 'VIDEO') && (
        <div>
          <label className="mb-1 block text-xs font-bold text-[#18181B]">Work link</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="Paste a direct .mp3/.mp4 link, or a share URL"
            className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none focus:border-[#FF5A36]"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">
            Direct media files play natively. Video embeds are supported from {ALLOWED_EMBED_HOSTS} only.
          </p>
        </div>
      )}

      {(mediaType === 'TEXT' || mediaType === 'AUDIO' || mediaType === 'VIDEO') && (
        <div>
          <label className="mb-1 block text-xs font-bold text-[#18181B]">
            {mediaType === 'TEXT' ? 'Full text / Poem' : 'Script / Notes (Optional)'}
          </label>
          <textarea
            rows={4}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Plain text version — readers can also open the long-form story below."
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 font-editorial text-base italic outline-none"
          />
        </div>
      )}

      {mediaType === 'IMAGE_GALLERY' ? (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-bold text-[#18181B]">Gallery images</label>
            <button
              type="button"
              onClick={() => setGalleryImages([...galleryImages, ''])}
              className="text-[11px] font-bold text-[#FF5A36] hover:underline"
            >
              + Add image
            </button>
          </div>
          {galleryImages.length === 0 ? (
            <p className="text-[11px] text-stone-500">
              Add two or more image URLs to build a swipeable carousel.
            </p>
          ) : null}
          <div className="space-y-2">
            {galleryImages.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const next = [...galleryImages];
                    next[index] = e.target.value;
                    setGalleryImages(next);
                  }}
                  placeholder={`Image ${index + 1} URL`}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                  aria-label={`Remove image ${index + 1}`}
                  className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:border-[#FF5A36] hover:text-[#FF5A36]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(mediaType === 'TEXT' || mediaType === 'AUDIO' || mediaType === 'VIDEO' || mediaType === 'IMAGE_GALLERY') && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-bold text-[#18181B]">Full post</label>
            <span className="text-[10px] text-stone-400">Use + to add media, text, PDF</span>
          </div>
          <StoryComposer
            value={bodyHtml}
            onChange={setBodyHtml}
            placeholder={mediaType === 'IMAGE_GALLERY' ? 'Tell the story behind this case study…' : 'Tell your story…'}
          />
        </div>
      )}

      {mediaType === 'IMAGE_GALLERY' ? (
        <div>
          <label className="mb-1 block text-xs font-bold text-[#18181B]">Case study PDF (optional)</label>
          <input
            type="url"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="Link to a PDF — rendered in the full post view"
            className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none"
          />
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-bold text-[#18181B]">Cover Image URL</label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-bold text-[#18181B]">Tags</label>
          <span className={`text-[10px] font-bold ${currentTags.length >= MAX_TAGS ? 'text-[#FF5A36]' : 'text-stone-400'}`}>
            {currentTags.length}/{MAX_TAGS}
          </span>
        </div>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(normalizeTags(e.target.value).join(', '))}
          placeholder="Comma-separated: lagos, acoustic, voice"
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none focus:border-[#FF5A36]"
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">
          Your words — lowercase, max {MAX_TAGS}. Used for search, not the niche filter.
        </p>
        {suggestedTags.length > 0 && currentTags.length < MAX_TAGS ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Suggested</span>
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-600 hover:border-[#FF5A36] hover:text-[#FF5A36]"
              >
                + {tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pt-2">
        <NeoButton type="submit" variant="primary" size="lg" className="w-full">
          {addPieceMutation.isPending ? 'Publishing…' : 'Publish to Portfolio'}
        </NeoButton>
      </div>
    </form>
  );
}
