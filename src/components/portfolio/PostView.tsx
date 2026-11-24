'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, ShareNetwork, Check } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { Surface } from '@/components/ui/Surface';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useAllPieces, useAllProfiles, usePiece } from '@/lib/store';
import { resolveAvatarUrl } from '@/lib/avatar';
import { toEmbedUrl } from '@/lib/media';
import { PostGallery } from '@/components/media/PostGallery';
import { PdfAttachment } from '@/components/media/PdfAttachment';
import { sanitizeHtml } from '@/lib/sanitize';
import { cloudinaryImageUrl } from '@/lib/cloudinary-image';


export function PostView({ id }: { id: string }) {
  const { data: pieces } = useAllPieces();
  const { data: profiles } = useAllProfiles();
  const { data: singlePiece, isLoading: isPieceLoading } = usePiece(id);
  const [copied, setCopied] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  // Direct links must work for UNLISTED and DRAFT pieces too — the public feed
  // only contains PUBLIC pieces, so fetch the requested one explicitly.
  const piece = singlePiece ?? (pieces || []).find((p) => p.id === id);
  const author = piece ? (profiles || []).find((p) => p.id === piece.creativeId) : undefined;

  const sorted = [...(pieces || [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const index = sorted.findIndex((p) => p.id === id);
  const previous = index > 0 ? sorted[index - 1] : undefined;
  const next = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : undefined;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: piece?.title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignored
    }
  };

  if (isPieceLoading && !piece) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5A36] border-t-transparent" />
      </div>
    );
  }

  if (!piece) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FDFBF7] px-6 text-center">
        <h1 className="font-editorial text-3xl">This post isn&apos;t here.</h1>
        <Link href="/explore" className="text-xs font-bold uppercase tracking-widest text-[#FF5A36]">
          Back to Explore
        </Link>
      </div>
    );
  }

  const config = DISCIPLINE_CONFIG[piece.discipline] || DISCIPLINE_CONFIG.OTHER;
  const gallery = piece.galleryImages?.length
    ? piece.galleryImages
    : piece.mediaType === 'IMAGE_GALLERY' && piece.coverImageUrl
      ? [piece.coverImageUrl]
      : [];
  const embedUrl = toEmbedUrl(piece.mediaUrl);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-[#FF5A36]"
      />
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href={author ? `/${author.username}` : '/explore'} aria-label="Back" className="rounded-xl border border-stone-200 bg-white p-2">
              <ArrowLeft size={17} weight="bold" />
            </Link>
            <Link href="/explore" aria-label="CreatHive home">
              <CreatHiveWordmark size="sm" href={null} />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              aria-label={copied ? 'Link copied' : 'Share this post'}
              title={copied ? 'Link copied' : 'Share this post'}
              className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600 transition-colors hover:border-[#FF5A36] hover:text-[#FF5A36]"
            >
              {copied ? <Check size={16} weight="bold" className="text-emerald-600" /> : <ShareNetwork size={16} weight="bold" />}
            </button>
            {author ? (
              <Link href={`/${author.username}`} className="text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-[#FF5A36]">
                @{author.username}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600">
          {config.label}
        </div>

        <h1 className="font-editorial text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
          {piece.title}
        </h1>
        {piece.subtitle ? (
          <p className="mt-4 font-editorial text-lg italic leading-relaxed text-stone-600 md:text-xl">
            {piece.subtitle}
          </p>
        ) : null}

        {author ? (
          <Link href={`/${author.username}`} className="mt-6 flex items-center gap-3 border-y border-stone-200 py-4">
            <Image
              src={cloudinaryImageUrl(resolveAvatarUrl(author.avatarUrl, author.displayName), 120)}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-full object-cover"
            />
            <span>
              <span className="block text-sm font-bold">{author.displayName}</span>
              <span className="block text-xs text-stone-500">{author.tagline}</span>
            </span>
            <ArrowUpRight size={16} weight="bold" className="ml-auto text-stone-400" />
          </Link>
        ) : null}

        {/* Media */}
        {embedUrl ? (
          <Surface className="mt-8 overflow-hidden">
            <div className="video-frame">
              <iframe src={embedUrl} title={piece.title} allow="autoplay; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
            </div>
          </Surface>
        ) : piece.mediaType === 'AUDIO' && piece.mediaUrl ? (
          <Surface className="mt-8 p-5">
            <audio controls src={piece.mediaUrl} className="w-full" />
          </Surface>
        ) : piece.mediaType === 'VIDEO' && piece.mediaUrl ? (
          <Surface className="mt-8 overflow-hidden">
            <div className="video-frame">
              <video controls preload="metadata" src={piece.mediaUrl} poster={cloudinaryImageUrl(piece.coverImageUrl, 1200)} />
            </div>
          </Surface>
        ) : null}

        {/* Structured gallery fields become a carousel. Images inserted in the
            WYSIWYG body stay inline in .story-body below, with their captions. */}
        {gallery.length > 0 ? <PostGallery images={gallery} title={piece.title} /> : null}

        {piece.bodyHtml ? (
          <article className="story-body mt-10" dangerouslySetInnerHTML={{ __html: sanitizeHtml(piece.bodyHtml) }} />
        ) : piece.textContent ? (
          <article className="story-body mt-10 whitespace-pre-line font-editorial text-lg italic leading-[1.8] text-stone-800">
            {piece.textContent}
          </article>
        ) : null}

        {piece.pdfUrl ? <PdfAttachment piece={piece} /> : null}

        {piece.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-stone-200 pt-6">
            {piece.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {(previous || next) ? (
          <nav aria-label="More posts" className="mt-10 grid gap-3 border-t border-stone-200 pt-6 sm:grid-cols-2">
            {previous ? (
              <Link href={`/p/${previous.id}`} className="group rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-[#FF5A36]">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  <ArrowLeft size={12} weight="bold" /> Previous
                </span>
                <span className="mt-2 block text-sm font-bold leading-snug text-[#18181B] group-hover:text-[#FF5A36]">
                  {previous.title}
                </span>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/p/${next.id}`} className="group rounded-xl border border-stone-200 bg-white p-4 transition-colors hover:border-[#FF5A36] sm:text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Next <ArrowRight size={12} weight="bold" />
                </span>
                <span className="mt-2 block text-sm font-bold leading-snug text-[#18181B] group-hover:text-[#FF5A36]">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </main>
    </div>
  );
}
