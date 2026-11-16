'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react';
import { CreatHiveWordmark } from '@/components/brand/CreatHiveWordmark';
import { Surface } from '@/components/ui/Surface';
import { DISCIPLINE_CONFIG } from '@/components/ui/DisciplineChip';
import { useAllPieces, useAllProfiles } from '@/lib/store';
import { toEmbedUrl } from '@/lib/media';

export function PostView({ id }: { id: string }) {
  const { data: pieces, isLoading } = useAllPieces();
  const { data: profiles } = useAllProfiles();

  const piece = (pieces || []).find((p) => p.id === id);
  const author = piece ? (profiles || []).find((p) => p.id === piece.creativeId) : undefined;

  if (isLoading) {
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
  const gallery = piece.galleryImages?.length ? piece.galleryImages : piece.coverImageUrl ? [piece.coverImageUrl] : [];
  const embedUrl = toEmbedUrl(piece.mediaUrl);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href={author ? `/${author.username}` : '/explore'} aria-label="Back" className="rounded-xl border border-stone-200 bg-white p-2">
              <ArrowLeft size={17} weight="bold" />
            </Link>
            <Link href="/" aria-label="CreatHive home">
              <CreatHiveWordmark size="sm" href={null} />
            </Link>
          </div>
          {author ? (
            <Link href={`/${author.username}`} className="text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:text-[#FF5A36]">
              @{author.username}
            </Link>
          ) : null}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={author.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
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
            <video controls src={piece.mediaUrl} poster={piece.coverImageUrl} className="w-full" />
          </Surface>
        ) : null}

        {gallery.length > 0 && piece.mediaType === 'IMAGE_GALLERY' ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {gallery.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={index} src={src} alt={`${piece.title} ${index + 1}`} className="w-full rounded-xl border border-stone-200 object-cover" />
            ))}
          </div>
        ) : null}

        {piece.bodyHtml ? (
          <article className="story-body mt-10" dangerouslySetInnerHTML={{ __html: piece.bodyHtml }} />
        ) : piece.textContent ? (
          <article className="story-body mt-10 whitespace-pre-line font-editorial text-lg italic leading-[1.8] text-stone-800">
            {piece.textContent}
          </article>
        ) : null}

        {piece.pdfUrl ? (
          <Surface className="mt-10 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-500">Case study PDF</p>
            <iframe src={piece.pdfUrl} title="Case study PDF" className="h-[70vh] w-full rounded-lg border border-stone-200" />
            <a href={piece.pdfUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A36]">
              Open PDF <ArrowUpRight size={14} weight="bold" />
            </a>
          </Surface>
        ) : null}

        {piece.tags.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-stone-200 pt-6">
            {piece.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
