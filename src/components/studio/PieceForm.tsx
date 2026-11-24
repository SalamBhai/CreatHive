'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { thumbnailUrl } from '@/lib/cloudinary-image';
import { NeoButton } from '@/components/ui/NeoButton';
import { useAddPiece, useAllPieces, useCampaigns, useCreateSubmission, useUpdatePiece } from '@/lib/store';
import { notifyPush } from '@/lib/push';
import { ALLOWED_EMBED_HOSTS } from '@/lib/media';
import { MEDIA_LABELS, mediaTypeForNiche } from '@/lib/media-format';
import { MAX_TAGS, normalizeTags } from '@/lib/tags';
import { uploadFile } from '@/lib/upload';
import { StoryComposer } from '@/components/studio/StoryComposer';
import { Tooltip } from '@/components/ui/Tooltip';
import { Question } from '@phosphor-icons/react';
import type { CreativeDiscipline, CreativePiece, CreativeProfile, PieceStatus } from '@/lib/types';

interface PieceFormProps {
  profile: CreativeProfile;
  piece?: CreativePiece;
  onSuccess?: () => void;
}

type Step = 'details' | 'story';

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES_TOTAL = 20 * 1024 * 1024;

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-sans-ui outline-none focus:border-[#FF5A36]';
const labelClass = 'mb-1 block text-xs font-bold text-[#18181B]';

const info = (title: string, label: string) => (
  <Tooltip title={title} label={label}>
    <Question size={13} weight="bold" className="text-stone-400 transition-colors hover:text-[#FF5A36]" />
  </Tooltip>
);

export function PieceForm({ profile, piece, onSuccess }: PieceFormProps) {
  const [step, setStep] = useState<Step>('details');
  const [title, setTitle] = useState(piece?.title || '');
  const [subtitle, setSubtitle] = useState(piece?.subtitle || '');
  const [discipline, setDiscipline] = useState<CreativeDiscipline>(piece?.discipline || 'SPOKEN_WORDS_POETRY');
  const [spokenFormat, setSpokenFormat] = useState<'AUDIO' | 'TEXT'>(
    piece?.mediaType === 'AUDIO' ? 'AUDIO' : 'TEXT'
  );
  const [mediaUrl, setMediaUrl] = useState(piece?.mediaUrl || '');
  const [mediaPublicId, setMediaPublicId] = useState(piece?.mediaPublicId || '');
  const [textContent, setTextContent] = useState(piece?.textContent || '');
  const [coverImageUrl, setCoverImageUrl] = useState(piece?.coverImageUrl || '');
  const [coverPublicId, setCoverPublicId] = useState(piece?.coverPublicId || '');
  const [tagsInput, setTagsInput] = useState((piece?.tags || []).join(', '));
  const [galleryImages, setGalleryImages] = useState<string[]>(piece?.galleryImages || []);
  const [galleryPublicIds, setGalleryPublicIds] = useState<string[]>(piece?.galleryPublicIds || []);
  const [bodyHtml, setBodyHtml] = useState(piece?.bodyHtml || '');
  const [pdfUrl, setPdfUrl] = useState(piece?.pdfUrl || '');
  const [pdfPublicId, setPdfPublicId] = useState(piece?.pdfPublicId || '');
  const [pdfPageImages, setPdfPageImages] = useState<string[]>(piece?.pdfPageImages || []);
  const [pdfPagePublicIds, setPdfPagePublicIds] = useState<string[]>(piece?.pdfPagePublicIds || []);
  const [pdfCoverPage, setPdfCoverPage] = useState<number | undefined>(piece?.pdfCoverPage);
  const [imageSizes, setImageSizes] = useState<Record<string, number>>({});
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaNotice, setMediaNotice] = useState('');
  const [busyImageIndex, setBusyImageIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<PieceStatus>(piece?.status || 'PUBLIC');
  const [campaignId, setCampaignId] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [draftSavedId, setDraftSavedId] = useState<string | null>(null);
  const mediaType = discipline === 'SPOKEN_WORDS_POETRY' ? spokenFormat : mediaTypeForNiche(discipline);
  const addPieceMutation = useAddPiece();
  const updatePieceMutation = useUpdatePiece();
  const { data: allPieces } = useAllPieces();
  const { data: campaigns } = useCampaigns();
  const submitToCampaign = useCreateSubmission();
  const isPending = addPieceMutation.isPending || updatePieceMutation.isPending || submitToCampaign.isPending;

  const currentTags = normalizeTags(tagsInput);

  const suggestedTags = (() => {
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
  })();

  /** Shared upload handler — surfaces failures instead of storing `undefined`. */
  const handleUpload = async (
    file: File,
    kind: 'media' | 'gallery' | 'cover' | 'pdf',
    apply: (url: string, publicId: string) => void
  ) => {
    setUploadError('');
    try {
      const result = await uploadFile(file, kind);
      apply(result.url, result.publicId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  /** One uploader for every file type. The route classifies the bytes and
   *  tells us which handler should own the result. */
  const addMedia = async (files: FileList | null) => {
    const picked = Array.from(files || []);
    if (!picked.length) return;
    setUploadError('');
    setMediaNotice('');

    const images = picked.filter((file) => file.type.startsWith('image/'));
    const imageCount = pdfPageImages.length + galleryImages.length;
    if (imageCount + images.length > MAX_IMAGES) {
      setUploadError(`Up to ${MAX_IMAGES} images per post.`);
      return;
    }
    const existingBytes = Object.values(imageSizes).reduce((sum, size) => sum + size, 0);
    const incomingBytes = images.reduce((sum, file) => sum + file.size, 0);
    if (existingBytes + incomingBytes > MAX_IMAGE_BYTES_TOTAL) {
      setUploadError('Images must total 20 MB or less.');
      return;
    }

    setMediaBusy(true);
    try {
      const results = await Promise.all(picked.map((file) => uploadFile(file, 'media')));
      const notes: string[] = [];
      results.forEach((result, index) => {
        const file = picked[index];
        const kind =
          result.resourceType ||
          (file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'raw' : 'video');
        if (kind === 'raw') {
          setPdfUrl(result.url);
          setPdfPublicId(result.publicId);
          notes.push('PDF attached');
        } else if (kind === 'video') {
          setMediaUrl(result.url);
          setMediaPublicId(result.publicId);
          notes.push('Audio / video attached');
        } else if (pdfUrl) {
          setPdfPageImages((current) => [...current, result.url]);
          setPdfPagePublicIds((current) => [...current, result.publicId]);
          setImageSizes((current) => ({ ...current, [result.url]: file.size }));
        } else {
          setGalleryImages((current) => [...current, result.url]);
          setGalleryPublicIds((current) => [...current, result.publicId]);
          setImageSizes((current) => ({ ...current, [result.url]: file.size }));
        }
      });
      setMediaNotice(Array.from(new Set(notes)).join(' · '));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setMediaBusy(false);
    }
  };

  const uploadImageAt = async (file: File, index: number) => {
    const existingBytes = Object.values(imageSizes).reduce((sum, size) => sum + size, 0);
    if (existingBytes + file.size > MAX_IMAGE_BYTES_TOTAL) {
      setUploadError('Images must total 20 MB or less.');
      return;
    }
    setBusyImageIndex(index);
    try {
      const result = await uploadFile(file, 'gallery');
      const images = [...galleryImages];
      const ids = [...galleryPublicIds];
      images[index] = result.url;
      ids[index] = result.publicId;
      setGalleryImages(images);
      setGalleryPublicIds(ids);
      setImageSizes((current) => ({ ...current, [result.url]: file.size }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusyImageIndex(null);
    }
  };

  const removeImage = (url: string) => {
    const sizes = { ...imageSizes };
    delete sizes[url];
    setImageSizes(sizes);
    setPdfPageImages((current) => current.filter((item) => item !== url));
    setPdfPagePublicIds((current) => current.filter((_, index) => pdfPageImages[index] !== url));
    setGalleryImages((current) => current.filter((item) => item !== url));
    setGalleryPublicIds((current) => current.filter((_, index) => galleryImages[index] !== url));
    if (coverImageUrl === url) {
      setCoverImageUrl('');
      setCoverPublicId('');
    }
    const pageIndex = pdfPageImages.indexOf(url);
    if (pageIndex >= 0 && pdfCoverPage === pageIndex) setPdfCoverPage(undefined);
  };

  const addTag = (tag: string) => {
    setTagsInput(normalizeTags([...currentTags, tag], MAX_TAGS).join(', '));
  };

  const reset = () => {
    if (piece) return;
    setStep('details');
    setTitle('');
    setSubtitle('');
    setMediaUrl('');
    setMediaPublicId('');
    setTextContent('');
    setCoverImageUrl('');
    setCoverPublicId('');
    setTagsInput('');
    setGalleryImages([]);
    setGalleryPublicIds([]);
    setCampaignId('');
    setBodyHtml('');
    setPdfUrl('');
    setPdfPublicId('');
    setPdfPageImages([]);
    setPdfPagePublicIds([]);
    setPdfCoverPage(undefined);
    setImageSizes({});
    setMediaNotice('');
    setBusyImageIndex(null);
  };

  const handleSubmit = (
    e: React.FormEvent | React.MouseEvent<HTMLButtonElement>,
    mode: 'publish' | 'draft' = 'publish'
  ) => {
    e.preventDefault();
    if (!title || isPending) return;
    // "Publish" must never inherit a DRAFT status from the visibility select —
    // that was leaving published pieces marked as drafts.
    const forcedStatus: PieceStatus =
      mode === 'draft' ? 'DRAFT' : status === 'DRAFT' ? 'PUBLIC' : status;
    // Once a draft has been saved the form becomes an editor for that row —
    // further saves must UPDATE it, never insert another copy.
    const savedId = piece?.id || draftSavedId;

    const payload = {
      status: forcedStatus || status,
      creativeId: profile.id,
      title,
      subtitle,
      discipline,
      mediaType,
      mediaUrl: mediaUrl || undefined,
      mediaPublicId: mediaPublicId || undefined,
      textContent: textContent || undefined,
      bodyHtml: bodyHtml || undefined,
      pdfUrl: pdfUrl || undefined,
      pdfPublicId: pdfPublicId || undefined,
      pdfPageImages: pdfPageImages.filter(Boolean).length ? pdfPageImages.filter(Boolean) : undefined,
      pdfPagePublicIds: pdfPagePublicIds.filter(Boolean).length ? pdfPagePublicIds.filter(Boolean) : undefined,
      pdfCoverPage: pdfCoverPage,
      galleryImages: galleryImages.filter(Boolean).length ? galleryImages.filter(Boolean) : undefined,
      galleryPublicIds: galleryPublicIds.filter(Boolean).length ? galleryPublicIds : undefined,
      coverPublicId: coverPublicId || undefined,
      coverImageUrl:
        coverImageUrl ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      tags: currentTags.length ? currentTags : ['creative', discipline.toLowerCase()],
    };

    const onDone = (savedId?: string) => {
      if (campaignId && savedId) {
        submitToCampaign.mutate(
          {
            campaignId,
            creativeId: profile.id,
            pieceId: savedId,
            note: subtitle || undefined,
          },
          { onSuccess: (submission) => void notifyPush('new_submission', submission.id) }
        );
      }
      if (mode === 'draft') {
        // Keep everything on screen — a draft is a checkpoint, not a finish.
        setDraftSavedId(savedId || null);
        return;
      }
      // Reflect the published status in the select before clearing the draft id.
      setStatus(forcedStatus);
      setDraftSavedId(null);
      reset();
      onSuccess?.();
    };

    if (savedId) {
      updatePieceMutation.mutate({ id: savedId, patch: payload }, { onSuccess: () => onDone(savedId) });
    } else {
      addPieceMutation.mutate(payload, { onSuccess: (created) => onDone(created.id) });
    }
  };

  // One step at a time on every screen — the story editor gets its own tab.
  const sectionClass = (id: Step) =>
    `space-y-4 ${step === id ? '' : 'hidden'}`;

  return (
    <form onSubmit={handleSubmit} className="pt-1">
      {/* Step switcher — shared on mobile and desktop */}
      <div className="mx-auto mb-5 grid max-w-xl grid-cols-2 gap-1 rounded-xl border border-stone-200 bg-white p-1">
        {(['details', 'story'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setStep(id)}
            className={`rounded-lg py-2.5 text-xs font-bold capitalize transition-colors ${
              step === id ? 'bg-[#18181B] text-white' : 'text-stone-600 hover:text-[#18181B]'
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      {/* DETAILS */}
      <div className={sectionClass('details')}>
        <div>
          <label className={labelClass}>Title *</label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Echoes of the Sahel / Mobile Interface Prototype"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Subtitle / Hook</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A brief one-line description of the piece"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Niche *</label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value as CreativeDiscipline)}
              className={inputClass}
            >
              <option value="SPOKEN_WORDS_POETRY">Spoken Words & Poetry</option>
              <option value="UIUX_DESIGN">UI/UX Mobile Design</option>
              <option value="TECH_IMAGERY">Tech Imagery & 3D</option>
              <option value="DANCE">Dance & Performance</option>
              <option value="MOTION_ANIMATION">Motion Graphics</option>
              <option value="MUSIC">Music & Vocals</option>
              <option value="GRAPHIC_DESIGN">Brand & Visuals</option>
            </select>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span className={labelClass}>Media Format</span>
              {info('Chosen for you', 'Each niche has a natural format. Change the niche above and this updates automatically.')}
            </div>
            <div className="rounded-xl border border-stone-200 bg-[#FCFAF6] px-3 py-2.5 text-xs font-semibold text-stone-600">
              {MEDIA_LABELS[mediaType]}
            </div>
          </div>
          {discipline === 'SPOKEN_WORDS_POETRY' ? (
            <div className="col-span-2">
              <label className={labelClass}>Format</label>
              <select
                value={spokenFormat}
                onChange={(e) => setSpokenFormat(e.target.value as 'AUDIO' | 'TEXT')}
                className={inputClass}
              >
                <option value="AUDIO">Audio / spoken word</option>
                <option value="TEXT">Written / poem</option>
              </select>
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <span className={labelClass}>Visibility</span>
            {info('Who can see this', 'Public appears in Explore and on your page. Unlisted works only by direct link. Draft is private to you.')}
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PieceStatus)}
            className={inputClass}
          >
            <option value="PUBLIC">Public: appears everywhere</option>
            <option value="UNLISTED">Unlisted: only via direct link</option>
            <option value="DRAFT">Draft: private to you</option>
          </select>
        </div>

        {(campaigns || []).filter((c) => c.status === 'OPEN').length ? (
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <span className={labelClass}>Submit to campaign (optional)</span>
              {info('Campaigns', 'Entering a brief links this piece to it so reviewers can find it. You can also do this from the Campaigns page.')}
            </div>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={inputClass}>
              <option value="">No campaign</option>
              {(campaigns || []).filter((c) => c.status === 'OPEN').map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <label className="block text-xs font-bold text-[#18181B]">Tags</label>
              {info('Help people find this', 'Lowercase words, max 8. Used for search and suggestions, not the niche filter.')}
            </div>
            <span className={`text-[10px] font-bold ${currentTags.length >= MAX_TAGS ? 'text-[#FF5A36]' : 'text-stone-400'}`}>
              {currentTags.length}/{MAX_TAGS}
            </span>
          </div>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(normalizeTags(e.target.value).join(', '))}
            placeholder="Comma-separated: lagos, acoustic, voice"
            className={inputClass}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">
            Your words: lowercase, max {MAX_TAGS}. Used for search, not the niche filter.
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
      </div>

      {/* STORY */}
      <div className={`${sectionClass('story')} pt-4 lg:pt-2`}>
        {/* Media lives here too: one place for all content */}
      <div className="space-y-4">
        {(mediaType === 'AUDIO' || mediaType === 'VIDEO') && (
          <div>
            <label className={labelClass}>Work link</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Paste a direct .mp3/.mp4 link, or a share URL"
                className={inputClass}
              />
              <button
                type="button"
                className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-stone-600 hover:border-[#FF5A36]"
                onClick={() => document.getElementById('media-file')?.click()}
              >
                Upload
              </button>
              <input
                type="file"
                id="media-file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleUpload(file, 'media', (url, id) => {
                      setMediaUrl(url);
                      setMediaPublicId(id);
                    });
                  }
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">
              Direct media files play natively. Video embeds are supported from {ALLOWED_EMBED_HOSTS} only.
            </p>
          </div>
        )}

        {mediaType === 'IMAGE_GALLERY' ? (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-bold text-[#18181B]">Gallery images</label>
              <button
                type="button"
                onClick={() => {
                  setGalleryImages([...galleryImages, '']);
                  setGalleryPublicIds([...galleryPublicIds, '']);
                }}
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
                    disabled={busyImageIndex === index}
                    className="ml-2 shrink-0 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-stone-600 hover:border-[#FF5A36] disabled:opacity-50"
                    onClick={() => document.getElementById(`gallery-file-${index}`)?.click()}
                  >
                    {busyImageIndex === index ? '…' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    id={`gallery-file-${index}`}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadImageAt(file, index);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryImages(galleryImages.filter((_, i) => i !== index));
                      setGalleryPublicIds(galleryPublicIds.filter((_, i) => i !== index));
                    }}
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


      </div>

        <div className="rounded-xl border border-stone-200 bg-[#FCFAF6] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <label className={labelClass}>Story</label>
              <p className="text-[10px] text-stone-500">
                {pdfPageImages.length + galleryImages.length}/{MAX_IMAGES} images ·{' '}
                {(Object.values(imageSizes).reduce((sum, size) => sum + size, 0) / 1024 / 1024).toFixed(1)}/
                {MAX_IMAGE_BYTES_TOTAL / 1024 / 1024} MB
              </p>
            </div>
            <button
              type="button"
              disabled={mediaBusy}
              className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-stone-600 hover:border-[#FF5A36] disabled:opacity-50"
              onClick={() => document.getElementById("add-media")?.click()}
            >
              {mediaBusy ? 'Uploading…' : '+ Add media'}
            </button>
            <input
              type="file"
              id="add-media"
              accept="image/*,application/pdf,video/*,audio/*"
              multiple
              hidden
              onChange={(e) => void addMedia(e.target.files)}
            />
          </div>

          {uploadError ? <p className="mt-2 text-[11px] font-semibold text-red-600">{uploadError}</p> : null}
          {mediaNotice && !uploadError ? (
            <p className="mt-2 text-[11px] font-semibold text-emerald-700">{mediaNotice}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {pdfUrl ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-[#FF5A36]">
                <a href={pdfUrl} target="_blank" rel="noreferrer">PDF ↗</a>
                <button type="button" aria-label="Remove PDF" onClick={() => { setPdfUrl(""); setPdfPublicId(""); }} className="text-stone-400 hover:text-red-600">×</button>
              </span>
            ) : null}

            {mediaUrl ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-700">
                <a href={mediaUrl} target="_blank" rel="noreferrer">Video / Audio ↗</a>
                <button type="button" aria-label="Remove media" onClick={() => { setMediaUrl(""); setMediaPublicId(""); }} className="text-stone-400 hover:text-red-600">×</button>
              </span>
            ) : null}

            {[...pdfPageImages, ...galleryImages].map((url, index) => {
              const pageIndex = pdfPageImages.indexOf(url);
              const isCover = url === coverImageUrl || (pageIndex >= 0 && pdfCoverPage === pageIndex);
              return (
                <div key={url + "-" + index} className="w-24 overflow-hidden rounded-lg border border-stone-200 bg-white">
                  <Image src={thumbnailUrl(url)} alt="" width={96} height={110} unoptimized loading="lazy" className="h-24 w-full object-cover" />
                  <div className="flex flex-col gap-1 border-t border-stone-100 p-1">
                    <button
                      type="button"
                      title="Use as cover"
                      onClick={() => {
                        setCoverImageUrl(url);
                        setCoverPublicId(pdfPagePublicIds[pageIndex] || galleryPublicIds[galleryImages.indexOf(url)] || "");
                        if (pageIndex >= 0) setPdfCoverPage(pageIndex);
                        setMediaNotice('Set as cover');
                      }}
                      className={`w-full whitespace-nowrap rounded py-1 text-[10px] font-bold ${
                        isCover ? 'bg-[#FFF7ED] text-[#C2410C]' : 'text-[#FF5A36] hover:bg-[#FFF2EE]'
                      }`}
                    >
                      {isCover ? 'Cover ✓' : 'Set cover'}
                    </button>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => removeImage(url)}
                      className="w-full whitespace-nowrap rounded py-1 text-[10px] font-bold text-stone-500 hover:bg-red-50 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-bold text-[#18181B]">Write</label>
            <span className="text-[10px] text-stone-400">Use + for text, images, video and links</span>
          </div>
          <StoryComposer
            value={bodyHtml}
            onChange={setBodyHtml}
            placeholder={mediaType === 'IMAGE_GALLERY' ? 'Tell the story behind this case study…' : 'Tell your story…'}
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-[#FDFBF7]/95 pt-3 backdrop-blur">
        {addPieceMutation.isError || updatePieceMutation.isError ? (
          <p role="alert" className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            Could not save. Check your connection and try again.
          </p>
        ) : null}
        {draftSavedId ? (
          <p className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            Draft saved. Your entries are still here. Publish to finalize, or find it under Pieces, draft.
          </p>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {!piece ? (
            <button
              type="button"
              disabled={isPending || !title}
              onClick={(e) => handleSubmit(e, 'draft')}
              className="rounded-xl border border-stone-200 px-5 py-2.5 text-xs font-bold text-stone-600 transition-colors hover:border-stone-400 disabled:opacity-50"
            >
              Save as draft
            </button>
          ) : null}
          <NeoButton type="submit" variant="primary" size="lg" className="px-6">
            {isPending ? 'Saving…' : 'Publish to Portfolio'}
          </NeoButton>
        </div>
      </div>
    </form>
  );
}
